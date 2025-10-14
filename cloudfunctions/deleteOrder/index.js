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
    
    // 简化权限验证 - 允许所有登录用户删除订单（管理员功能）
    console.log('删除订单请求 - 用户OPENID:', OPENID)
    
    const { orderId } = event
    
    // 验证必填字段
    if (!orderId) {
      return {
        success: false,
        message: '订单ID不能为空'
      }
    }
    
    console.log('准备删除订单ID:', orderId)
    
    // 删除订单
    const deleteResult = await db.collection('orders').doc(orderId).remove()
    
    console.log('删除结果:', deleteResult)
    
    if (deleteResult.stats.removed === 1) {
      return {
        success: true,
        message: '订单删除成功'
      }
    } else {
      return {
        success: false,
        message: '订单不存在或删除失败'
      }
    }
    
  } catch (error) {
    console.error('删除订单失败:', error)
    return {
      success: false,
      message: '删除订单失败: ' + error.message
    }
  }
}