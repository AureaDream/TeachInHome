// 获取用户帖子云函数
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { page = 1, pageSize = 10 } = event;
  
  try {
    console.log('获取我的帖子 - 用户openid:', wxContext.OPENID);
    
    // 直接通过authoropenid字段查询用户的帖子，无需先查询用户信息
    const postsResult = await db.collection('posts')
      .where({
        authorOpenid: wxContext.OPENID
      })
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();
    
    console.log('查询到的帖子数量:', postsResult.data.length);
    
    // 格式化帖子数据
    const posts = postsResult.data.map(post => {
      return {
        id: post._id,
        title: post.title,
        content: post.content,
        summary: post.summary,
        images: post.images || [],
        category: post.category,
        author: {
          id: post.author?.id || '',
          name: post.author?.name || post.authorName || '匿名用户',
          avatar: post.author?.avatar || ''
        },
        likeCount: post.likeCount || 0,
        commentCount: post.commentCount || 0,
        viewCount: post.viewCount || 0,
        isLiked: false, // 在我的帖子页面不需要显示点赞状态
        createTime: formatTime(post.createTime)
      };
    });
    
    return {
      success: true,
      data: posts
    };
    
  } catch (error) {
    console.error('获取用户帖子失败:', error);
    return {
      success: false,
      message: '获取帖子失败'
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