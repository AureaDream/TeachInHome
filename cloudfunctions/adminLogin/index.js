// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'cloud1-3gqdqvkpbeab224c'
})

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()
  
  // 获取密码
  const { password } = event
  
  if (!password) {
    return {
      success: false,
      message: '密码不能为空'
    }
  }
  
  try {
    // 查询管理员配置
    const adminCollection = db.collection('admin_config')
    const adminConfig = await adminCollection.where({
      configType: 'adminPassword'
    }).get()
    
    // 如果没有配置记录，使用默认密码
    const correctPassword = adminConfig.data.length > 0 
      ? adminConfig.data[0].value 
      : 'admin123' // 默认密码，实际应用中应该在初始化时设置更复杂的密码
    
    if (password !== correctPassword) {
      return {
        success: false,
        message: '密码错误'
      }
    }
    
    // 登录成功，返回管理员信息
    const adminInfo = {
      nickName: '管理员',
      avatarUrl: '',
      loginType: 'admin',
      isAdmin: true,
      _openid: wxContext.OPENID,
      role: 'admin',
      lastLoginTime: new Date()
    }
    
    // 检查管理员用户是否已存在
    const userCollection = db.collection('users')
    const adminUser = await userCollection.where({
      _openid: wxContext.OPENID,
      role: 'admin'
    }).get()
    
    if (adminUser.data.length === 0) {
      // 创建管理员用户记录
      const result = await userCollection.add({
        data: {
          ...adminInfo,
          createTime: new Date(),
          phone: '',
          email: '',
          bio: '',
          status: 'active'
        }
      })
      
      adminInfo._id = result._id
    } else {
      // 更新管理员登录时间
      await userCollection.doc(adminUser.data[0]._id).update({
        data: {
          lastLoginTime: new Date()
        }
      })
      
      adminInfo._id = adminUser.data[0]._id
    }
    
    return {
      success: true,
      message: '登录成功',
      adminInfo
    }
  } catch (err) {
    console.error('管理员登录失败', err)
    return {
      success: false,
      message: '登录失败，请稍后重试',
      error: err
    }
  }
}