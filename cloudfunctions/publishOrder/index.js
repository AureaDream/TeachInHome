// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    // 移除权限验证 - 允许所有用户发布订单
    console.log('发布订单请求，当前用户 OPENID:', wxContext.OPENID)
    
    // 获取订单数据
    const {
      orderNumber,
      title,
      studentName,
      subject,
      grade,
      studentGender,
      teacherRequirements,
      location,
      salaryRange,
      hoursRequired,
      description,
      requirements,
      contactInfo
    } = event
    
    // 验证必填字段（移除 price 验证，因为已删除报酬字段）
    if (!title || !studentName || !subject || !grade || !location || !salaryRange || !hoursRequired || !description) {
      return {
        success: false,
        message: '请填写所有必填字段'
      }
    }
    
    // 验证数据类型
    if (isNaN(hoursRequired) || hoursRequired <= 0) {
      return {
        success: false,
        message: '课时要求必须是大于0的数字'
      }
    }
    
    // 生成订单ID（如果没有提供订单编号）
    const orderId = orderNumber || `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // 构造订单数据（移除 price 字段）
    const orderData = {
      orderId,
      orderNumber: orderNumber || orderId,
      title,
      studentName,
      subject,
      grade,
      studentGender: studentGender || '',
      teacherRequirements: teacherRequirements || '',
      location,
      salaryRange,
      hoursRequired: parseInt(hoursRequired),
      description,
      requirements: requirements || '',
      contactInfo: contactInfo || '',
      status: 'pending', // 设置为待接单状态
      publisherId: wxContext.OPENID,
      publisherName: '管理员', // 简化发布者名称
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
      viewCount: 0,
      applicantCount: 0
    }
    
    // 添加到数据库
    const result = await db.collection('orders').add({
      data: orderData
    })
    
    return {
      success: true,
      message: '订单发布成功',
      data: {
        orderId: result._id,
        ...orderData
      }
    }
    
  } catch (error) {
    console.error('发布订单失败:', error)
    return {
      success: false,
      message: '发布订单失败，请稍后重试'
    }
  }
}