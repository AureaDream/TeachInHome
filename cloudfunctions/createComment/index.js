const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { postId, content, replyToId } = event;
  
  try {
    // 获取用户信息
    const userResult = await db.collection('users').where({
      _openid: wxContext.OPENID
    }).get();
    
    if (userResult.data.length === 0) {
      return {
        success: false,
        message: '用户信息不存在'
      };
    }
    
    const userInfo = userResult.data[0];
    
    // 验证帖子是否存在
    const postResult = await db.collection('posts').doc(postId).get();
    if (!postResult.data) {
      return {
        success: false,
        message: '帖子不存在'
      };
    }
    
    // 创建评论记录
    const commentData = {
      postId,
      content,
      authorId: userInfo._id,
      authorOpenid: wxContext.OPENID,
      authorName: userInfo.nickName || '匿名用户',
      authorAvatar: userInfo.avatarUrl || '',
      replyToId: replyToId || null, // 回复的评论ID，如果是直接评论帖子则为null
      likeCount: 0,
      likedBy: [],
      createTime: new Date(),
      updateTime: new Date()
    };
    
    // 添加评论
    const commentResult = await db.collection('comments').add({
      data: commentData
    });
    
    // 更新帖子的评论数
    await db.collection('posts').doc(postId).update({
      data: {
        commentCount: _.inc(1),
        updateTime: new Date()
      }
    });
    
    return {
      success: true,
      message: '评论成功',
      commentId: commentResult._id,
      data: commentData
    };
    
  } catch (error) {
    console.error('评论失败:', error);
    return {
      success: false,
      message: '评论失败，请重试',
      error: error.message
    };
  }
};