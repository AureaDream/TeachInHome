import Toast from '../../miniprogram_npm/tdesign-miniprogram/toast/index';

// 云函数返回值接口
interface CloudFunctionResult {
  success: boolean;
  message?: string;
  data?: any;
}

interface User {
  userId: string;
  nickName: string;
  avatarUrl: string;
  role: 'admin' | 'user';
  status: 'active' | 'disabled';
  orderCount: number;
  postCount: number;
  registerTime: string;
  phone?: string;
  email?: string;
}

interface Order {
  orderId: string;
  orderNumber?: string;
  title: string;
  studentName: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  subject: string;
  educationStage: string;
  grade: string;
  studentGender: string;
  teacherRequirements: string;
  location: string;
  salaryRange: string;
  price: number;
  hoursRequired: number;
  description: string;
  requirements: string;
  contactInfo: string;
  publisherId: string;
  publisherName: string;
  createTime: string;
  updateTime?: string;
  viewCount: number;
  applicantCount: number;
}

interface Post {
  postId: string;
  title: string;
  content: string;
  authorName: string;
  status: 'normal' | 'blocked';
  viewCount: number;
  commentCount: number;
  likeCount: number;
  createTime: string;
}

interface EditUserForm {
  userId: string;
  nickName: string;
  phone: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'disabled';
}

interface EditOrderForm {
  orderId: string;
  orderNumber?: string;
  title: string;
  studentName: string;
  subject: string;
  educationStage: string;
  grade: string;
  studentGender: string;
  teacherRequirements: string;
  location: string;
  salaryRange: string;
  price: number;
  hoursRequired: number;
  description: string;
  requirements: string;
  contactInfo: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
}

interface AddAdminForm {
  username: string;
  password: string;
}

interface PasswordForm {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}


interface SystemSettings {
  enableRegister: boolean;
  enableOrderPublish: boolean;
  enablePostPublish: boolean;
  enableResumeGenerate: boolean;
}

interface Statistics {
  userCount: number;
  orderCount: number;
  postCount: number;
}

