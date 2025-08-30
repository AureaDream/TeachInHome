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
    // 记录用户退出登录时间
    const userCollection = db.collection('users')
    const user = await userCollection.where({
      _openid: wxContext.OPENID
    }).get()
    
    if (user.data.length > 0) {
      await userCollection.doc(user.data[0]._id).update({
        data: {
          lastLogoutTime: new Date()
        }
      })
    }
    
    return {
      success: true,
      message: '退出登录成功'
    }
  } catch (err) {
    console.error('退出登录失败', err)
    return {
      success: false,
      message: '退出登录失败',
      error: err
    }
  }
}