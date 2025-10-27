// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 批量标记当前用户的未读通知为已读
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  try {
    // 获取用户文档，使用 openid 关联
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

    // 查询未读通知
    const unreadResult = await db.collection('notifications')
      .where({
        userId,
        read: false
      })
      .get()

    if (!unreadResult.data || unreadResult.data.length === 0) {
      return {
        success: true,
        message: '无未读通知',
        updated: 0
      }
    }

    // 逐条更新为已读（保证与 deleteNotification 同样的所有权校验风格）
    const tasks = unreadResult.data.map(n => {
      return db.collection('notifications')
        .doc(n._id)
        .update({
          data: {
            read: true,
            readTime: new Date()
          }
        })
    })

    const results = await Promise.allSettled(tasks)
    const updated = results.filter(r => r.status === 'fulfilled').length

    return {
      success: true,
      message: '标记已读完成',
      updated
    }
  } catch (err) {
    console.error('markNotificationsRead error:', err)
    return {
      success: false,
      message: err && err.message ? err.message : '服务异常'
    }
  }
}