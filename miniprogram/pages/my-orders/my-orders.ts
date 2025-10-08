interface Order {
  _id: string;
  title: string;
  subject: string;
  grade: string;
  price: number;
  location: string;
  description: string;
  requirements: string;
  contactInfo: string;
  status: 'active' | 'completed' | 'cancelled';
  publisherId: string;
  createTime: string;
  updateTime: string;
  viewCount: number;
  applicantCount: number;
}

Page({
  data: {
    activeTab: 0,
    loading: false,
    orders: [] as Order[],
    orderType: 'published' as 'published' | 'accepted' | 'favorite'
  },

  onLoad(options: any) {
    // 获取页面参数，确定显示哪种类型的订单
    if (options.type) {
      this.setData({
        orderType: options.type
      });
      
      // 根据类型设置标题
      let title = '我的订单';
      switch (options.type) {
        case 'published':
          title = '我发布的订单';
          break;
        case 'accepted':
          title = '我接受的订单';
          break;
        case 'favorite':
          title = '我收藏的订单';
          break;
      }
      
      wx.setNavigationBarTitle({
        title: title
      });
    }
    
    this.loadOrders();
  },

  onShow() {
    this.loadOrders();
  },

  onPullDownRefresh() {
    this.loadOrders().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 加载订单数据
  async loadOrders() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo || !userInfo._id) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    this.setData({ loading: true });

    try {
      const db = wx.cloud.database();
      let query;

      switch (this.data.orderType) {
        case 'published':
          // 获取用户发布的订单
          query = db.collection('orders')
            .where({
              publisherId: userInfo._id
            })
            .orderBy('createTime', 'desc');
          break;
        
        case 'accepted':
          // 获取用户接受的订单（需要从订单申请表中查询）
          // 这里暂时返回空数组，后续可以扩展
          this.setData({
            orders: [],
            loading: false
          });
          return;
        
        case 'favorite':
          // 获取用户收藏的订单（需要从收藏表中查询）
          // 这里暂时返回空数组，后续可以扩展
          this.setData({
            orders: [],
            loading: false
          });
          return;
        
        default:
          query = db.collection('orders')
            .where({
              publisherId: userInfo._id
            })
            .orderBy('createTime', 'desc');
      }

      const result = await query.get();
      
      if (result.data) {
        // 格式化时间
        const orders = result.data.map((order: any) => ({
          ...order,
          createTime: this.formatTime(order.createTime),
          updateTime: this.formatTime(order.updateTime)
        }));
        
        this.setData({
          orders: orders
        });
      }
    } catch (error) {
      console.error('加载订单失败:', error);
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 格式化时间
  formatTime(date: Date | string | number): string {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    
    if (diff < minute) {
      return '刚刚';
    } else if (diff < hour) {
      return Math.floor(diff / minute) + '分钟前';
    } else if (diff < day) {
      return Math.floor(diff / hour) + '小时前';
    } else if (diff < 7 * day) {
      return Math.floor(diff / day) + '天前';
    } else {
      return d.getFullYear() + '-' + 
             String(d.getMonth() + 1).padStart(2, '0') + '-' + 
             String(d.getDate()).padStart(2, '0');
    }
  },

  // 点击订单
  onOrderTap(e: any) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${orderId}`
    });
  },

  // 获取状态文本
  getStatusText(status: string): string {
    switch (status) {
      case 'active':
        return '可接单';
      case 'completed':
        return '已完成';
      case 'cancelled':
        return '已取消';
      default:
        return '未知';
    }
  },

  // 获取状态颜色
  getStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'warning';
      default:
        return 'default';
    }
  }
});