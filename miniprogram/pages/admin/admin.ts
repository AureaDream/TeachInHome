import Toast from '../../miniprogram_npm/tdesign-miniprogram/toast/index';

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
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  subject: string;
  educationStage: string;
  price: number;
  publisherName: string;
  createTime: string;
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
  subject: string;
  educationStage: string;
  price: number;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
}

interface AddAdminForm {
  userId: string;
}

interface PasswordForm {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PublishOrderForm {
  orderNumber: string;
  title: string;
  subject: string;
  grade: string;
  studentGender: string;
  teacherRequirements: string;
  location: string;
  salaryRange: string;
  price: number;
  description: string;
  requirements: string;
  contactInfo: string;
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
      userId: ''
    } as AddAdminForm,
    
    showChangePasswordDialog: false,
    passwordForm: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    } as PasswordForm,

    // 订单发布相关
    showPublishOrderDialog: false,
    publishOrderForm: {
      orderNumber: '',
      title: '',
      subject: '数学',
      grade: '小学',
      studentGender: '不限',
      teacherRequirements: '',
      location: '',
      salaryRange: '',
      price: 0,
      description: '',
      requirements: '',
      contactInfo: ''
    } as PublishOrderForm,
    publishOrderSubjectValue: [0],
    publishOrderGradeValue: [0],
    publishOrderGenderValue: [0],
    publishingOrder: false,
    
    // 发布订单表单选项
    publishOrderSubjectOptions: [
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
    publishOrderGradeOptions: [
      { label: '小学', value: '小学' },
      { label: '初中', value: '初中' },
      { label: '高中', value: '高中' },
      { label: '大学', value: '大学' }
    ],
    publishOrderGenderOptions: [
      { label: '不限', value: '不限' },
      { label: '男', value: '男' },
      { label: '女', value: '女' }
    ]
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
    if (!userInfo || userInfo.role !== 'admin') {
      wx.showModal({
        title: '提示',
        content: '您没有管理员权限',
        showCancel: false,
        success: () => {
          wx.redirectTo({
            url: '/pages/login/login'
          });
        }
      });
    }
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
    
    // 模拟加载用户列表
    setTimeout(() => {
      // 生成模拟数据
      const users = this.generateMockUsers(userPage, userPageSize, searchValue, userStatusValue, userRoleValue);
      
      this.setData({
        userList: [...this.data.userList, ...users],
        hasMoreUsers: users.length === userPageSize,
        loading: false
      });
    }, 1000);
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
    e.stopPropagation();
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
    
    // 更新用户信息
    const userList = this.data.userList.map(user => {
      if (user.userId === editUserForm.userId) {
        return {
          ...user,
          nickName: editUserForm.nickName,
          phone: editUserForm.phone || undefined,
          email: editUserForm.email || undefined,
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
  },

  onCancelUserEdit() {
    this.setData({ showUserEditDialog: false });
  },

  onToggleUserStatus(e: any) {
    e.stopPropagation();
    const userId = e.currentTarget.dataset.id;
    const status = e.currentTarget.dataset.status as 'active' | 'disabled';
    const newStatus = status === 'active' ? 'disabled' : 'active';
    
    wx.showModal({
      title: '提示',
      content: `确定要${newStatus === 'active' ? '启用' : '禁用'}该用户吗？`,
      success: (res) => {
        if (res.confirm) {
          // 更新用户状态
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

  loadOrderList() {
    const { orderPage, orderPageSize, searchValue, orderStatusValue, orderSubjectValue } = this.data;
    
    this.setData({ loading: true });
    
    // 模拟加载订单列表
    setTimeout(() => {
      // 生成模拟数据
      const orders = this.generateMockOrders(orderPage, orderPageSize, searchValue, orderStatusValue, orderSubjectValue);
      
      this.setData({
        orderList: [...this.data.orderList, ...orders],
        hasMoreOrders: orders.length === orderPageSize,
        loading: false
      });
    }, 1000);
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

  onOrderDetail(e: any) {
    const orderId = e.currentTarget.dataset.id;
    // 跳转到订单详情页面
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${orderId}`
    });
  },

  onEditOrder(e: any) {
    e.stopPropagation();
    const orderId = e.currentTarget.dataset.id;
    const order = this.data.orderList.find(o => o.orderId === orderId);
    
    if (order) {
      this.setData({
        editOrderForm: {
          orderId: order.orderId,
          subject: order.subject,
          educationStage: order.educationStage,
          price: order.price,
          status: order.status
        },
        showOrderEditDialog: true
      });
    }
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

  onConfirmOrderEdit() {
    const { editOrderForm } = this.data;
    
    // 表单验证
    if (!editOrderForm.subject.trim()) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入科目',
        theme: 'warning'
      });
      return;
    }
    
    if (!editOrderForm.educationStage.trim()) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入教育阶段',
        theme: 'warning'
      });
      return;
    }
    
    if (isNaN(Number(editOrderForm.price)) || Number(editOrderForm.price) <= 0) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入正确的报酬',
        theme: 'warning'
      });
      return;
    }
    
    // 更新订单信息
    const orderList = this.data.orderList.map(order => {
      if (order.orderId === editOrderForm.orderId) {
        return {
          ...order,
          subject: editOrderForm.subject,
          educationStage: editOrderForm.educationStage,
          price: Number(editOrderForm.price),
          status: editOrderForm.status
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
      message: '订单信息已更新',
      theme: 'success'
    });
  },

  onCancelOrderEdit() {
    this.setData({ showOrderEditDialog: false });
  },

  onDeleteOrder(e: any) {
    e.stopPropagation();
    const orderId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '提示',
      content: '确定要删除该订单吗？',
      success: (res) => {
        if (res.confirm) {
          // 删除订单
          const orderList = this.data.orderList.filter(order => order.orderId !== orderId);
          
          this.setData({ orderList });
          
          Toast({
            context: this,
            selector: '#t-toast',
            message: '订单已删除',
            theme: 'success'
          });
        }
      }
    });
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
    const { postPage, postPageSize, searchValue, postStatusValue, postCategoryValue } = this.data;
    
    this.setData({ loading: true });
    
    // 模拟加载帖子列表
    setTimeout(() => {
      // 生成模拟数据
      const posts = this.generateMockPosts(postPage, postPageSize, searchValue, postStatusValue, postCategoryValue);
      
      this.setData({
        postList: [...this.data.postList, ...posts],
        hasMorePosts: posts.length === postPageSize,
        loading: false
      });
    }, 1000);
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
  loadStatistics() {
    // 模拟加载统计数据
    setTimeout(() => {
      this.setData({
        statistics: {
          userCount: 128,
          orderCount: 356,
          postCount: 215
        }
      });
    }, 500);
  },

  loadSettings() {
    // 模拟加载系统设置
    const settings = wx.getStorageSync('adminSettings');
    if (settings) {
      this.setData({ settings });
    }
  },

  onSettingChange(e: any) {
    const key = e.currentTarget.dataset.key;
    const value = e.detail.value;
    
    this.setData({
      [`settings.${key}`]: value
    }, () => {
      // 保存设置
      wx.setStorageSync('adminSettings', this.data.settings);
      
      Toast({
        context: this,
        selector: '#t-toast',
        message: '设置已保存',
        theme: 'success'
      });
    });
  },

  onAddAdmin() {
    this.setData({
      addAdminForm: { userId: '' },
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
    
    if (!addAdminForm.userId.trim()) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入用户ID',
        theme: 'warning'
      });
      return;
    }
    
    // 模拟添加管理员
    setTimeout(() => {
      this.setData({ showAddAdminDialog: false });
      
      Toast({
        context: this,
        selector: '#t-toast',
        message: '管理员添加成功',
        theme: 'success'
      });
      
      // 刷新用户列表
      this.resetUserList();
      this.loadUserList();
    }, 500);
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

  onCancelChangePassword() {
    this.setData({ showChangePasswordDialog: false });
  },

  // 订单发布相关方法
  onPublishOrder() {
    this.setData({
      showPublishOrderDialog: true,
      publishOrderForm: {
        orderNumber: '',
        title: '',
        subject: '数学',
        grade: '小学',
        studentGender: '不限',
        teacherRequirements: '',
        location: '',
        salaryRange: '',
        price: 0,
        description: '',
        requirements: '',
        contactInfo: ''
      },
      publishOrderSubjectValue: [0],
      publishOrderGradeValue: [0],
      publishOrderGenderValue: [0]
    });
  },

  onPublishOrderFormChange(e: any) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    this.setData({
      [`publishOrderForm.${field}`]: value
    });
  },

  onPublishOrderSubjectChange(e: any) {
    const selectedIndex = e.detail.value[0];
    const selectedOption = this.data.publishOrderSubjectOptions[selectedIndex];
    this.setData({
      'publishOrderForm.subject': selectedOption.value,
      publishOrderSubjectValue: e.detail.value
    });
  },

  onPublishOrderGradeChange(e: any) {
    const selectedIndex = e.detail.value[0];
    const selectedOption = this.data.publishOrderGradeOptions[selectedIndex];
    this.setData({
      'publishOrderForm.grade': selectedOption.value,
      publishOrderGradeValue: e.detail.value
    });
  },

  onPublishOrderGenderChange(e: any) {
    const selectedIndex = e.detail.value[0];
    const selectedOption = this.data.publishOrderGenderOptions[selectedIndex];
    this.setData({
      'publishOrderForm.studentGender': selectedOption.value,
      publishOrderGenderValue: e.detail.value
    });
  },

  async onConfirmPublishOrder() {
    const form = this.data.publishOrderForm;
    
    // 表单验证
    if (!form.orderNumber.trim()) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入订单编号',
        theme: 'warning'
      });
      return;
    }
    
    if (!form.title.trim()) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入订单标题',
        theme: 'warning'
      });
      return;
    }
    
    if (!form.location.trim()) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入上课地点',
        theme: 'warning'
      });
      return;
    }
    
    if (!form.salaryRange.trim()) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入薪资范围',
        theme: 'warning'
      });
      return;
    }
    
    if (!form.description.trim()) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入订单描述',
        theme: 'warning'
      });
      return;
    }
    
    if (form.price <= 0) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入正确的报酬金额',
        theme: 'warning'
      });
      return;
    }
    
    this.setData({ publishingOrder: true });
    
    try {
      // 调用云函数发布订单
      const result = await wx.cloud.callFunction({
        name: 'publishOrder',
        data: {
          orderNumber: form.orderNumber.trim(),
          title: form.title.trim(),
          subject: form.subject,
          grade: form.grade,
          studentGender: form.studentGender,
          teacherRequirements: form.teacherRequirements.trim(),
          location: form.location.trim(),
          salaryRange: form.salaryRange.trim(),
          price: form.price,
          description: form.description.trim(),
          requirements: form.requirements.trim(),
          contactInfo: form.contactInfo.trim()
        }
      });
      
      console.log('发布订单结果:', result);
      
      // 检查云函数调用是否成功以及返回结果
      if (result.result && typeof result.result === 'object' && (result.result as any).success) {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '订单发布成功',
          theme: 'success'
        });
        
        this.setData({ 
          showPublishOrderDialog: false,
          publishingOrder: false
        });
        
        // 刷新订单列表
        this.resetOrderList();
        this.loadOrderList();
      } else {
        const errorMessage = (result.result && typeof result.result === 'object' ? (result.result as any).message : null) || result.errMsg || '发布订单失败';
        Toast({
          context: this,
          selector: '#t-toast',
          message: errorMessage,
          theme: 'error'
        });
        this.setData({ publishingOrder: false });
      }
    } catch (error) {
      console.error('发布订单失败:', error);
      Toast({
        context: this,
        selector: '#t-toast',
        message: '发布订单失败，请重试',
        theme: 'error'
      });
      this.setData({ publishingOrder: false });
    }
  },

  onCancelPublishOrder() {
    this.setData({ 
      showPublishOrderDialog: false,
      publishingOrder: false
    });
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
    Toast({
      context: this,
      selector: '#t-toast',
      message: '数据备份成功',
      theme: 'success'
    });
  },

  onRestoreData() {
    wx.showModal({
      title: '提示',
      content: '恢复数据将覆盖当前数据，是否继续？',
      success: (res) => {
        if (res.confirm) {
          Toast({
            context: this,
            selector: '#t-toast',
            message: '数据恢复成功',
            theme: 'success'
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
        status,
        subject,
        educationStage: ['小学', '初中', '高中'][index % 3],
        price: 100 + Math.floor(Math.random() * 200),
        publisherName: `用户${index + 1}`,
        createTime: '2023-08-15'
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

  // 页面分享
  onShareAppMessage() {
    return {
      title: '家教小程序 - 管理后台',
      path: '/pages/admin/admin'
    };
  }
});