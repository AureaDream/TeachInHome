const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { page = 1, pageSize = 10, category = 'all', searchValue = '' } = event;
  const wxContext = cloud.getWXContext();
  
  // === 调试日志开始 ===
  console.log('=== getPosts 云函数调试信息 ===');
  console.log('1. 前端传入参数:', JSON.stringify(event, null, 2));
  console.log('2. 当前用户 OPENID:', wxContext.OPENID);
  console.log('3. 查询参数:', {
    页码: page,
    每页数量: pageSize,
    分类: category,
    搜索关键词: searchValue
  });
  
  try {
    // 构建查询条件
    let whereCondition = {};
    
    // 分类筛选
    if (category && category !== 'all') {
      whereCondition.category = category;
    }
    
    // 搜索条件
    if (searchValue) {
      whereCondition = {
        ...whereCondition,
        $or: [
          { title: db.RegExp({ regexp: searchValue, options: 'i' }) },
          { content: db.RegExp({ regexp: searchValue, options: 'i' }) }
        ]
      };
    }
    
    console.log('4. 构建的查询条件:', JSON.stringify(whereCondition, null, 2));
    
    // 获取帖子列表
    console.log('5. 开始查询帖子列表...');
    const postsResult = await db.collection('posts')
      .where(whereCondition)
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize + 1)
      .get();
    
    console.log('6. 帖子查询结果:', {
      查询到的帖子数量: postsResult.data.length,
      跳过数量: (page - 1) * pageSize,
      限制数量: pageSize
    });
    
    if (postsResult.data.length > 0) {
      console.log('   第一个帖子示例:', {
        ID: postsResult.data[0]._id,
        标题: postsResult.data[0].title,
        作者: postsResult.data[0].authorName,
        创建时间: postsResult.data[0].createTime
      });
    }

    // 获取当前用户的点赞记录
    console.log('7. 开始查询当前用户信息...');
    const userResult = await db.collection('users').where({
      _openid: wxContext.OPENID  // 修复：使用 _openid 而不是 openid
    }).get();
    
    console.log('8. 用户查询结果:', {
      用户数量: userResult.data.length,
      查询条件: { _openid: wxContext.OPENID }
    });
    
    const currentUserId = userResult.data.length > 0 ? userResult.data[0]._id : null;
    console.log('9. 当前用户ID:', currentUserId);
    
    // 处理帖子数据
    console.log('10. 开始处理帖子数据...');
    const rawPosts = postsResult.data.slice(0, pageSize);
    const posts = rawPosts.map(post => {
      // 检查当前用户是否点赞了这个帖子
      const isLiked = currentUserId && post.likedBy && post.likedBy.includes(currentUserId);
      
      return {
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
        viewCount: post.viewCount || 0,
        isLiked: isLiked,
        createTime: formatTime(new Date(post.createTime))  // 修复：移除 this.
      };
    });
    
    console.log('11. 处理后的帖子数据:', {
      处理的帖子数量: posts.length,
      示例帖子: posts.length > 0 ? {
        ID: posts[0].id,
        标题: posts[0].title,
        作者: posts[0].author.name,
        作者头像: posts[0].author.avatar,
        点赞数: posts[0].likeCount,
        是否点赞: posts[0].isLiked
      } : '无帖子'
    });

    // 使用 pageSize+1 判断是否还有更多，避免全表 count
    const hasMore = postsResult.data.length > pageSize;
    
    const result = {
      success: true,
      data: {
        posts,
        hasMore,
        total: undefined
      }
    };
    
    console.log('✅ getPosts 云函数执行成功:', {
      返回帖子数量: posts.length,
      是否还有更多: hasMore
    });
    console.log('=== getPosts 云函数执行完成 ===');
    
    return result;
    
  } catch (error) {
    console.error('获取帖子列表失败:', error);
    return {
      success: false,
      message: '获取帖子列表失败',
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