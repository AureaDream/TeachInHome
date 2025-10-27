// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'cloud1-3gqdqvkpbeab224c'
})

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()
  
  // 获取手机号和验证码
  const { phone, code } = event
  
  if (!phone || !code) {
    return {
      success: false,
      message: '手机号或验证码不能为空'
    }
  }
  
  try {
    // 查询验证码记录
    const codeCollection = db.collection('sms_codes')
    const codeRecord = await codeCollection.where({
      phone: phone,
      code: code,
      used: false
    }).get()
    
    if (codeRecord.data.length === 0) {
      return {
        success: false,
        message: '验证码不正确或已过期'
      }
    }
    
    const smsCode = codeRecord.data[0]
    const now = new Date()
    
    // 检查验证码是否过期
    if (now > new Date(smsCode.expireTime)) {
      return {
        success: false,
        message: '验证码已过期'
      }
    }
    
    // 标记验证码为已使用
    await codeCollection.doc(smsCode._id).update({
      data: {
        used: true,
        useTime: now
      }
    })
    
    return {
      success: true,
      message: '验证成功',
      openid: wxContext.OPENID
    }
  } catch (err) {
    console.error('验证码验证失败', err)
    return {
      success: false,
      message: '验证失败，请稍后重试',
      error: err
    }
  }
}