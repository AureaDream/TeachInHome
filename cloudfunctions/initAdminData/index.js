// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'cloud1-3gqdqvkpbeab224c'
})

// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database()
  
  try {
    // 检查管理员集合是否存在数据
    const adminCollection = db.collection('admin_config')
    const existingAdmins = await adminCollection.get()
    
    if (existingAdmins.data.length > 0) {
      return {
        success: true,
        message: '管理员数据已存在，无需重复初始化',
        data: existingAdmins.data
      }
    }
    
    // 创建默认管理员账号
    const defaultAdmin = {
      username: 'admin000',
      password: 'onepeopleonecity', // 实际应用中应该使用加密密码
      nickName: '系统管理员小田',
      avatarUrl: '',
      email: '3152005345@qq.com',
      phone: '',
      permissions: [
        'user_manage',     // 用户管理
        'order_manage',    // 订单管理
        'forum_manage',    // 论坛管理
        'system_manage'    // 系统管理
      ],
      status: 'active',
      createTime: new Date(),
      lastLoginTime: null,
      createdBy: 'system'
    }
    
    // 插入管理员数据
    const result = await adminCollection.add({
      data: defaultAdmin
    })
    
    return {
      success: true,
      message: '管理员数据初始化成功',
      adminId: result._id,
      adminInfo: {
        username: defaultAdmin.username,
        nickName: defaultAdmin.nickName,
        permissions: defaultAdmin.permissions
      }
    }
  } catch (err) {
    console.error('管理员数据初始化失败', err)
    return {
      success: false,
      message: '管理员数据初始化失败',
      error: err.message
    }
  }
}