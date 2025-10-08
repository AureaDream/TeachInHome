// 获取用户评论云函数
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { page = 1, pageSize = 10 } = event;
  
  console.log('获取用户评论，用户openid:', wxContext.OPENID);
  
  try {
    // 直接使用 authorOpenid 字段查询评论
    const commentsResult = await db.collection('comments')
      .where({
        authorOpenid: wxContext.OPENID
      })
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();

    console.log('查询到的评论数量:', commentsResult.data.length);

    // 获取评论对应的帖子标题
    const postIds = [...new Set(commentsResult.data.map(comment => comment.postId))];
    const postsResult = await db.collection('posts')
      .where({
        _id: _.in(postIds)
      })
      .field({
        _id: true,
        title: true
      })
      .get();
    
    // 创建帖子ID到标题的映射
    const postTitleMap = {};
    postsResult.data.forEach(post => {
      postTitleMap[post._id] = post.title;
    });
    
    // 格式化评论数据
    const comments = commentsResult.data.map(comment => {
      return {
        id: comment._id,
        content: comment.content,
        postId: comment.postId,
        postTitle: postTitleMap[comment.postId] || '帖子已删除',
        author: {
          id: comment.author?.id || comment.authorOpenid,
          name: comment.author?.name || '匿名用户',
          avatar: comment.author?.avatar || ''
        },
        likeCount: comment.likeCount || 0,
        isLiked: comment.likedUsers ? comment.likedUsers.includes(wxContext.OPENID) : false,
        createTime: formatTime(comment.createTime)
      };
    });

    console.log('返回评论数据:', comments.length);
    
    return {
      success: true,
      data: comments
    };
    
  } catch (error) {
    console.error('获取用户评论失败:', error);
    return {
      success: false,
      message: '获取评论失败'
    };
  }
};

// 格式化时间
function formatTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) {
    return '刚刚';
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`;
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`;
  } else if (diff < 2592000000) {
    return `${Math.floor(diff / 86400000)}天前`;
  } else {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
}