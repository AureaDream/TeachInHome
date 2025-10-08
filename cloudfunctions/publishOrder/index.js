const cloud = require('wx-server-sdk');

// 初始化云开发环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 管理员用户列表（实际项目中应该从数据库获取）
const ADMIN_OPENIDS = [
  // 这里需要添加管理员的openid
  // 'your-admin-openid-here'
];

/**
 * 发布订单云函数
 * @param {Object} event - 包含订单信息的事件对象
 * @param {Object} context - 云函数上下文
 */
exports.main = async (event, context) => {
  try {
    // 获取用户openid
    const { OPENID } = cloud.getWXContext();
    
    console.log('用户OPENID:', OPENID);
    console.log('接收到的订单数据:', event);
    
    // 验证用户是否为管理员
    if (!ADMIN_OPENIDS.includes(OPENID)) {
      // 如果不在管理员列表中，检查数据库中的管理员权限
      const userResult = await db.collection('users')
        .where({
          _openid: OPENID,
          isAdmin: true
        })
        .get();
      
      if (userResult.data.length === 0) {
        return {
          success: false,
          error: 'PERMISSION_DENIED',
          message: '权限不足，只有管理员可以发布订单'
        };
      }
    }
    
    // 验证必要字段
    const requiredFields = ['title', 'subject', 'grade', 'price', 'location', 'description'];
    for (const field of requiredFields) {
      if (!event[field] || event[field].toString().trim() === '') {
        return {
          success: false,
          error: 'INVALID_PARAMS',
          message: `缺少必要字段: ${field}`
        };
      }
    }
    
    // 构建订单数据
    const orderData = {
      title: event.title.trim(),
      subject: event.subject.trim(),
      grade: event.grade.trim(),
      price: parseFloat(event.price),
      location: event.location.trim(),
      description: event.description.trim(),
      requirements: event.requirements || '',
      contactInfo: event.contactInfo || '',
      publisherId: OPENID,
      status: 'active', // 订单状态：active, completed, cancelled
      createTime: db.serverDate(),
      updateTime: db.serverDate(),
      viewCount: 0,
      applicantCount: 0
    };
    
    // 验证价格
    if (isNaN(orderData.price) || orderData.price <= 0) {
      return {
        success: false,
        error: 'INVALID_PRICE',
        message: '价格必须是大于0的数字'
      };
    }
    
    // 添加订单到数据库
    const result = await db.collection('orders').add({
      data: orderData
    });
    
    console.log('订单创建成功:', result);
    
    return {
      success: true,
      data: {
        orderId: result._id,
        ...orderData
      },
      message: '订单发布成功'
    };
    
  } catch (error) {
    console.error('发布订单失败:', error);
    
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: '服务器内部错误，请稍后重试',
      details: error.message
    };
  }
};