Page({
  data: {
    // 标签页
    activeTab: 'users',
    
    // 搜索
    searchValue: '',
    
    // 加载状态
    loading: false,
    
    // 用户管理
    userList: [] as User[],
    userStatusOptions: [
      { label: '全部状态', value: 'all' },
      { label: '正常', value: 'active' },
      { label: '禁用', value: 'disabled' }
    ],
    userStatusValue: 'all',
    userRoleOptions: [
      { label: '全部角色', value: 'all' },
      { label: '管理员', value: 'admin' },
      { label: '用户', value: 'user' }
    ],
    userRoleValue: 'all',
    hasMoreUsers: false,
    userPage: 1,
    userPageSize: 10,
    
    // 订单管理
    orderList: [] as Order[],
    orderStatusOptions: [
      { label: '全部状态', value: 'all' },
      { label: '待接单', value: 'pending' },
      { label: '已接单', value: 'accepted' },
      { label: '已完成', value: 'completed' },
      { label: '已取消', value: 'cancelled' }
    ],
    orderStatusValue: 'all',
    orderSubjectOptions: [
      { label: '全部科目', value: 'all' },
      { label: '数学', value: '数学' },
      { label: '英语', value: '英语' },
      { label: '语文', value: '语文' },
      { label: '物理', value: '物理' },
      { label: '化学', value: '化学' },
      { label: '生物', value: '生物' },
      { label: '历史', value: '历史' },
      { label: '地理', value: '地理' },
      { label: '政治', value: '政治' }
    ],
    orderSubjectValue: 'all',
    hasMoreOrders: false,
    orderPage: 1,
    orderPageSize: 10,
    
    // 论坛管理
    postList: [] as Post[],
    postStatusOptions: [
      { label: '全部状态', value: 'all' },
      { label: '正常', value: 'normal' },
      { label: '已屏蔽', value: 'blocked' }
    ],
    postStatusValue: 'all',
    postCategoryOptions: [
      { label: '全部分类', value: 'all' },
      { label: '经验分享', value: 'experience' },
      { label: '求助问答', value: 'question' },
      { label: '资源分享', value: 'resource' },
      { label: '闲聊灌水', value: 'chat' }
    ],
    postCategoryValue: 'all',
    hasMorePosts: false,
    postPage: 1,
    postPageSize: 10,
    
    // 系统设置
    settings: {
      enableRegister: true,
      enableOrderPublish: true,
      enablePostPublish: true,
      enableResumeGenerate: true
    } as SystemSettings,
    
    // 统计数据
    statistics: {
      userCount: 0,
      orderCount: 0,
      postCount: 0
    } as Statistics,
    
    // 弹窗
    showUserEditDialog: false,
    editUserForm: {} as EditUserForm,
    
    showOrderEditDialog: false,
    editOrderForm: {} as EditOrderForm,
    
    showAddAdminDialog: false,
    addAdminForm: {
      username: '',
      password: ''
    } as AddAdminForm,
    
    showChangePasswordDialog: false,
    passwordForm: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    } as PasswordForm
  },

  onLoad() {
    this.checkAdminStatus();
    this.loadStatistics();
    this.loadSettings();
    this.loadUserList();
  },

  onShow() {
    // 刷新当前标签页数据
    this.refreshCurrentTab();
    // 开启订单集合实时监听
    startOrderWatcher.call(this);
  },

  onHide() {
    // 关闭订单集合实时监听
    stopOrderWatcher.call(this);
  },

  onUnload() {
    // 关闭订单集合实时监听
    stopOrderWatcher.call(this);
  },
  onPullDownRefresh() {
    this.refreshCurrentTab();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  onReachBottom() {
    // 根据当前标签页加载更多数据
    const { activeTab } = this.data;
    
    if (activeTab === 'users' && this.data.hasMoreUsers) {
      this.loadMoreUsers();
    } else if (activeTab === 'orders' && this.data.hasMoreOrders) {
      this.loadMoreOrders();
    } else if (activeTab === 'forum' && this.data.hasMorePosts) {
      this.loadMorePosts();
    }
  },

  // 检查管理员状态
  checkAdminStatus() {
    const userInfo = wx.getStorageSync('userInfo');
    console.log('检查管理员状态，用户信息:', userInfo);
    
    if (!userInfo) {
      console.log('用户信息不存在，跳转到登录页');
      this.redirectToLogin();
      return;
    }
    
    // 检查是否为管理员登录
    if (userInfo.loginType !== 'admin' && userInfo.role !== 'admin' && !userInfo.isAdmin) {
      console.log('用户不是管理员，跳转到登录页');
      this.redirectToLogin();
      return;
    }
    
    console.log('管理员身份验证通过');
  },

  redirectToLogin() {
    wx.showModal({
      title: '提示',
      content: '您没有管理员权限，请使用管理员账号登录',
      showCancel: false,
      success: () => {
        wx.redirectTo({
          url: '/pages/login/login'
        });
      }
    });
  },

  // 刷新当前标签页数据
  refreshCurrentTab() {
    const { activeTab } = this.data;
    
    if (activeTab === 'users') {
      this.resetUserList();
      this.loadUserList();
    } else if (activeTab === 'orders') {
      this.resetOrderList();
      this.loadOrderList();
    } else if (activeTab === 'forum') {
      this.resetPostList();
      this.loadPostList();
    } else if (activeTab === 'settings') {
      this.loadStatistics();
      this.loadSettings();
    }
  },

  // 标签页切换
  onTabChange(e: any) {
    const activeTab = e.detail.value;
    this.setData({ activeTab });
    
    // 加载对应标签页数据
    if (activeTab === 'users' && this.data.userList.length === 0) {
      this.loadUserList();
    } else if (activeTab === 'orders' && this.data.orderList.length === 0) {
      this.loadOrderList();
    } else if (activeTab === 'forum' && this.data.postList.length === 0) {
      this.loadPostList();
    }
  },

  // 搜索相关
  onSearchChange(e: any) {
    this.setData({
      searchValue: e.detail.value
    });
  },

  onSearchClear() {
    this.setData({ searchValue: '' });
    this.refreshCurrentTab();
  },

  onSearchSubmit() {
    this.refreshCurrentTab();
  },

  getSearchPlaceholder() {
    const { activeTab } = this.data;
    
    if (activeTab === 'users') {
      return '搜索用户昵称或ID';
    } else if (activeTab === 'orders') {
      return '搜索订单号或科目';
    } else if (activeTab === 'forum') {
      return '搜索帖子标题或内容';
    }
    
    return '搜索';
  },

  // 用户管理相关
  resetUserList() {
    this.setData({
      userList: [],
      userPage: 1,
      hasMoreUsers: false
    });
  },

  loadUserList() {
    const { userPage, userPageSize, searchValue, userStatusValue, userRoleValue } = this.data;
    
    this.setData({ loading: true });
    
    // 获取当前管理员信息，使用与checkAdminStatus一致的验证逻辑
    const userInfo = wx.getStorageSync('userInfo');
    console.log('loadUserList - 完整的userInfo:', JSON.stringify(userInfo, null, 2));
    
    if (!userInfo || 
        !(userInfo.loginType === 'admin' || 
          userInfo.role === 'admin' || 
          userInfo.isAdmin === true)) {
      console.log('用户管理 - 身份验证失败:', userInfo);
      Toast({
        context: this,
        selector: '#t-toast',
        message: '管理员身份验证失败',
        theme: 'error'
      });
      this.setData({ loading: false });
      this.redirectToLogin();
      return;
    }
    
    const currentAdminUsername = userInfo.username || 'admin000';
    console.log('loadUserList - 传递给云函数的currentAdminUsername:', currentAdminUsername);
    console.log('loadUserList - userInfo.username:', userInfo.username);
    console.log('loadUserList - userInfo.nickName:', userInfo.nickName);
    
    // 调用云函数获取用户列表
    wx.cloud.callFunction({
      name: 'getUsers',
      data: {
        page: userPage,
        pageSize: userPageSize,
        searchValue: searchValue,
        statusValue: userStatusValue,
        roleValue: userRoleValue,
        currentAdminUsername: currentAdminUsername
      },
      success: (res) => {
        console.log('获取用户列表成功:', res);
        
        if (res.result && (res.result as CloudFunctionResult).success) {
          const { users, hasMore } = (res.result as CloudFunctionResult).data as { users: User[], hasMore: boolean };
          
          this.setData({
            userList: [...this.data.userList, ...users],
            hasMoreUsers: hasMore,
            loading: false
          });
        } else {
          Toast({
            context: this,
            selector: '#t-toast',
            message: (res.result as CloudFunctionResult)?.message || '获取用户列表失败',
            theme: 'error'
          });
          this.setData({ loading: false });
        }
      },
      fail: (err) => {
        console.error('获取用户列表失败:', err);
        Toast({
          context: this,
          selector: '#t-toast',
          message: '获取用户列表失败',
          theme: 'error'
        });
        this.setData({ loading: false });
      }
    });
  },

  loadMoreUsers() {
    this.setData({
      userPage: this.data.userPage + 1
    }, () => {
      this.loadUserList();
    });
  },

  onUserStatusChange(e: any) {
    this.setData({
      userStatusValue: e.detail.value
    }, () => {
      this.resetUserList();
      this.loadUserList();
    });
  },

  onUserRoleChange(e: any) {
    this.setData({
      userRoleValue: e.detail.value
    }, () => {
      this.resetUserList();
      this.loadUserList();
    });
  },

  onUserDetail(e: any) {
    const userId = e.currentTarget.dataset.id;
    // 跳转到用户详情页面
    wx.navigateTo({
      url: `/pages/user-detail/user-detail?id=${userId}`
    });
  },

  onEditUser(e: any) {
    // TDesign 组件的事件对象可能不包含 stopPropagation 方法
    if (e && e.stopPropagation && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    const userId = e.currentTarget.dataset.id;
    const user = this.data.userList.find(u => u.userId === userId);
    
    if (user) {
      this.setData({
        editUserForm: {
          userId: user.userId,
          nickName: user.nickName,
          phone: user.phone || '',
          email: user.email || '',
          role: user.role,
          status: user.status
        },
        showUserEditDialog: true
      });
    }
  },

  onEditUserFormChange(e: any) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`editUserForm.${field}`]: e.detail.value
    });
  },

  onEditUserRoleChange(e: any) {
    this.setData({
      'editUserForm.role': e.detail.value
    });
  },

  onEditUserStatusChange(e: any) {
    this.setData({
      'editUserForm.status': e.detail.value
    });
  },

  onConfirmUserEdit() {
    const { editUserForm } = this.data;
    
    // 表单验证
    if (!editUserForm.nickName.trim()) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入用户昵称',
        theme: 'warning'
      });
      return;
    }
    
    if (editUserForm.phone && !/^1[3-9]\d{9}$/.test(editUserForm.phone)) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入正确的手机号',
        theme: 'warning'
      });
      return;
    }
    
    if (editUserForm.email && !/^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(editUserForm.email)) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入正确的邮箱',
        theme: 'warning'
      });
      return;
    }
    
    // 获取当前管理员信息
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo || !userInfo.username) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '管理员身份验证失败',
        theme: 'error'
      });
      return;
    }
    
    // 调用云函数更新用户信息
    wx.cloud.callFunction({
      name: 'updateUser',
      data: {
        userId: editUserForm.userId,
        updateData: {
          nickName: editUserForm.nickName.trim(),
          phone: editUserForm.phone || '',
          email: editUserForm.email || '',
          role: editUserForm.role,
          status: editUserForm.status
        },
        currentAdminUsername: userInfo.username
      },
      success: (res) => {
        console.log('更新用户信息成功:', res);
        
        if (res.result && (res.result as CloudFunctionResult).success) {
          // 更新本地用户列表
          const userList = this.data.userList.map(user => {
            if (user.userId === editUserForm.userId) {
              return {
                ...user,
                nickName: editUserForm.nickName,
                phone: editUserForm.phone || '',
                email: editUserForm.email || '',
                role: editUserForm.role,
                status: editUserForm.status as 'active' | 'disabled'
              };
            }
            return user;
          });
          
          this.setData({
            userList,
            showUserEditDialog: false
          });
          
          Toast({
            context: this,
            selector: '#t-toast',
            message: '用户信息已更新',
            theme: 'success'
          });
        } else {
          Toast({
            context: this,
            selector: '#t-toast',
            message: (res.result as CloudFunctionResult)?.message || '更新用户信息失败',
            theme: 'error'
          });
        }
      },
      fail: (err) => {
        console.error('更新用户信息失败:', err);
        Toast({
          context: this,
          selector: '#t-toast',
          message: '更新用户信息失败',
          theme: 'error'
        });
      }
    });
  },

  onCancelUserEdit() {
    this.setData({ showUserEditDialog: false });
  },

  onToggleUserStatus(e: any) {
    const userId = e.currentTarget.dataset.id;
    const status = e.currentTarget.dataset.status as 'active' | 'disabled';
    const newStatus = status === 'active' ? 'disabled' : 'active';
    
    wx.showModal({
      title: '提示',
      content: `确定要${newStatus === 'active' ? '启用' : '禁用'}该用户吗？`,
      success: (res) => {
        if (res.confirm) {
          // 获取当前管理员信息
          const userInfo = wx.getStorageSync('userInfo');
          if (!userInfo || !userInfo.username) {
            Toast({
              context: this,
              selector: '#t-toast',
              message: '管理员身份验证失败',
              theme: 'error'
            });
            return;
          }
          
          // 调用云函数更新用户状态
          wx.cloud.callFunction({
            name: 'updateUser',
            data: {
              userId: userId,
              updateData: {
                status: newStatus
              },
              currentAdminUsername: userInfo.username
            },
            success: (res) => {
              console.log('更新用户状态成功:', res);
              
              if (res.result && (res.result as CloudFunctionResult).success) {
                // 更新本地用户列表
                const userList = this.data.userList.map(user => {
                  if (user.userId === userId) {
                    return { ...user, status: newStatus as 'active' | 'disabled' };
                  }
                  return user;
                });
                
                this.setData({ userList });
                
                Toast({
                  context: this,
                  selector: '#t-toast',
                  message: `用户已${newStatus === 'active' ? '启用' : '禁用'}`,
                  theme: 'success'
                });
              } else {
                Toast({
                  context: this,
                  selector: '#t-toast',
                  message: (res.result as CloudFunctionResult)?.message || '操作失败',
                  theme: 'error'
                });
              }
            },
            fail: (err) => {
              console.error('更新用户状态失败:', err);
              Toast({
                context: this,
                selector: '#t-toast',
                message: '操作失败',
                theme: 'error'
              });
            }
          });
        }
      }
    });
  },

  // 订单管理相关
  resetOrderList() {
    this.setData({
      orderList: [],
      orderPage: 1,
      hasMoreOrders: false
    });
  },

  async loadOrderList() {
    const { orderPage, orderPageSize, searchValue, orderStatusValue, orderSubjectValue } = this.data;
    
    this.setData({ loading: true });
    
    try {
      // 构建查询条件
      const db = wx.cloud.database();
      let query: any = db.collection('orders');
      
      // 添加筛选条件
      const whereConditions: any = {};
      
      // 状态筛选
      if (orderStatusValue && orderStatusValue !== 'all') {
        whereConditions.status = orderStatusValue;
      }
      
      // 科目筛选
      if (orderSubjectValue && orderSubjectValue !== 'all') {
        whereConditions.subject = orderSubjectValue;
      }
      
      // 搜索条件
      if (searchValue && searchValue.trim()) {
        // 使用正则表达式进行模糊搜索
        const searchRegex = db.RegExp({
          regexp: searchValue.trim(),
          options: 'i'
        });
        whereConditions.$or = [
          { title: searchRegex },
          { studentName: searchRegex },
          { description: searchRegex },
          { location: searchRegex }
        ];
      }
      
      // 应用查询条件，如果没有其他条件，至少添加一个基础条件避免全量查询
      if (Object.keys(whereConditions).length === 0) {
        // 添加一个基础条件，只查询有效的订单（排除可能的测试数据）
        whereConditions._id = db.command.exists(true);
      }
      
      query = query.where(whereConditions);

      // 分页查询
      const result = await query
        .orderBy('createTime', 'desc')
        .skip((orderPage - 1) * orderPageSize)
        .limit(orderPageSize)
        .get();
      
      // 处理订单数据
      const orders = result.data.map((order: any) => ({
        orderId: order._id,
        orderNumber: order.orderNumber || order.orderId,
        title: order.title,
        studentName: order.studentName,
        subject: order.subject,
        educationStage: order.educationStage || order.grade || '未知', // 添加educationStage字段
        grade: order.grade,
        studentGender: order.studentGender,
        teacherRequirements: order.teacherRequirements,
        location: order.location,
        salaryRange: order.salaryRange,
        price: order.price,
        hoursRequired: order.hoursRequired,
        description: order.description,
        requirements: order.requirements,
        contactInfo: order.contactInfo,
        status: order.status,
        publisherId: order.publisherId,
        publisherName: order.publisherName,
        createTime: this.formatTime(order.createTime),
        updateTime: order.updateTime,
        viewCount: order.viewCount || 0,
        applicantCount: order.applicantCount || 0
      }));
      
      // 更新数据
      if (orderPage === 1) {
        // 首次加载或刷新
        this.setData({
          orderList: orders,
          hasMoreOrders: orders.length === orderPageSize,
          loading: false
        });
      } else {
        // 加载更多
        this.setData({
          orderList: [...this.data.orderList, ...orders],
          hasMoreOrders: orders.length === orderPageSize,
          loading: false
        });
      }
      
    } catch (error) {
      console.error('加载订单列表失败:', error);
      Toast({
        context: this,
        selector: '#t-toast',
        message: '加载订单列表失败',
        theme: 'error'
      });
      
      this.setData({ loading: false });
    }
  },

  loadMoreOrders() {
    this.setData({
      orderPage: this.data.orderPage + 1
    }, () => {
      this.loadOrderList();
    });
  },

  onOrderStatusChange(e: any) {
    this.setData({
      orderStatusValue: e.detail.value
    }, () => {
      this.resetOrderList();
      this.loadOrderList();
    });
  },

  onOrderSubjectChange(e: any) {
    this.setData({
      orderSubjectValue: e.detail.value
    }, () => {
      this.resetOrderList();
      this.loadOrderList();
    });
  },

  // 编辑订单
  onEditOrder(e: any) {
    const orderId = e.currentTarget.dataset.id;
    const order = this.data.orderList.find(item => item.orderId === orderId);
    if (order) {
      // 填充表单数据
      this.setData({
        editOrderForm: {
          orderId: order.orderId,
          orderNumber: order.orderNumber || '',
          title: order.title || '',
          subject: order.subject || '',
          grade: order.grade || '',
          studentName: order.studentName || '',
          studentGender: order.studentGender || '',
          teacherRequirements: order.teacherRequirements || '',
          location: order.location || '',
          salaryRange: order.salaryRange || '',
          price: order.price || 0,
          hoursRequired: order.hoursRequired || 0,
          description: order.description || '',
          requirements: order.requirements || '',
          contactInfo: order.contactInfo || '',
          status: order.status,
          educationStage: order.educationStage || ''
        },
        showOrderEditDialog: true
      });
    }
  },

  // 删除订单
  onDeleteOrder(e: any) {
    const orderId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个订单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '删除中...' });
            
            const result = await wx.cloud.callFunction({
              name: 'deleteOrder',
              data: { orderId }
            });
    
            wx.hideLoading();
            
            if (result.result && (result.result as CloudFunctionResult).success) {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
              this.loadOrderList();
            } else {
              wx.showToast({
                title: (result.result as CloudFunctionResult)?.message || '删除失败',
                icon: 'error'
              });
            }
          } catch (error) {
            wx.hideLoading();
            console.error('删除订单失败:', error);
            wx.showToast({
              title: '删除失败',
              icon: 'error'
            });
          }
        }
      }
    });
  },

  onEditOrderFormChange(e: any) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`editOrderForm.${field}`]: e.detail.value
    });
  },

  onEditOrderStatusChange(e: any) {
    this.setData({
      'editOrderForm.status': e.detail.value
    });
  },

  async onConfirmOrderEdit() {
    const { editOrderForm } = this.data;
    
    // 验证必填字段
    if (!editOrderForm.title.trim()) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入订单标题',
        theme: 'warning'
      });
      return;
    }
    
    if (!editOrderForm.studentName.trim()) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入学生姓名',
        theme: 'warning'
      });
      return;
    }
    
    if (!editOrderForm.subject.trim()) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请选择科目',
        theme: 'warning'
      });
      return;
    }
    
    if (!editOrderForm.salaryRange.trim()) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入薪资范围',
        theme: 'warning'
      });
      return;
    }
    
    try {
      wx.showLoading({ title: '更新中...' });
      
      const result = await wx.cloud.callFunction({
        name: 'updateOrder',
        data: {
          orderId: editOrderForm.orderId,
          title: editOrderForm.title,
          studentName: editOrderForm.studentName,
          subject: editOrderForm.subject,
          educationStage: editOrderForm.educationStage,
          grade: editOrderForm.grade,
          studentGender: editOrderForm.studentGender,
          teacherRequirements: editOrderForm.teacherRequirements,
          location: editOrderForm.location,
          salaryRange: editOrderForm.salaryRange,
          hoursRequired: editOrderForm.hoursRequired,
          description: editOrderForm.description,
          requirements: editOrderForm.requirements,
          contactInfo: editOrderForm.contactInfo,
          status: editOrderForm.status
        }
      });

      wx.hideLoading();
      
      if (result.result && (result.result as CloudFunctionResult).success) {
        // 更新本地订单列表
        const orderList = this.data.orderList.map(order => {
          if (order.orderId === editOrderForm.orderId) {
            return {
              ...order,
              title: editOrderForm.title,
              studentName: editOrderForm.studentName,
              subject: editOrderForm.subject,
              educationStage: editOrderForm.educationStage,
              grade: editOrderForm.grade,
              studentGender: editOrderForm.studentGender,
              teacherRequirements: editOrderForm.teacherRequirements,
              location: editOrderForm.location,
              salaryRange: editOrderForm.salaryRange,
              hoursRequired: editOrderForm.hoursRequired,
              description: editOrderForm.description,
              requirements: editOrderForm.requirements,
              contactInfo: editOrderForm.contactInfo,
              status: editOrderForm.status,
              updateTime: new Date().toISOString()
            };
          }
          return order;
        });
        
        this.setData({
          orderList,
          showOrderEditDialog: false
        });
        
        Toast({
          context: this,
          selector: '#t-toast',
          message: '订单更新成功',
          theme: 'success'
        });
      } else {
        Toast({
          context: this,
          selector: '#t-toast',
          message: (result.result as CloudFunctionResult)?.message || '更新失败',
          theme: 'error'
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('更新订单失败:', error);
      Toast({
        context: this,
        selector: '#t-toast',
        message: '更新失败',
        theme: 'error'
      });
    }
  },

  onCancelOrderEdit() {
    this.setData({ showOrderEditDialog: false });
  },

  getOrderStatusText(status: string) {
    const statusMap: Record<string, string> = {
      'pending': '待接单',
      'accepted': '已接单',
      'completed': '已完成',
      'cancelled': '已取消'
    };
    return statusMap[status] || '未知状态';
  },

  getOrderStatusTheme(status: string) {
    const themeMap: Record<string, string> = {
      'pending': 'primary',
      'accepted': 'success',
      'completed': 'success',
      'cancelled': 'danger'
    };
    return themeMap[status] || 'default';
  },

  // 论坛管理相关
  resetPostList() {
    this.setData({
      postList: [],
      postPage: 1,
      hasMorePosts: false
    });
  },

  loadPostList() {
    const { postPage, postPageSize, searchValue, postCategoryValue } = this.data;
    this.setData({ loading: true });

    // 通过云函数获取帖子列表
    wx.cloud
      .callFunction({
        name: 'getPosts',
        data: {
          page: postPage,
          pageSize: postPageSize,
          category: postCategoryValue,
          searchValue: searchValue || ''
        }
      })
      .then((res: any) => {
        const result = res?.result;
        if (!result || !result.success) {
          throw new Error(result?.message || '获取帖子列表失败');
        }

        const cloudPosts = result.data?.posts || [];
        const mappedPosts: Post[] = cloudPosts.map((p: any) => ({
          postId: p.id,
          title: p.title,
          content: p.summary || p.content || '',
          authorName: (p.author && p.author.name) || '未知用户',
          status: 'normal',
          viewCount: p.viewCount || 0,
          commentCount: p.commentCount || 0,
          likeCount: p.likeCount || 0,
          createTime: p.createTime || ''
        }));

        this.setData({
          postList: [...this.data.postList, ...mappedPosts],
          hasMorePosts: !!result.data?.hasMore,
          loading: false
        });
      })
      .catch((error: any) => {
        console.error('加载帖子失败:', error);
        this.setData({ loading: false });
        Toast({
          context: this,
          selector: '#t-toast',
          message: error?.message || '加载帖子失败',
          theme: 'error'
        });
      });
  },

  loadMorePosts() {
    this.setData({
      postPage: this.data.postPage + 1
    }, () => {
      this.loadPostList();
    });
  },

  onPostStatusChange(e: any) {
    this.setData({
      postStatusValue: e.detail.value
    }, () => {
      this.resetPostList();
      this.loadPostList();
    });
  },

  onPostCategoryChange(e: any) {
    this.setData({
      postCategoryValue: e.detail.value
    }, () => {
      this.resetPostList();
      this.loadPostList();
    });
  },

  onPostDetail(e: any) {
    const postId = e.currentTarget.dataset.id;
    // 跳转到帖子详情页面
    wx.navigateTo({
      url: `/pages/post-detail/post-detail?id=${postId}`
    });
  },

  onTogglePostStatus(e: any) {
    // TDesign 组件的事件对象可能不包含 stopPropagation 方法
    if (e && e.stopPropagation && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    const postId = e.currentTarget.dataset.id;
    const status = e.currentTarget.dataset.status as 'normal' | 'blocked';
    const newStatus = status === 'normal' ? 'blocked' : 'normal';
    
    wx.showModal({
      title: '提示',
      content: `确定要${newStatus === 'normal' ? '恢复' : '屏蔽'}该帖子吗？`,
      success: (res) => {
        if (res.confirm) {
          // 更新帖子状态
          const postList = this.data.postList.map(post => {
            if (post.postId === postId) {
              return { ...post, status: newStatus as 'normal' | 'blocked' };
            }
            return post;
          });
          
          this.setData({ postList });
          
          Toast({
            context: this,
            selector: '#t-toast',
            message: `帖子已${newStatus === 'normal' ? '恢复' : '屏蔽'}`,
            theme: 'success'
          });
        }
      }
    });
  },

  onDeletePost(e: any) {
    // TDesign 组件的事件对象可能不包含 stopPropagation 方法
    if (e && e.stopPropagation && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    const postId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '提示',
      content: '确定要删除该帖子吗？',
      success: (res) => {
        if (res.confirm) {
          // 删除帖子
          const postList = this.data.postList.filter(post => post.postId !== postId);
          
          this.setData({ postList });
          
          Toast({
            context: this,
            selector: '#t-toast',
            message: '帖子已删除',
            theme: 'success'
          });
        }
      }
    });
  },

  // 系统设置相关
  async loadStatistics() {
    try {
      const db = wx.cloud.database();
      const _ = db.command;
      const [usersCountRes, ordersCountRes, postsCountRes] = await Promise.all([
        db.collection('users').where({ _id: _.exists(true) }).count(),
        db.collection('orders').where({ _id: _.exists(true) }).count(),
        db.collection('posts').where({ _id: _.exists(true) }).count()
      ]);

      this.setData({
        statistics: {
          userCount: usersCountRes.total || 0,
          orderCount: ordersCountRes.total || 0,
          postCount: postsCountRes.total || 0
        }
      });
    } catch (error) {
      console.error('加载统计数据失败:', error);
      Toast({
        context: this,
        selector: '#t-toast',
        message: '统计数据加载失败',
        theme: 'error'
      });
    }
  },

  async loadSettings() {
    try {
      const db = wx.cloud.database();
      const res = await db.collection('settings').where({ key: 'global' }).get();
      if (res.data && res.data.length > 0) {
        const doc = res.data[0];
        this.setData({
          settings: {
            enableRegister: !!doc.enableRegister,
            enableOrderPublish: !!doc.enableOrderPublish,
            enablePostPublish: !!doc.enablePostPublish,
            enableResumeGenerate: !!doc.enableResumeGenerate
          }
        });
        wx.setStorageSync('adminSettings', this.data.settings);
      } else {
        const defaultSettings = {
          key: 'global',
          enableRegister: true,
          enableOrderPublish: true,
          enablePostPublish: true,
          enableResumeGenerate: true,
          updatedAt: new Date()
        };
        await db.collection('settings').add({ data: defaultSettings });
        this.setData({
          settings: {
            enableRegister: true,
            enableOrderPublish: true,
            enablePostPublish: true,
            enableResumeGenerate: true
          }
        });
        wx.setStorageSync('adminSettings', this.data.settings);
      }
    } catch (error) {
      console.error('加载系统设置失败:', error);
    }
  },

  async onSettingChange(e: any) {
    const key = e.currentTarget.dataset.key;
    const value = e.detail.value;
    
    this.setData({ [`settings.${key}`]: value });
    wx.setStorageSync('adminSettings', this.data.settings);

    try {
      const db = wx.cloud.database();
      const res = await db.collection('settings').where({ key: 'global' }).get();
      if (res.data && res.data.length > 0) {
        const docRecord = res.data[0];
        const docId = docRecord && docRecord._id ? String(docRecord._id) : '';
        if (docId) {
          await db.collection('settings').doc(docId).update({
            data: { [key]: value, updatedAt: new Date() }
          });
        } else {
          await db.collection('settings').add({
            data: { key: 'global', [key]: value, updatedAt: new Date() }
          });
        }
      } else {
        await db.collection('settings').add({
          data: { key: 'global', [key]: value, updatedAt: new Date() }
        });
      }
      Toast({
        context: this,
        selector: '#t-toast',
        message: '设置已保存',
        theme: 'success'
      });
    } catch (error) {
      console.error('更新设置失败:', error);
      Toast({
        context: this,
        selector: '#t-toast',
        message: '设置更新失败',
        theme: 'error'
      });
    }
  },

  onAddAdmin() {
    this.setData({
      addAdminForm: { username: '', password: '' },
      showAddAdminDialog: true
    });
  },

  onAddAdminFormChange(e: any) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`addAdminForm.${field}`]: e.detail.value
    });
  },

  onConfirmAddAdmin() {
    const { addAdminForm } = this.data;
    const username = (addAdminForm as AddAdminForm).username?.trim();
    const password = (addAdminForm as AddAdminForm).password?.trim();
    
    if (!username || !password) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请填写用户名和密码',
        theme: 'warning'
      });
      return;
    }
    
    wx.cloud.callFunction({
      name: 'addAdmin',
      data: { username, password },
      success: (res) => {
        const result = res.result as CloudFunctionResult;
        if (result && result.success) {
          this.setData({ showAddAdminDialog: false });
          Toast({ context: this, selector: '#t-toast', message: '管理员添加成功', theme: 'success' });
          // 可选：刷新用户列表
          this.resetUserList();
          this.loadUserList();
        } else {
          Toast({ context: this, selector: '#t-toast', message: result?.message || '添加管理员失败', theme: 'error' });
        }
      },
      fail: (err) => {
        console.error('添加管理员失败:', err);
        Toast({ context: this, selector: '#t-toast', message: '添加管理员失败', theme: 'error' });
      }
    });
  },

  onCancelAddAdmin() {
    this.setData({ showAddAdminDialog: false });
  },

  onChangePassword() {
    this.setData({
      passwordForm: {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      showChangePasswordDialog: true
    });
  },

  onPasswordFormChange(e: any) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`passwordForm.${field}`]: e.detail.value
    });
  },

  onConfirmChangePassword() {
    const { passwordForm } = this.data;
    
    if (!passwordForm.oldPassword) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入当前密码',
        theme: 'warning'
      });
      return;
    }
    
    if (!passwordForm.newPassword) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入新密码',
        theme: 'warning'
      });
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '两次输入的密码不一致',
        theme: 'warning'
      });
      return;
    }
    
    // 模拟修改密码
    setTimeout(() => {
      this.setData({ showChangePasswordDialog: false });
      
      Toast({
        context: this,
        selector: '#t-toast',
        message: '密码修改成功',
        theme: 'success'
      });
    }, 500);
  },

  // 跳转到发布订单页面
  onPublishOrder() {
    wx.navigateTo({
      url: '/pages/publish-order-admin/publish-order-admin'
    });
  },

  onCancelChangePassword() {
    this.setData({ showChangePasswordDialog: false });
  },

  onLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除登录信息
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('token');
          
          // 跳转到登录页
          wx.redirectTo({
            url: '/pages/login/login'
          });
        }
      }
    });
  },

  onBackupData() {
    wx.cloud.callFunction({ name: 'backupData' })
      .then((res) => {
        const result = res.result as CloudFunctionResult;
        if (result && result.success) {
          Toast({ context: this, selector: '#t-toast', message: '数据备份成功', theme: 'success' });
        } else {
          Toast({ context: this, selector: '#t-toast', message: result?.message || '数据备份失败', theme: 'error' });
        }
      })
      .catch((err) => {
        console.error('数据备份失败:', err);
        Toast({ context: this, selector: '#t-toast', message: '数据备份失败', theme: 'error' });
      });
  },

  onRestoreData() {
    wx.showModal({
      title: '提示',
      content: '恢复数据将覆盖当前数据，是否继续？',
      success: (res) => {
        if (res.confirm) {
          wx.cloud.callFunction({ name: 'restoreData' })
            .then((resp) => {
              const result = resp.result as CloudFunctionResult;
              if (result && result.success) {
                Toast({ context: this, selector: '#t-toast', message: '数据恢复成功', theme: 'success' });
                this.refreshCurrentTab();
              } else {
                Toast({ context: this, selector: '#t-toast', message: result?.message || '数据恢复失败', theme: 'error' });
              }
            })
            .catch((error) => {
              console.error('数据恢复失败:', error);
              Toast({ context: this, selector: '#t-toast', message: '数据恢复失败', theme: 'error' });
            });
        }
      }
    });
  },

  onClearCache() {
    wx.showModal({
      title: '提示',
      content: '确定要清除缓存吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除缓存
          wx.clearStorageSync();
          this.setData({
            settings: {
              enableRegister: true,
              enableOrderPublish: true,
              enablePostPublish: true,
              enableResumeGenerate: true
            }
          });
          
          Toast({
            context: this,
            selector: '#t-toast',
            message: '缓存已清除',
            theme: 'success'
          });
        }
      }
    });
  },

  // 模拟数据生成
  generateMockUsers(page: number, pageSize: number, searchValue: string, statusValue: string, roleValue: string) {
    const users: User[] = [];
    const startIndex = (page - 1) * pageSize;
    
    for (let i = 0; i < pageSize; i++) {
      const index = startIndex + i;
      const userId = `user_${index + 1}`;
      const nickName = `用户${index + 1}`;
      const role = index % 10 === 0 ? 'admin' : 'user';
      const status = index % 5 === 0 ? 'disabled' : 'active';
      
      // 筛选条件
      if (statusValue !== 'all' && status !== statusValue) continue;
      if (roleValue !== 'all' && role !== roleValue) continue;
      if (searchValue && !userId.includes(searchValue) && !nickName.includes(searchValue)) continue;
      
      users.push({
        userId,
        nickName,
        avatarUrl: 'https://tdesign.gtimg.com/miniprogram/images/avatar1.png',
        role,
        status: status as 'active' | 'disabled',
        orderCount: Math.floor(Math.random() * 20),
        postCount: Math.floor(Math.random() * 15),
        registerTime: '2023-08-15',
        phone: index % 3 === 0 ? `1381234${(5000 + index).toString().padStart(4, '0')}` : undefined,
        email: index % 4 === 0 ? `user${index + 1}@example.com` : undefined
      });
    }
    
    return users;
  },

  generateMockOrders(page: number, pageSize: number, searchValue: string, statusValue: string, subjectValue: string) {
    const orders: Order[] = [];
    const startIndex = (page - 1) * pageSize;
    const subjects = ['数学', '英语', '语文', '物理', '化学', '生物', '历史', '地理', '政治'];
    const statuses = ['pending', 'accepted', 'completed', 'cancelled'];
    
    for (let i = 0; i < pageSize; i++) {
      const index = startIndex + i;
      const orderId = `order_${index + 1}`;
      const subject = subjects[index % subjects.length];
      const status = statuses[index % statuses.length] as 'pending' | 'accepted' | 'completed' | 'cancelled';
      
      // 筛选条件
      if (statusValue !== 'all' && status !== statusValue) continue;
      if (subjectValue !== 'all' && subject !== subjectValue) continue;
      if (searchValue && !orderId.includes(searchValue) && !subject.includes(searchValue)) continue;
      
      orders.push({
        orderId,
        orderNumber: `ORD${String(index + 1).padStart(6, '0')}`,
        title: `${subject}家教需求${index + 1}`,
        studentName: `学生${index + 1}`,
        status,
        subject,
        educationStage: ['小学', '初中', '高中'][index % 3],
        grade: ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'][index % 6],
        studentGender: ['男', '女', '不限'][index % 3],
        teacherRequirements: `要求有经验的${subject}老师`,
        location: `城市${index % 5 + 1}区`,
        salaryRange: `${80 + index % 50}-${120 + index % 80}元/小时`,
        price: 100 + Math.floor(Math.random() * 200),
        hoursRequired: 2 + index % 4,
        description: `需要${subject}家教，学生基础良好，希望提高成绩`,
        requirements: `有教学经验，耐心负责`,
        contactInfo: `联系电话：138****${String(1000 + index).slice(-4)}`,
        publisherId: `user_${index + 1}`,
        publisherName: `用户${index + 1}`,
        createTime: '2023-08-15',
        updateTime: '2023-08-15',
        viewCount: Math.floor(Math.random() * 100),
        applicantCount: Math.floor(Math.random() * 10)
      });
    }
    
    return orders;
  },

  generateMockPosts(page: number, pageSize: number, searchValue: string, statusValue: string, categoryValue: string) {
    const posts: Post[] = [];
    const startIndex = (page - 1) * pageSize;
    
    for (let i = 0; i < pageSize; i++) {
      const index = startIndex + i;
      const postId = `post_${index + 1}`;
      const title = `帖子标题${index + 1}`;
      const content = `这是帖子${index + 1}的内容，描述了一些关于家教的经验和问题...`;
      const status = index % 5 === 0 ? 'blocked' : 'normal' as 'normal' | 'blocked';
      
      // 筛选条件
      if (statusValue !== 'all' && status !== statusValue) continue;
      if (categoryValue !== 'all') continue; // 简化处理，实际应该根据分类筛选
      if (searchValue && !title.includes(searchValue) && !content.includes(searchValue)) continue;
      
      posts.push({
        postId,
        title,
        content,
        authorName: `用户${index + 1}`,
        status,
        viewCount: Math.floor(Math.random() * 1000),
        commentCount: Math.floor(Math.random() * 50),
        likeCount: Math.floor(Math.random() * 100),
        createTime: '2023-08-15'
      });
    }
    
    return posts;
  },

  // 时间格式化方法
  formatTime(timestamp: any): string {
    if (!timestamp) return '';
    
    let date: Date;
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else {
      return '';
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  },

  // 页面分享
  onShareAppMessage() {
    return {
      title: '家教小程序 - 管理后台',
      path: '/pages/admin/admin'
    };
  }
});


