// 删除评论云函数
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { commentId } = event;
  
  console.log('删除评论 - 用户openid:', wxContext.OPENID, '评论ID:', commentId);
  
  try {
    // 获取评论信息
    const commentResult = await db.collection('comments').doc(commentId).get();
    
    if (!commentResult.data) {
      return {
        success: false,
        message: '评论不存在'
      };
    }
    
    const comment = commentResult.data;
    console.log('评论信息:', {
      authorOpenid: comment.authorOpenid,
      currentUserOpenid: wxContext.OPENID
    });
    
    // 检查是否是评论作者 - 使用authorOpenid字段进行比较
    if (comment.authorOpenid !== wxContext.OPENID) {
      return {
        success: false,
        message: '只能删除自己的评论'
      };
    }
    
    // 删除评论
    await db.collection('comments').doc(commentId).remove();
    
    // 更新对应帖子的评论数量
    await db.collection('posts').doc(comment.postId).update({
      data: {
        commentCount: _.inc(-1)
      }
    });
    
    console.log('删除评论成功，评论ID:', commentId);
    
    return {
      success: true,
      message: '删除成功'
    };
    
  } catch (error) {
    console.error('删除评论失败:', error);
    return {
      success: false,
      message: '删除失败'
    };
  }
};