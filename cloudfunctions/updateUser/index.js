// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'cloud1-3gqdqvkpbeab224c'
})

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()
  
  // 获取更新参数
  const { 
    userId,
    updateData,
    currentAdminUsername = '' // 当前管理员的用户名
  } = event
  
  if (!userId || !updateData) {
    return {
      success: false,
      message: '缺少必要参数'
    }
  }
  
  try {
    // 验证管理员权限
    if (!currentAdminUsername) {
      return {
        success: false,
        message: '缺少管理员身份验证'
      }
    }
    
    // 验证当前用户是否为管理员
    const adminResult = await db.collection('admin_config').where({
      username: currentAdminUsername,
      status: 'active'
    }).get()
    
    if (adminResult.data.length === 0) {
      return {
        success: false,
        message: '无管理员权限'
      }
    }
    
    const currentAdmin = adminResult.data[0]
    
    // 获取要更新的用户信息
    const userResult = await db.collection('users').doc(userId).get()
    
    if (!userResult.data) {
      return {
        success: false,
        message: '用户不存在'
      }
    }
    
    const user = userResult.data
    
    // 准备更新数据
    const updateFields = {
      updateTime: new Date(),
      updatedBy: currentAdmin.username
    }
    
    // 允许更新的字段
    const allowedFields = ['nickName', 'phone', 'email', 'role', 'status']
    
    for (const field of allowedFields) {
      if (updateData.hasOwnProperty(field)) {
        updateFields[field] = updateData[field]
      }
    }
    
    // 如果角色变更为管理员，需要在admin_config中创建记录
    if (updateData.role === 'admin' && user.role !== 'admin') {
      // 检查是否已存在管理员配置
      const existingAdminConfig = await db.collection('admin_config').where({
        _openid: user._openid
      }).get()
      
      if (existingAdminConfig.data.length === 0) {
        // 创建管理员配置记录
        const adminUsername = `admin_${user._openid.slice(-8)}` // 使用openid后8位作为用户名
        
        await db.collection('admin_config').add({
          data: {
            username: adminUsername,
            password: 'defaultPassword123', // 默认密码，实际应用中应该要求管理员设置
            nickName: user.nickName || '管理员',
            avatarUrl: user.avatarUrl || '',
            email: user.email || '',
            phone: user.phone || '',
            _openid: user._openid,
            permissions: [
              'user_manage',
              'order_manage',
              'forum_manage'
            ],
            status: 'active',
            createTime: new Date(),
            lastLoginTime: null,
            createdBy: currentAdmin.username
          }
        })
      }
    }
    
    // 如果角色从管理员变更为普通用户，需要禁用admin_config中的记录
    if (updateData.role === 'user' && user.role === 'admin') {
      await db.collection('admin_config').where({
        _openid: user._openid
      }).update({
        data: {
          status: 'inactive',
          updateTime: new Date(),
          updatedBy: currentAdmin.username
        }
      })
    }
    
    // 更新用户信息
    await db.collection('users').doc(userId).update({
      data: updateFields
    })
    
    // 获取更新后的用户信息
    const updatedUserResult = await db.collection('users').doc(userId).get()
    const updatedUser = updatedUserResult.data
    
    // 格式化返回数据
    const formattedUser = {
      userId: updatedUser._id,
      _openid: updatedUser._openid,
      nickName: updatedUser.nickName || '未设置',
      avatarUrl: updatedUser.avatarUrl || 'https://tdesign.gtimg.com/miniprogram/images/avatar1.png',
      role: updatedUser.role || 'user',
      status: updatedUser.status || 'active',
      phone: updatedUser.phone || '',
      email: updatedUser.email || '',
      orderCount: updatedUser.orderCount || 0,
      postCount: updatedUser.postCount || 0,
      registerTime: updatedUser.createTime ? 
        new Date(updatedUser.createTime).toLocaleDateString('zh-CN') : 
        '未知',
      createTime: updatedUser.createTime,
      lastLoginTime: updatedUser.lastLoginTime,
      updateTime: updatedUser.updateTime,
      updatedBy: currentAdmin.username
    }
    
    return {
      success: true,
      message: '用户信息更新成功',
      data: {
        user: formattedUser,
        updatedBy: currentAdmin.username,
        updateTime: new Date()
      }
    }
  } catch (err) {
    console.error('更新用户信息失败', err)
    return {
      success: false,
      message: '更新用户信息失败',
      error: err.message
    }
  }
}