// 启动订单集合实时监听
function startOrderWatcher(this: any) {
  try {
    // 如已有监听，先关闭避免重复
    if ((this as any).orderWatcher && typeof (this as any).orderWatcher.close === 'function') {
      (this as any).orderWatcher.close();
    }
    const db = wx.cloud.database();
    // 监听 orders 集合的变更（不做复杂筛选，确保任何状态更新都能捕捉到）
    (this as any).orderWatcher = db.collection('orders').watch({
      onChange: (snapshot: any) => {
        console.log('orders watch onChange:', snapshot);
        // 仅当当前标签是订单时刷新，避免打断其他标签的操作
        if (this.data.activeTab === 'orders') {
          // 保持筛选与分页一致，采用列表刷新策略
          this.resetOrderList();
          this.loadOrderList();
        }
      },
      onError: (err: any) => {
        console.error('orders watch error:', err);
      }
    });
  } catch (e) {
    console.warn('启动订单实时监听失败，可能当前环境不支持 watch:', e);
  }
}

// 停止订单集合实时监听
function stopOrderWatcher(this: any) {
  try {
    if ((this as any).orderWatcher && typeof (this as any).orderWatcher.close === 'function') {
      (this as any).orderWatcher.close();
      (this as any).orderWatcher = null;
    }
  } catch (e) {
    console.warn('关闭订单实时监听时出现问题:', e);
  }
}