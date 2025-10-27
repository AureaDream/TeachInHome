import Toast from '../../miniprogram_npm/tdesign-miniprogram/toast/index';
import AmapUtil from '../../utils/amap';

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
  salaryRange?: string;
  status: 'pending' | 'active' | 'taken' | 'accepted' | 'completed' | 'cancelled';
  publisherId: string;
  createTime: string;
  updateTime: string;
  viewCount: number;
  applicantCount: number;
  contactInfo?: string;
  collected?: boolean;
  // 派生字段用于UI渲染（避免WXML调用函数）
  statusText?: string;
  statusTheme?: string;
  publishTimeText?: string;
}

Page({
  data: {
    searchValue: '',
    activeTab: 'all',
    loading: false,
    hasMore: true,
    page: 1,
    orders: [] as Order[],
    
    // 定位相关
    userLocation: null as any,
    locationLoading: false,
    
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
    // 启动订单列表实时监听，同步管理员端更新
    this.startOrdersWatcher();
  },

  onHide() {
    this.stopOrdersWatcher();
  },

  onUnload() {
    this.stopOrdersWatcher();
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
    
    // 如果选择了距离筛选但没有定位，提示用户先定位
    if (this.data.tempDistance && this.data.tempDistance !== '不限' && !this.data.userLocation) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请先获取位置信息',
        theme: 'warning'
      });
      return;
    }
    
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

  // 定位功能
  async onGetLocation() {
    if (this.data.locationLoading) return;
    
    this.setData({ locationLoading: true });
    
    try {
      const amapUtil = AmapUtil.getInstance();
      const location = await amapUtil.getCurrentLocation();
      
      this.setData({ 
        userLocation: location,
        locationLoading: false 
      });
      
      Toast({
        context: this,
        selector: '#t-toast',
        message: '定位成功',
        theme: 'success'
      });
      
      // 如果已选择距离筛选，重新加载订单
      if (this.data.selectedDistance && this.data.selectedDistance !== '不限') {
        this.refreshOrders();
      }
    } catch (error: any) {
      this.setData({ locationLoading: false });
      Toast({
        context: this,
        selector: '#t-toast',
        message: error.message || '定位失败',
        theme: 'error'
      });
    }
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
    // 读取本地收藏列表
    let favoriteList: string[] = wx.getStorageSync('favoriteOrders') || [];
    const orders = this.data.orders.map(order => {
      if (order._id === id) {
        const nextCollected = !order.collected;
        order.collected = nextCollected;
        // 同步本地存储
        if (nextCollected) {
          if (!favoriteList.includes(id)) favoriteList.push(id);
        } else {
          favoriteList = favoriteList.filter((oid: string) => oid !== id);
        }
      }
      return order;
    });

    wx.setStorageSync('favoriteOrders', favoriteList);
    this.setData({ orders });

    const isCollected = orders.find(o => o._id === id)?.collected;
    Toast({
      context: this,
      selector: '#t-toast',
      message: isCollected ? '收藏成功' : '取消收藏',
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
          Toast({
            context: this,
            selector: '#t-toast',
            message: '接单成功！请联系管理员确认',
            theme: 'success'
          });

          // 通过云函数写回数据库订单状态，避免前端权限受限
          wx.cloud.callFunction({
            name: 'updateOrder',
            data: {
              orderId: id,
              title: order.title || '未填写',
              studentName: order.studentName || '学生',
              subject: order.subject || '未填写',
              educationStage: order.grade || order.educationStage || '未填写',
              salaryRange: (typeof order.salaryRange === 'string' && order.salaryRange.trim()) ? order.salaryRange.trim() : ((typeof order.price === 'number' && order.price > 0) ? `${order.price}元/小时` : '面议'),
              grade: order.grade || '',
              studentGender: order.studentGender || '',
              teacherRequirements: order.teacherRequirements || '',
              location: order.location || '',
              hoursRequired: order.hoursRequired || 0,
              description: order.description || '',
              requirements: order.requirements || '',
              contactInfo: order.contactInfo || '',
              status: 'accepted'
            }
          }).then((res: any) => {
            if (res && res.result && res.result.success) {
              console.log('云函数更新订单成功');
            } else {
              console.warn('云函数返回非成功:', res);
            }
          }).catch((error: any) => {
            console.error('调用云函数更新订单失败:', error);
            Toast({
              context: this,
              selector: '#t-toast',
              message: '云端状态更新失败，但本地已接单',
              theme: 'warning'
            });
          });

          // 更新订单状态（本地UI，以便即时反馈；实时监听会随后刷新）
          const orders = this.data.orders.map(o => {
            if (o._id === id) {
              o.status = 'accepted';
              o.statusText = this.getStatusText('accepted');
              o.statusTheme = this.getStatusColor('accepted');
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
      
      // 构建查询条件（去除固定的 status 过滤，兼容云端订单的实际状态如 pending/taken/completed/cancelled）
      const collectionRef = db.collection('orders');
      let query: DB.Query = collectionRef;
      
      // 按标签筛选年级
      const tabToGradeMap: Record<string, string | null> = {
        all: null,
        primary: '小学',
        middle: '初中',
        high: '高中',
        university: '大学'
      };
      const gradeFilter = tabToGradeMap[this.data.activeTab];
      if (gradeFilter) {
        query = query.where({ grade: gradeFilter });
      }
      
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

      // 从本地读取收藏列表，状态以云端为准
      const favoriteList: string[] = wx.getStorageSync('favoriteOrders') || [];
      const orders = result.data.map((order: any) => {
        const isCollected = favoriteList.includes(order._id);
        const serverStatus = order.status || 'pending';
        const displaySalaryRange = (typeof order.salaryRange === 'string' && order.salaryRange.trim())
          ? order.salaryRange.trim()
          : (typeof order.price === 'number' && order.price > 0
            ? `${order.price}元/小时`
            : '面议');
        const statusText = this.getStatusText(serverStatus);
        const statusTheme = this.getStatusColor(serverStatus);
        const publishTimeText = this.formatPublishTime(order.createTime);
        return {
          ...order,
          status: serverStatus,
          collected: isCollected,
          salaryRange: displaySalaryRange,
          statusText,
          statusTheme,
          publishTimeText
        } as Order;
      });

      // 应用距离筛选
      let filteredOrders = orders;
      if (this.data.selectedDistance && this.data.selectedDistance !== '不限' && this.data.userLocation) {
        try {
          const amapUtil = AmapUtil.getInstance();
          filteredOrders = await amapUtil.filterOrdersByDistance(
            orders,
            this.data.userLocation,
            this.data.selectedDistance
          );
        } catch (error) {
          console.warn('距离筛选失败:', error);
          // 筛选失败时使用原始订单列表
        }
      }

      this.setData({
        orders: this.data.page === 1 ? filteredOrders : [...this.data.orders, ...filteredOrders],
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

  // 添加实时监听控制方法
  startOrdersWatcher() {
    try {
      const db = wx.cloud.database();
      // 关闭已有监听，避免重复
      // @ts-ignore
      if (this._ordersWatcher) {
        // @ts-ignore
        try { this._ordersWatcher.close(); } catch (e) {}
        // @ts-ignore
        this._ordersWatcher = null;
      }
      // 全量监听订单集合，有变化时刷新列表
      // @ts-ignore
      this._ordersWatcher = db.collection('orders').watch({
        onChange: (snapshot: any) => {
          if (snapshot && Array.isArray(snapshot.docChanges) && snapshot.docChanges.length > 0) {
            // 有变更，刷新数据
            this.refreshOrders();
          }
        },
        onError: (err: any) => {
          console.error('订单列表监听错误:', err);
        }
      });
    } catch (e) {
      console.error('启动订单列表监听失败:', e);
    }
  },

  stopOrdersWatcher() {
    try {
      // @ts-ignore
      if (this._ordersWatcher) {
        // @ts-ignore
        this._ordersWatcher.close();
        // @ts-ignore
        this._ordersWatcher = null;
      }
    } catch (e) {
      console.error('关闭订单列表监听失败:', e);
    }
  },


  // 格式化时间为相对时间：刚刚/分钟前/小时前/天前
  formatTime(timeStr: string): string {
    if (!timeStr) return '';
    const date = new Date(String(timeStr).replace(/-/g, '/'));
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSeconds < 60) {
      return '刚刚';
    } else if (diffSeconds < 3600) {
      return `${Math.floor(diffSeconds / 60)}分钟前`;
    } else if (diffSeconds < 86400) {
      return `${Math.floor(diffSeconds / 3600)}小时前`;
    }
    return `${Math.floor(diffSeconds / 86400)}天前`;
  },

  // 按 profile 页逻辑格式化时间为 YYYY-MM-DD HH:mm
  formatPublishTime(dateInput: Date | string | number) {
    if (!dateInput) return '';
    let d: Date;
    if (dateInput instanceof Date) {
      d = dateInput;
    } else {
      d = new Date(dateInput as any);
    }
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hour = d.getHours();
    const minute = d.getMinutes();
    const pad = (n: number) => (n < 10 ? '0' + n : String(n));
    return `${year}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(minute)}`;
  },

  // 统一订单状态文本
  getStatusText(status: string): string {
    switch (status) {
      case 'pending':
      case 'active':
        return '可接单';
      case 'taken':
      case 'accepted':
        return '已接单';
      case 'completed':
        return '已完成';
      case 'cancelled':
        return '已取消';
      default:
        return '未知状态';
    }
  },

  // 统一订单状态颜色（TDesign Tag主题）
  getStatusColor(status: string): string {
    switch (status) {
      case 'pending':
      case 'active':
        return 'success';
      case 'taken':
      case 'accepted':
        return 'primary';
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'warning';
      default:
        return 'default';
    }
  }
});