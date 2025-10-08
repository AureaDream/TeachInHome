// 获取帖子详情云函数
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

// 格式化时间函数
function formatTime(date) {
  const now = new Date();
  const diff = now - date;
  
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  
  if (diff < minute) {
    return '刚刚';
  } else if (diff < hour) {
    return Math.floor(diff / minute) + '分钟前';
  } else if (diff < day) {
    return Math.floor(diff / hour) + '小时前';
  } else if (diff < week) {
    return Math.floor(diff / day) + '天前';
  } else if (diff < month) {
    return Math.floor(diff / week) + '周前';
  } else {
    return Math.floor(diff / month) + '个月前';
  }
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { postId } = event;
  
  console.log('=== getPostDetail 云函数调试信息 ===');
  console.log('1. 前端传入参数:', JSON.stringify(event, null, 2));
  console.log('2. 当前用户 OPENID:', wxContext.OPENID);
  console.log('3. 请求的帖子ID:', postId);
  
  try {
    if (!postId) {
      return {
        success: false,
        message: '帖子ID不能为空'
      };
    }
    
    // 获取当前用户信息
    console.log('4. 开始查询用户信息...');
    const userResult = await db.collection('users').where({
      _openid: wxContext.OPENID
    }).get();
    
    console.log('5. 用户查询结果:', {
      找到用户数量: userResult.data.length,
      用户信息: userResult.data.length > 0 ? {
        ID: userResult.data[0]._id,
        昵称: userResult.data[0].nickName
      } : '未找到用户'
    });
    
    const currentUser = userResult.data.length > 0 ? userResult.data[0] : null;
    
    // 获取帖子详情
    console.log('6. 开始查询帖子详情...');
    const postResult = await db.collection('posts').doc(postId).get();
    
    if (!postResult.data) {
      console.log('❌ 帖子不存在');
      return {
        success: false,
        message: '帖子不存在'
      };
    }
    
    const post = postResult.data;
    console.log('7. 帖子查询结果:', {
      帖子ID: post._id,
      标题: post.title,
      作者ID: post.authorId,
      作者名称: post.authorName,
      点赞数: post.likeCount || 0,
      评论数: post.commentCount || 0,
      浏览数: post.viewCount || 0
    });
    
    // 检查当前用户是否点赞了这个帖子
    const isLiked = currentUser && post.likedUsers ? post.likedUsers.includes(currentUser._id) : false;
    
    console.log('8. 点赞状态检查:', {
      当前用户ID: currentUser ? currentUser._id : '未登录',
      帖子点赞用户列表: post.likedUsers || [],
      是否已点赞: isLiked
    });
    
    // 增加浏览数
    console.log('9. 更新帖子浏览数...');
    await db.collection('posts').doc(postId).update({
      data: {
        viewCount: _.inc(1)
      }
    });
    
    // 格式化帖子数据
    const formattedPost = {
      id: post._id,
      title: post.title,
      content: post.content,
      summary: post.summary,
      category: post.category,
      author: {
        id: post.authorId,
        name: post.authorName,
        avatar: post.authorAvatar
      },
      images: post.images || [],
      likeCount: post.likeCount || 0,
      commentCount: post.commentCount || 0,
      viewCount: (post.viewCount || 0) + 1, // 包含刚刚增加的浏览数
      isLiked: isLiked,
      createTime: formatTime(new Date(post.createTime))
    };
    
    console.log('10. 格式化后的帖子数据:', {
      ID: formattedPost.id,
      标题: formattedPost.title,
      作者: formattedPost.author.name,
      点赞数: formattedPost.likeCount,
      评论数: formattedPost.commentCount,
      浏览数: formattedPost.viewCount,
      是否点赞: formattedPost.isLiked
    });
    
    const result = {
      success: true,
      data: formattedPost
    };
    
    console.log('✅ getPostDetail 云函数执行成功');
    console.log('=== getPostDetail 云函数执行完成 ===');
    
    return result;
    
  } catch (error) {
    console.error('❌ 获取帖子详情失败:', {
      错误类型: error.name,
      错误信息: error.message,
      错误堆栈: error.stack
    });
    
    return {
      success: false,
      message: '获取帖子详情失败',
      error: error.message
    };
  }
};