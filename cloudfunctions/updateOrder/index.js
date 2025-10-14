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
    // 获取用户信息
    const { OPENID } = wxContext
    
    // 简化权限验证 - 允许所有登录用户更新订单（管理员功能）
    console.log('更新订单请求 - 用户OPENID:', OPENID)
    
    const { 
      orderId, 
      title, 
      studentName, 
      subject, 
      educationStage, 
      grade, 
      studentGender, 
      teacherRequirements, 
      location, 
      salaryRange, 
      hoursRequired, 
      description, 
      requirements, 
      contactInfo, 
      status 
    } = event
    
    // 验证必填字段
    if (!orderId) {
      return {
        success: false,
        message: '订单ID不能为空'
      }
    }
    
    if (!title || !studentName || !subject || !educationStage || !salaryRange) {
      return {
        success: false,
        message: '请填写完整的订单信息'
      }
    }
    
    console.log('准备更新订单ID:', orderId)
    
    // 构建更新数据
    const updateData = {
      title: title.trim(),
      studentName: studentName.trim(),
      subject: subject.trim(),
      educationStage: educationStage.trim(),
      grade: grade ? grade.trim() : '',
      studentGender: studentGender ? studentGender.trim() : '',
      teacherRequirements: teacherRequirements ? teacherRequirements.trim() : '',
      location: location ? location.trim() : '',
      salaryRange: salaryRange.trim(),
      hoursRequired: hoursRequired || 0,
      description: description ? description.trim() : '',
      requirements: requirements ? requirements.trim() : '',
      contactInfo: contactInfo ? contactInfo.trim() : '',
      status: status || 'pending',
      updateTime: new Date()
    }
    
    console.log('更新数据:', updateData)
    
    // 更新订单
    const updateResult = await db.collection('orders').doc(orderId).update({
      data: updateData
    })
    
    console.log('更新结果:', updateResult)
    
    if (updateResult.stats.updated === 1) {
      return {
        success: true,
        message: '订单更新成功',
        data: updateData
      }
    } else {
      return {
        success: false,
        message: '订单不存在或更新失败'
      }
    }
    
  } catch (error) {
    console.error('更新订单失败:', error)
    return {
      success: false,
      message: '更新订单失败: ' + error.message
    }
  }
}