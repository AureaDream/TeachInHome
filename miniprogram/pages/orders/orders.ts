import Toast from '../../miniprogram_npm/tdesign-miniprogram/toast/index';

interface Order {
  [x: string]: any;
  _id: string;
  title: string;
  subject: string;
  grade: string;
  location: string;
  description: string;
  requirements?: string;
  price: number;
  status: 'active' | 'completed' | 'cancelled' | 'taken';
  publisherId: string;
  createTime: Date;
  updateTime: Date;
  viewCount: number;
  applicantCount: number;
  contactInfo?: string;
  collected?: boolean;
}

Page({
  data: {
    searchValue: '',
    activeTab: 'all',
    loading: false,
    hasMore: true,
    page: 1,
    orders: [] as Order[],
    
    // 筛选相关
    selectedSubject: '',
    selectedDistance: '',
    selectedSalary: '',
    showSubjectDialog: false,
    showDistanceDialog: false,
    showSalaryDialog: false,
    tempSubject: '',
    tempDistance: '',
    tempSalary: '',
    
    // 筛选选项
    subjects: ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治'],
    distances: ['1公里内', '3公里内', '5公里内', '10公里内', '不限'],
    salaryRanges: ['50元以下', '50-100元', '100-200元', '200-300元', '300元以上']
  },

  onLoad() {
    this.checkLoginStatus();
    this.loadOrders();
  },

  onShow() {
    // 刷新订单列表
    this.refreshOrders();
  },

  onPullDownRefresh() {
    this.refreshOrders();
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore();
    }
  },

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      wx.redirectTo({
        url: '/pages/login/login'
      });
    }
  },

  // 搜索
  onSearchChange(e: any) {
    this.setData({
      searchValue: e.detail.value
    });
  },

  onSearch() {
    this.refreshOrders();
  },

  // 标签切换
  onTabChange(e: any) {
    this.setData({
      activeTab: e.detail.value
    });
    this.refreshOrders();
  },

  // 筛选器
  onShowSubjectFilter() {
    this.setData({
      showSubjectDialog: true,
      tempSubject: this.data.selectedSubject
    });
  },

  onShowDistanceFilter() {
    this.setData({
      showDistanceDialog: true,
      tempDistance: this.data.selectedDistance
    });
  },

  onShowSalaryFilter() {
    this.setData({
      showSalaryDialog: true,
      tempSalary: this.data.selectedSalary
    });
  },

  onSubjectChange(e: any) {
    this.setData({
      tempSubject: e.detail.value
    });
  },

  onDistanceChange(e: any) {
    this.setData({
      tempDistance: e.detail.value
    });
  },

  onSalaryChange(e: any) {
    this.setData({
      tempSalary: e.detail.value
    });
  },

  onConfirmSubject() {
    this.setData({
      selectedSubject: this.data.tempSubject,
      showSubjectDialog: false
    });
    this.refreshOrders();
  },

  onConfirmDistance() {
    this.setData({
      selectedDistance: this.data.tempDistance,
      showDistanceDialog: false
    });
    this.refreshOrders();
  },

  onConfirmSalary() {
    this.setData({
      selectedSalary: this.data.tempSalary,
      showSalaryDialog: false
    });
    this.refreshOrders();
  },

  onCancelSubject() {
    this.setData({
      showSubjectDialog: false
    });
  },

  onCancelDistance() {
    this.setData({
      showDistanceDialog: false
    });
  },

  onCancelSalary() {
    this.setData({
      showSalaryDialog: false
    });
  },

  onResetFilter() {
    this.setData({
      selectedSubject: '',
      selectedDistance: '',
      selectedSalary: ''
    });
    this.refreshOrders();
  },

  // 订单操作
  onOrderTap(e: any) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${orderId}`
    });
  },

  onCollectOrder(e: any) {
    const id = e.currentTarget.dataset.id;
    const orders = this.data.orders.map(order => {
      if (order._id === id) {
        order.collected = !order.collected;
      }
      return order;
    });
    
    this.setData({ orders });
    
    Toast({
      context: this,
      selector: '#t-toast',
      message: orders.find(o => o._id === id)?.collected ? '收藏成功' : '取消收藏',
      theme: 'success'
    });
  },

  onTakeOrder(e: any) {
    const id = e.currentTarget.dataset.id;
    const order = this.data.orders.find(o => o._id === id);
    
    if (!order) return;
    
    wx.showModal({
      title: '确认接单',
      content: `确定要接取这个${order.subject}订单吗？`,
      success: (res) => {
        if (res.confirm) {
          // 模拟接单成功
          Toast({
            context: this,
            selector: '#t-toast',
            message: '接单成功！请联系管理员确认',
            theme: 'success'
          });
          
          // 更新订单状态
          const orders = this.data.orders.map(o => {
            if (o._id === id) {
              o.status = 'taken';
            }
            return o;
          });
          
          this.setData({ orders });
        }
      }
    });
  },

  // 数据加载
  refreshOrders() {
    this.setData({
      page: 1,
      orders: [],
      hasMore: true
    });
    this.loadOrders();
  },

  async loadOrders() {
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    
    try {
      const db = wx.cloud.database();
      const pageSize = 20;
      
      // 构建查询条件
      let query = db.collection('orders').where({
        status: 'active' // 只显示活跃的订单
      });
      
      // 添加搜索条件
      if (this.data.searchValue) {
        query = query.where({
          title: db.RegExp({
            regexp: this.data.searchValue,
            options: 'i'
          })
        });
      }
      
      // 添加科目筛选
      if (this.data.selectedSubject) {
        query = query.where({
          subject: this.data.selectedSubject
        });
      }
      
      // 获取订单数据
      const result = await query
        .orderBy('createTime', 'desc')
        .skip((this.data.page - 1) * pageSize)
        .limit(pageSize)
        .get();
      
      console.log('订单查询结果:', result);
      
      const orders = result.data.map((order: any) => ({
        ...order,
        collected: false // 默认未收藏，后续可以从用户收藏列表中获取
      }));
      
      this.setData({
        orders: this.data.page === 1 ? orders : [...this.data.orders, ...orders],
        loading: false,
        hasMore: orders.length === pageSize
      });
      
    } catch (error) {
      console.error('加载订单失败:', error);
      Toast({
        context: this,
        selector: '#t-toast',
        message: '加载订单失败，请重试',
        theme: 'error'
      });
      
      this.setData({ loading: false });
    }
    
    wx.stopPullDownRefresh();
  },

  loadMore() {
    this.setData({
      page: this.data.page + 1
    });
    this.loadOrders();
  },

  onLoadMore() {
    this.loadMore();
  },



  // 格式化时间
  formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return '今天';
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    }
  }
});