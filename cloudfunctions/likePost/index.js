const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { postId, isLike } = event; // isLike: true为点赞，false为取消点赞
  
  try {
    // 获取用户信息
    let userResult = await db.collection('users').where({
      _openid: wxContext.OPENID
    }).get();
    
    let userId;
    
    if (userResult.data.length === 0) {
      // 用户不存在，创建用户记录
      console.log('用户不存在，创建新用户记录，OPENID:', wxContext.OPENID);
      
      const newUser = {
        nickName: '微信用户',
        avatarUrl: '',
        loginType: 'wechat',
        isAuthenticated: false,
        createTime: new Date(),
        lastLoginTime: new Date(),
        phone: '',
        email: '',
        bio: '',
        role: 'user',
        isAdmin: false,
        status: 'active'
      };
      
      const createResult = await db.collection('users').add({
        data: newUser
      });
      
      userId = createResult._id;
      console.log('创建用户成功，用户ID:', userId);
    } else {
      userId = userResult.data[0]._id;
      console.log('找到用户，用户ID:', userId);
    }
    
    // 验证帖子是否存在
    const postResult = await db.collection('posts').doc(postId).get();
    if (!postResult.data) {
      return {
        success: false,
        message: '帖子不存在'
      };
    }
    
    const post = postResult.data;
    const likedBy = post.likedBy || [];
    const currentLikeCount = post.likeCount || 0;
    
    let updateData = {};
    
    if (isLike) {
      // 点赞操作
      if (!likedBy.includes(userId)) {
        updateData = {
          likedBy: _.push(userId),
          likeCount: _.inc(1),
          updateTime: new Date()
        };
      } else {
        return {
          success: false,
          message: '已经点赞过了'
        };
      }
    } else {
      // 取消点赞操作
      if (likedBy.includes(userId)) {
        updateData = {
          likedBy: _.pull(userId),
          likeCount: _.inc(-1),
          updateTime: new Date()
        };
      } else {
        return {
          success: false,
          message: '还未点赞'
        };
      }
    }
    
    // 更新帖子
    await db.collection('posts').doc(postId).update({
      data: updateData
    });
    
    // 获取更新后的点赞数
    const updatedPost = await db.collection('posts').doc(postId).get();
    
    return {
      success: true,
      message: isLike ? '点赞成功' : '取消点赞成功',
      data: {
        likeCount: updatedPost.data.likeCount,
        isLiked: isLike
      }
    };
    
  } catch (error) {
    console.error('点赞操作失败:', error);
    return {
      success: false,
      message: '操作失败，请重试',
      error: error.message
    };
  }
};