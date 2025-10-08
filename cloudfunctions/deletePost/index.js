// 删除帖子云函数
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { postId } = event;
  
  try {
    console.log('删除帖子 - 用户openid:', wxContext.OPENID, '帖子ID:', postId);
    
    // 获取帖子信息
    const postResult = await db.collection('posts').doc(postId).get();
    
    if (!postResult.data) {
      return {
        success: false,
        message: '帖子不存在'
      };
    }
    
    const post = postResult.data;
    console.log('帖子信息:', {
      authorOpenid: post.authorOpenid,
      currentUserOpenid: wxContext.OPENID
    });
    
    // 检查是否是帖子作者 - 使用authorOpenid字段进行比较
    if (post.authorOpenid !== wxContext.OPENID) {
      return {
        success: false,
        message: '只能删除自己的帖子'
      };
    }
    
    // 删除帖子相关的评论
    await db.collection('comments').where({
      postId: postId
    }).remove();
    
    // 删除帖子
    await db.collection('posts').doc(postId).remove();
    
    // 如果帖子有图片，删除云存储中的图片
    if (post.images && post.images.length > 0) {
      try {
        const fileIds = post.images.map(imageUrl => {
          // 从URL中提取fileID
          const match = imageUrl.match(/cloud:\/\/([^/]+)\/([^?]+)/);
          return match ? `cloud://${match[1]}/${match[2]}` : null;
        }).filter(Boolean);
        
        if (fileIds.length > 0) {
          await cloud.deleteFile({
            fileList: fileIds
          });
        }
      } catch (deleteError) {
        console.error('删除图片失败:', deleteError);
        // 图片删除失败不影响帖子删除
      }
    }
    
    return {
      success: true,
      message: '删除成功'
    };
    
  } catch (error) {
    console.error('删除帖子失败:', error);
    return {
      success: false,
      message: '删除失败'
    };
  }
};