// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'cloud1-3gqdqvkpbeab224c'
})

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()
  
  try {
    // 获取当前用户信息
    const userResult = await db.collection('users')
      .where({
        _openid: wxContext.OPENID
      })
      .get()
    
    if (userResult.data.length === 0) {
      return {
        success: false,
        message: '用户信息不存在，请先登录'
      }
    }
    
    const userId = userResult.data[0]._id
    
    // 检查是否已有通知数据
    const existingNotifications = await db.collection('notifications')
      .where({
        userId: userId
      })
      .get()
    
    if (existingNotifications.data.length > 0) {
      return {
        success: true,
        message: '通知数据已存在',
        count: existingNotifications.data.length
      }
    }
    
    // 创建测试通知数据
    const testNotifications = [
      {
        userId: userId,
        title: '系统通知',
        content: '欢迎使用我们的小程序！您可以在这里查看所有重要通知。',
        read: false,
        createTime: new Date(),
        type: 'system'
      },
      {
        userId: userId,
        title: '订单更新',
        content: '您发布的家教订单已有新的应聘者，请及时查看。',
        read: false,
        createTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2小时前
        type: 'order'
      },
      {
        userId: userId,
        title: '论坛回复',
        content: '您在论坛发布的帖子收到了新的回复，快去看看吧！',
        read: true,
        createTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1天前
        type: 'forum'
      },
      {
        userId: userId,
        title: '活动通知',
        content: '本周末将举办线下家教交流活动，欢迎参加！',
        read: false,
        createTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3天前
        type: 'activity'
      },
      {
        userId: userId,
        title: '安全提醒',
        content: '请注意保护个人信息安全，不要轻易透露个人隐私。',
        read: true,
        createTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7天前
        type: 'security'
      }
    ]
    
    // 批量插入通知数据
    const insertPromises = testNotifications.map(notification => 
      db.collection('notifications').add({
        data: notification
      })
    )
    
    const results = await Promise.all(insertPromises)
    
    return {
      success: true,
      message: '通知数据初始化成功',
      count: results.length,
      insertedIds: results.map(r => r._id)
    }
    
  } catch (err) {
    console.error('初始化通知数据失败', err)
    return {
      success: false,
      message: '初始化通知数据失败',
      error: err.message
    }
  }
}