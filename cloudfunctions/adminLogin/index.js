// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'cloud1-3gqdqvkpbeab224c'
})

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()
  
  // 获取登录参数
  const { username, password } = event
  
  if (!username || !password) {
    return {
      success: false,
      message: '用户名和密码不能为空'
    }
  }
  
  try {
    // 查询管理员用户
    const adminCollection = db.collection('admin_config')
    const adminResult = await adminCollection.where({
      username: username,
      status: 'active'
    }).get()
    
    if (adminResult.data.length === 0) {
      return {
        success: false,
        message: '管理员账号不存在或已被禁用'
      }
    }
    
    const adminUser = adminResult.data[0]
    
    // 验证密码（实际应用中应该使用加密密码）
    if (adminUser.password !== password) {
      return {
        success: false,
        message: '密码错误'
      }
    }
    
    // 更新最后登录时间
    await adminCollection.doc(adminUser._id).update({
      data: {
        lastLoginTime: new Date()
      }
    })
    
    // 构建管理员信息
    const adminInfo = {
      _id: adminUser._id,
      username: adminUser.username,
      nickName: adminUser.nickName || '管理员',
      avatarUrl: adminUser.avatarUrl || '',
      loginType: 'admin',
      isAdmin: true,
      role: 'admin',
      permissions: adminUser.permissions || ['user_manage', 'order_manage', 'forum_manage'],
      lastLoginTime: new Date(),
      _openid: wxContext.OPENID
    }
    
    // 同时在users表中创建或更新管理员记录（用于统一用户管理）
    const userCollection = db.collection('users')
    const existingUser = await userCollection.where({
      _openid: wxContext.OPENID
    }).get()
    
    if (existingUser.data.length === 0) {
      // 创建用户记录
      await userCollection.add({
        data: {
          nickName: adminInfo.nickName,
          avatarUrl: adminInfo.avatarUrl,
          loginType: 'admin',
          role: 'admin',
          isAdmin: true,
          createTime: new Date(),
          lastLoginTime: new Date(),
          phone: '',
          email: '',
          bio: '系统管理员',
          status: 'active'
        }
      })
    } else {
      // 更新用户记录
      await userCollection.doc(existingUser.data[0]._id).update({
        data: {
          nickName: adminInfo.nickName,
          avatarUrl: adminInfo.avatarUrl,
          role: 'admin',
          isAdmin: true,
          lastLoginTime: new Date()
        }
      })
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
      error: err.message
    }
  }
}