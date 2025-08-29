import Toast from '../../miniprogram_npm/tdesign-miniprogram/toast/index';

interface Order {
  id: string;
  subject: string;
  grade: string;
  location: string;
  distance: string;
  timeRequirement: string;
  studentInfo: string;
  requirements?: string;
  salary: number;
  salaryUnit: string;
  status: 'available' | 'taken';
  statusText: string;
  publishTime: string;
  collected: boolean;
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
    const order = e.currentTarget.dataset.order;
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${order.id}`
    });
  },

  onCollectOrder(e: any) {
    const id = e.currentTarget.dataset.id;
    const orders = this.data.orders.map(order => {
      if (order.id === id) {
        order.collected = !order.collected;
      }
      return order;
    });
    
    this.setData({ orders });
    
    Toast({
      context: this,
      selector: '#t-toast',
      message: orders.find(o => o.id === id)?.collected ? '收藏成功' : '取消收藏',
      theme: 'success'
    });
  },

  onTakeOrder(e: any) {
    const id = e.currentTarget.dataset.id;
    const order = this.data.orders.find(o => o.id === id);
    
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
            if (o.id === id) {
              o.status = 'taken';
              o.statusText = '已接单';
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

  loadOrders() {
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    
    // 模拟API请求
    setTimeout(() => {
      const mockOrders = this.generateMockOrders();
      const filteredOrders = this.filterOrders(mockOrders);
      
      this.setData({
        orders: this.data.page === 1 ? filteredOrders : [...this.data.orders, ...filteredOrders],
        loading: false,
        hasMore: filteredOrders.length === 10
      });
      
      wx.stopPullDownRefresh();
    }, 1000);
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

  // 生成模拟数据
  generateMockOrders(): Order[] {
    const subjects = ['语文', '数学', '英语', '物理', '化学'];
    const grades = ['小学三年级', '初中二年级', '高中一年级', '大学一年级'];
    const locations = ['福州市鼓楼区', '福州市台江区', '福州市仓山区', '福州市晋安区'];
    const distances = ['1.2km', '2.5km', '3.8km', '5.1km'];
    
    return Array.from({ length: 10 }, (_, index) => ({
      id: `order_${Date.now()}_${index}`,
      subject: subjects[Math.floor(Math.random() * subjects.length)],
      grade: grades[Math.floor(Math.random() * grades.length)],
      location: locations[Math.floor(Math.random() * locations.length)],
      distance: distances[Math.floor(Math.random() * distances.length)],
      timeRequirement: '每周2次，每次2小时',
      studentInfo: '男生，基础较好，需要提升成绩',
      requirements: '有耐心，有经验优先',
      salary: Math.floor(Math.random() * 200) + 50,
      salaryUnit: '小时',
      status: Math.random() > 0.7 ? 'taken' : 'available',
      statusText: Math.random() > 0.7 ? '已接单' : '可接单',
      publishTime: this.formatTime(new Date(Date.now() - Math.random() * 86400000 * 7)),
      collected: Math.random() > 0.8
    }));
  },

  // 筛选订单
  filterOrders(orders: Order[]): Order[] {
    const { activeTab, searchValue, selectedSubject, selectedDistance, selectedSalary } = this.data;
    
    return orders.filter(order => {
      // 按标签筛选
      if (activeTab !== 'all') {
        const gradeMap: { [key: string]: string } = {
          'primary': '小学',
          'middle': '初中',
          'high': '高中',
          'university': '大学'
        };
        if (!order.grade.includes(gradeMap[activeTab])) {
          return false;
        }
      }
      
      // 按搜索词筛选
      if (searchValue && !order.subject.includes(searchValue) && !order.location.includes(searchValue)) {
        return false;
      }
      
      // 按学科筛选
      if (selectedSubject && order.subject !== selectedSubject) {
        return false;
      }
      
      // 按距离筛选
      if (selectedDistance && selectedDistance !== '不限') {
        const distanceNum = parseFloat(order.distance);
        const filterNum = parseInt(selectedDistance);
        if (distanceNum > filterNum) {
          return false;
        }
      }
      
      // 按报酬筛选
      if (selectedSalary) {
        const salary = order.salary;
        if (selectedSalary === '50元以下' && salary >= 50) return false;
        if (selectedSalary === '50-100元' && (salary < 50 || salary > 100)) return false;
        if (selectedSalary === '100-200元' && (salary < 100 || salary > 200)) return false;
        if (selectedSalary === '200-300元' && (salary < 200 || salary > 300)) return false;
        if (selectedSalary === '300元以上' && salary < 300) return false;
      }
      
      return true;
    });
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