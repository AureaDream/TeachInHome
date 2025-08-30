// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'cloud1-3gqdqvkpbeab224c'
})

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()
  
  // 获取手机号
  const { phone } = event
  
  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    return {
      success: false,
      message: '手机号格式不正确'
    }
  }
  
  try {
    // 生成6位随机验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    
    // 在实际项目中，这里应该调用短信服务商的API发送短信
    // 例如：阿里云、腾讯云等提供的短信服务
    // 本示例仅模拟发送，将验证码保存到数据库中
    
    // 查询是否已有该手机号的验证码记录
    const codeCollection = db.collection('sms_codes')
    const existingCode = await codeCollection.where({
      phone: phone
    }).get()
    
    const now = new Date()
    const expireTime = new Date(now.getTime() + 10 * 60 * 1000) // 10分钟有效期
    
    if (existingCode.data.length > 0) {
      // 更新已有记录
      await codeCollection.doc(existingCode.data[0]._id).update({
        data: {
          code: code,
          createTime: now,
          expireTime: expireTime,
          used: false
        }
      })
    } else {
      // 创建新记录
      await codeCollection.add({
        data: {
          phone: phone,
          code: code,
          _openid: wxContext.OPENID,
          createTime: now,
          expireTime: expireTime,
          used: false
        }
      })
    }
    
    return {
      success: true,
      message: '验证码发送成功'
    }
  } catch (err) {
    console.error('发送验证码失败', err)
    return {
      success: false,
      message: '发送验证码失败，请稍后重试',
      error: err
    }
  }
}