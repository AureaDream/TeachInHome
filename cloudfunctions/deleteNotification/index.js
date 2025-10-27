// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { notificationId } = event

  console.log('删除通知请求:', {
    notificationId,
    openid: wxContext.OPENID
  })

  try {
    // 验证参数
    if (!notificationId) {
      return {
        success: false,
        message: '通知ID不能为空'
      }
    }

    // 获取用户信息
    const userResult = await db.collection('users')
      .where({
        _openid: wxContext.OPENID
      })
      .get()

    if (userResult.data.length === 0) {
      return {
        success: false,
        message: '用户不存在'
      }
    }

    const userId = userResult.data[0]._id

    // 查询要删除的通知，确保只能删除自己的通知
    const notificationResult = await db.collection('notifications')
      .doc(notificationId)
      .get()

    if (!notificationResult.data) {
      return {
        success: false,
        message: '通知不存在'
      }
    }

    // 验证通知所有权
    if (notificationResult.data.userId !== userId) {
      return {
        success: false,
        message: '无权限删除此通知'
      }
    }

    // 删除通知
    const deleteResult = await db.collection('notifications')
      .doc(notificationId)
      .remove()

    console.log('删除通知结果:', deleteResult)

    if (deleteResult.stats && deleteResult.stats.removed > 0) {
      return {
        success: true,
        message: '删除成功',
        data: {
          notificationId,
          deletedAt: new Date()
        }
      }
    } else {
      return {
        success: false,
        message: '删除失败，通知可能已被删除'
      }
    }

  } catch (error) {
    console.error('删除通知失败:', error)
    
    return {
      success: false,
      message: '删除失败，请稍后重试',
      error: error.message
    }
  }
}