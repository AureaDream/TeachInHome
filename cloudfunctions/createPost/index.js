const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { title, content, category, images } = event;
  
  // === 调试日志开始 ===
  console.log('=== createPost 云函数调试信息 ===');
  console.log('1. 前端传入参数:', JSON.stringify(event, null, 2));
  console.log('2. 当前用户 OPENID:', wxContext.OPENID);
  console.log('3. 微信上下文信息:', {
    OPENID: wxContext.OPENID,
    APPID: wxContext.APPID,
    UNIONID: wxContext.UNIONID
  });

  try {
    // 获取用户信息
    console.log('4. 开始查询用户信息...');
    const userResult = await db.collection('users').where({
      _openid: wxContext.OPENID
    }).get();
    
    console.log('5. 用户查询结果:', {
      总数: userResult.data.length,
      查询条件: { _openid: wxContext.OPENID },
      用户数据: userResult.data.length > 0 ? userResult.data[0] : '无数据'
    });

    if (userResult.data.length === 0) {
      console.log('❌ 用户信息不存在，返回错误');
      return {
        success: false,
        message: '用户信息不存在'
      };
    }
    
    const userInfo = userResult.data[0];
    console.log('6. 获取到的用户信息:', {
      用户ID: userInfo._id,
      昵称: userInfo.nickName,
      头像: userInfo.avatarUrl ? '有头像' : '无头像'
    });
    
    // 处理图片上传到云存储
    const uploadedImages = [];
    if (images && images.length > 0) {
      console.log('7. 开始处理图片上传，图片数量:', images.length);
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const fileExtension = image.split('.').pop();
        const fileName = `cloud-storage/post-images/${Date.now()}-${i}.${fileExtension}`;
        
        try {
          const uploadResult = await cloud.uploadFile({
            cloudPath: fileName,
            fileContent: Buffer.from(image, 'base64')
          });
          uploadedImages.push(uploadResult.fileID);
          console.log(`   图片 ${i + 1} 上传成功:`, uploadResult.fileID);
        } catch (uploadError) {
          console.error(`   图片 ${i + 1} 上传失败:`, uploadError);
        }
      }
    } else {
      console.log('7. 无图片需要上传');
    }
    
    // 创建帖子记录
    console.log('8. 开始创建帖子记录...');
    const postData = {
      title,
      content,
      summary: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
      category,
      author: {
        id: userInfo._id,
        name: userInfo.nickName || '匿名用户',
        avatar: userInfo.avatarUrl || ''
      },
      authorId: userInfo._id,
      authorOpenid: wxContext.OPENID,
      authorName: userInfo.nickName || '匿名用户',
      authorAvatar: userInfo.avatarUrl || '',
      images: uploadedImages,
      likeCount: 0,
      commentCount: 0,
      viewCount: 0,
      likedBy: [],
      createTime: new Date(),
      updateTime: new Date()
    };
    
    console.log('9. 帖子数据准备完成:', {
      标题: postData.title,
      内容长度: postData.content.length,
      分类: postData.category,
      作者: postData.authorName,
      图片数量: postData.images.length
    });
    
    const result = await db.collection('posts').add({
      data: postData
    });
    
    console.log('✅ 帖子创建成功:', {
      帖子ID: result._id,
      创建时间: new Date().toISOString()
    });
    console.log('=== createPost 云函数执行完成 ===');
    
    return {
      success: true,
      message: '发帖成功',
      postId: result._id,
      data: postData
    };
    
  } catch (error) {
    console.error('发帖失败:', error);
    return {
      success: false,
      message: '发帖失败，请重试',
      error: error.message
    };
  }
};