import Toast from '../../miniprogram_npm/tdesign-miniprogram/toast/index';

interface Order {
  orderId: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  subject: string;
  educationStage: string;
  price: number;
  timeRequirement: string;
  location: string;
  distance: number;
  requirement: string;
  studentName: string;
  studentGender: 'male' | 'female';
  studentGrade: string;
  contactPhone: string;
  publisherName: string;
  publisherAvatar: string;
  createTime: string;
  latitude: number;
  longitude: number;
}

Page({
  data: {
    orderId: '',
    order: null as Order | null,
    loading: true,
    isFavorite: false,
    isAccepted: false,
    showConfirmDialog: false,
    showMapDialog: false,
    mapLocation: {
      latitude: 0,
      longitude: 0
    },
    mapMarkers: [] as any[]
  },

  onLoad(options) {
    // 检查登录状态
    this.checkLoginStatus();
    
    // 获取订单ID
    if (options.id) {
      this.setData({ orderId: options.id });
      this.loadOrderDetail(options.id);
    } else {
      this.setData({ loading: false });
      Toast({
        context: this,
        selector: '#t-toast',
        message: '订单ID不存在',
        theme: 'error'
      });
    }
  },

  onShow() {
    // 检查是否已收藏
    if (this.data.orderId) {
      this.checkFavoriteStatus(this.data.orderId);
      this.checkAcceptStatus(this.data.orderId);
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

  // 加载订单详情
  loadOrderDetail(orderId: string) {
    this.setData({ loading: true });
    
    // 模拟加载订单详情数据
    setTimeout(() => {
      // 模拟订单数据
      const order: Order = {
        orderId: orderId,
        status: 'pending',
        subject: '数学',
        educationStage: '高中',
        price: 150,
        timeRequirement: '每周二、四晚上',
        location: '北京市海淀区中关村南大街5号',
        distance: 2.5,
        requirement: '需要有高中数学教学经验，善于引导学生思考，提高解题能力。重点辅导函数、导数、概率统计等内容。',
        studentName: '张同学',
        studentGender: 'male',
        studentGrade: '高二',
        contactPhone: '13800138000',
        publisherName: '张女士',
        publisherAvatar: 'https://tdesign.gtimg.com/miniprogram/images/avatar1.png',
        createTime: '2023-08-15 10:30:25',
        latitude: 39.9087,
        longitude: 116.3975
      };
      
      this.setData({
        order,
        loading: false,
        mapLocation: {
          latitude: order.latitude,
          longitude: order.longitude
        },
        mapMarkers: [{
          id: 1,
          latitude: order.latitude,
          longitude: order.longitude,
          callout: {
            content: order.location,
            color: '#000000',
            fontSize: 12,
            borderRadius: 4,
            padding: 8,
            display: 'ALWAYS',
            bgColor: '#ffffff'
          }
        }]
      });
      
      // 检查收藏和接单状态
      this.checkFavoriteStatus(orderId);
      this.checkAcceptStatus(orderId);
    }, 1000);
  },

  // 检查收藏状态
  checkFavoriteStatus(orderId: string) {
    // 从本地存储获取收藏列表
    const favoriteList = wx.getStorageSync('favoriteOrders') || [];
    const isFavorite = favoriteList.includes(orderId);
    this.setData({ isFavorite });
  },

  // 检查接单状态
  checkAcceptStatus(orderId: string) {
    // 从本地存储获取已接订单列表
    const acceptedList = wx.getStorageSync('acceptedOrders') || [];
    const isAccepted = acceptedList.includes(orderId);
    this.setData({ isAccepted });
  },

  // 切换收藏状态
  onToggleFavorite() {
    const { orderId, isFavorite } = this.data;
    
    // 获取收藏列表
    let favoriteList = wx.getStorageSync('favoriteOrders') || [];
    
    if (isFavorite) {
      // 取消收藏
      favoriteList = favoriteList.filter((id: string) => id !== orderId);
      Toast({
        context: this,
        selector: '#t-toast',
        message: '已取消收藏',
        theme: 'success'
      });
    } else {
      // 添加收藏
      favoriteList.push(orderId);
      Toast({
        context: this,
        selector: '#t-toast',
        message: '已加入收藏',
        theme: 'success'
      });
    }
    
    // 更新本地存储和状态
    wx.setStorageSync('favoriteOrders', favoriteList);
    this.setData({ isFavorite: !isFavorite });
  },

  // 接单操作
  onAcceptOrder() {
    this.setData({ showConfirmDialog: true });
  },

  // 确认接单
  onConfirmAccept() {
    const { orderId } = this.data;
    
    // 获取已接订单列表
    let acceptedList = wx.getStorageSync('acceptedOrders') || [];
    
    // 添加到已接订单列表
    if (!acceptedList.includes(orderId)) {
      acceptedList.push(orderId);
      wx.setStorageSync('acceptedOrders', acceptedList);
    }
    
    // 更新订单状态
    const order = this.data.order;
    if (order) {
      const updatedOrder: Order = {
        ...order,
        status: 'accepted'
      };
      this.setData({
        order: updatedOrder,
        isAccepted: true,
        showConfirmDialog: false
      });
    }
    
    Toast({
      context: this,
      selector: '#t-toast',
      message: '接单成功',
      theme: 'success'
    });
  },

  // 取消接单确认
  onCancelAccept() {
    this.setData({ showConfirmDialog: false });
  },

  // 查看地图位置
  onViewLocation() {
    this.setData({ showMapDialog: true });
  },

  // 关闭地图
  onCloseMap() {
    this.setData({ showMapDialog: false });
  },

  // 拨打电话联系学生
  onCallStudent() {
    const { order, isAccepted } = this.data;
    
    if (!order || !isAccepted) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请先接单',
        theme: 'warning'
      });
      return;
    }
    
    wx.makePhoneCall({
      phoneNumber: order.contactPhone,
      fail: () => {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '拨打电话失败',
          theme: 'warning'
        });
      }
    });
  },

  // 联系学生
  onContactStudent() {
    this.onCallStudent();
  },

  // 分享订单
  onShare() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  // 获取订单状态文本
  getStatusText(status: string) {
    const statusMap: Record<string, string> = {
      'pending': '待接单',
      'accepted': '已接单',
      'completed': '已完成',
      'cancelled': '已取消'
    };
    return statusMap[status] || '未知状态';
  },

  // 格式化时间
  formatTime(timeStr: string) {
    if (!timeStr) return '';
    
    const date = new Date(timeStr.replace(/-/g, '/'));
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) {
      return '刚刚';
    } else if (diff < 3600) {
      return `${Math.floor(diff / 60)}分钟前`;
    } else if (diff < 86400) {
      return `${Math.floor(diff / 3600)}小时前`;
    } else if (diff < 2592000) {
      return `${Math.floor(diff / 86400)}天前`;
    } else {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
    }
  },

  // 页面分享
  onShareAppMessage() {
    const { order } = this.data;
    return {
      title: `【${order?.subject || ''}家教】${order?.educationStage || ''} ${order?.price || 0}元/小时`,
      path: `/pages/order-detail/order-detail?id=${this.data.orderId}`,
      imageUrl: '/assets/images/share-order.png'
    };
  }
});