const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { postId, page = 1, pageSize = 20 } = event;
  const wxContext = cloud.getWXContext();
  
  try {
    // 获取评论列表
    const commentsResult = await db.collection('comments')
      .where({
        postId: postId
      })
      .orderBy('createTime', 'asc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();
    
    // 获取当前用户信息
    const userResult = await db.collection('users').where({
      openid: wxContext.OPENID
    }).get();
    
    const currentUserId = userResult.data.length > 0 ? userResult.data[0]._id : null;
    
    // 处理评论数据
    const comments = commentsResult.data.map(comment => {
      // 检查当前用户是否点赞了这个评论
      const isLiked = currentUserId && comment.likedBy && comment.likedBy.includes(currentUserId);
      
      return {
        id: comment._id,
        content: comment.content,
        author: {
          id: comment.authorId,
          name: comment.authorName,
          avatar: comment.authorAvatar
        },
        replyToId: comment.replyToId,
        likeCount: comment.likeCount || 0,
        isLiked: isLiked,
        createTime: formatTime(new Date(comment.createTime))
      };
    });
    
    // 获取总数用于判断是否还有更多数据
    const totalResult = await db.collection('comments')
      .where({
        postId: postId
      })
      .count();
    
    const hasMore = (page * pageSize) < totalResult.total;
    
    return {
      success: true,
      data: {
        comments,
        hasMore,
        total: totalResult.total
      }
    };
    
  } catch (error) {
    console.error('获取评论列表失败:', error);
    return {
      success: false,
      message: '获取评论列表失败',
      error: error.message
    };
  }
};

// 格式化时间
function formatTime(date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  
  if (diff < minute) {
    return '刚刚';
  } else if (diff < hour) {
    return Math.floor(diff / minute) + '分钟前';
  } else if (diff < day) {
    return Math.floor(diff / hour) + '小时前';
  } else if (diff < week) {
    return Math.floor(diff / day) + '天前';
  } else {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}