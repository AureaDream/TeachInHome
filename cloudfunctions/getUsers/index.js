// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'cloud1-3gqdqvkpbeab224c'
})

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()
  
  // 获取查询参数
  const { 
    page = 1, 
    pageSize = 10, 
    searchValue = '', 
    statusValue = 'all', 
    roleValue = 'all',
    currentAdminUsername = '' // 当前管理员的用户名，用于区分不同管理员
  } = event
  
  try {
    // 验证管理员权限
    console.log('getUsers - 接收到的currentAdminUsername:', currentAdminUsername);
    
    if (!currentAdminUsername) {
      console.log('getUsers - currentAdminUsername为空');
      return {
        success: false,
        message: '缺少管理员身份验证'
      }
    }
    
    // 验证当前用户是否为管理员
    console.log('getUsers - 查询admin_config集合，username:', currentAdminUsername);
    const adminResult = await db.collection('admin_config').where({
      username: currentAdminUsername,
      status: 'active'
    }).get()
    
    console.log('getUsers - admin_config查询结果:', JSON.stringify(adminResult, null, 2));
    
    if (adminResult.data.length === 0) {
      console.log('getUsers - 未找到匹配的管理员记录');
      return {
        success: false,
        message: '无管理员权限'
      }
    }
    
    const currentAdmin = adminResult.data[0]
    console.log('getUsers - 找到管理员记录:', JSON.stringify(currentAdmin, null, 2));
    
    // 构建查询条件
    let whereCondition = {}
    
    // 角色筛选
    if (roleValue !== 'all') {
      whereCondition.role = roleValue
    }
    
    // 状态筛选
    if (statusValue !== 'all') {
      whereCondition.status = statusValue
    }
    
    // 搜索条件
    if (searchValue) {
      // 使用正则表达式进行模糊搜索
      const searchRegex = db.RegExp({
        regexp: searchValue,
        options: 'i'
      })
      whereCondition = db.command.or([
        { nickName: searchRegex },
        { phone: searchRegex },
        { email: searchRegex }
      ])
    }
    
    // 查询用户数据（采用 pageSize+1 方式判断 hasMore，避免全表 count）
    const usersQuery = db.collection('users')
      .where(whereCondition)
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize + 1);

    const usersResult = await usersQuery.get();
    const hasMore = usersResult.data.length > pageSize;
    const pageUsers = usersResult.data.slice(0, pageSize);
    
    // 获取管理员列表，用于标识哪些用户是管理员
    const adminConfigResult = await db.collection('admin_config').where({
      status: 'active'
    }).get()
    
    const adminOpenIds = new Set()
    const adminUsernames = {}
    
    // 建立管理员openid和username的映射关系
    for (const admin of adminConfigResult.data) {
      if (admin._openid) {
        adminOpenIds.add(admin._openid)
        adminUsernames[admin._openid] = admin.username
      }
    }
    
    // 处理用户数据，添加管理员信息和创建时间格式化
    const processedUsers = pageUsers.map(user => {
      // 判断是否为管理员
      const isAdmin = adminOpenIds.has(user._openid) || user.role === 'admin'
      const adminUsername = adminUsernames[user._openid] || ''
      
      // 格式化创建时间
      const createTime = user.createTime ? 
        new Date(user.createTime).toLocaleDateString('zh-CN') : 
        '未知'
      
      return {
        userId: user._id,
        _openid: user._openid,
        nickName: user.nickName || '未设置',
        avatarUrl: user.avatarUrl || 'https://tdesign.gtimg.com/miniprogram/images/avatar1.png',
        role: isAdmin ? 'admin' : 'user',
        status: user.status || 'active',
        phone: user.phone || '',
        email: user.email || '',
        orderCount: user.orderCount || 0,
        postCount: user.postCount || 0,
        registerTime: createTime,
        createTime: user.createTime,
        lastLoginTime: user.lastLoginTime,
        adminUsername: adminUsername, // 管理员用户名
        createdBy: currentAdmin.username // 标记是由哪个管理员查看的
      }
    })
    
    return {
      success: true,
      data: {
        users: processedUsers,
        hasMore: hasMore,
        page: page,
        pageSize: pageSize,
        currentAdmin: {
          username: currentAdmin.username,
          nickName: currentAdmin.nickName
        }
      }
    }
  } catch (err) {
    console.error('获取用户列表失败', err)
    return {
      success: false,
      message: '获取用户列表失败',
      error: err.message
    }
  }
}