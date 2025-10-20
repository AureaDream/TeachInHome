import Toast from '../../miniprogram_npm/tdesign-miniprogram/toast/index';

interface Order {
  title: string;
  orderId: string;
  status: 'pending' | 'active' | 'taken' | 'accepted' | 'completed' | 'cancelled';
  statusText?: string;
  statusTheme?: string;
  subject: string;
  educationStage: string;
  price: number; // 兼容旧字段，不存在则回退为0
  salaryRange?: string; // 云端字段（字符串区间）
  timeRequirement?: string; // 兼容旧字段
  hoursRequired?: number; // 云端课时字段
  location: string;
  distance?: number; // 兼容旧字段
  requirement: string; // 综合 description/requirements/teacherRequirements
  studentName?: string;
  studentGender?: 'male' | 'female' | '';
  studentGrade?: string;
  contactPhone?: string; // 映射自 contactInfo
  publisherName?: string;
  publisherAvatar?: string;
  createTime: string;
  publishTimeText?: string;
  latitude?: number;
  longitude?: number;
}

Page({
  data: {
    orderId: '',
    order: null as Order | null,
    loading: true,
    isFavorite: false,
    // 移除本地 isAccepted，改用云端状态判断
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
      // 启动订单详情实时监听
      this.startOrderWatcher();
    }
  },

  onHide() {
    this.stopOrderWatcher();
  },

  onUnload() {
    this.stopOrderWatcher();
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
    const db = wx.cloud.database();
    db.collection('orders').doc(orderId).get()
      .then(res => {
        const d = res.data || {};
        // 统一计算薪资范围：优先使用 salaryRange；否则回退到 price 字段；再否则为『面议』
        const salaryRange = (typeof d.salaryRange === 'string' && d.salaryRange.trim())
          ? d.salaryRange.trim()
          : (typeof d.price === 'number' && d.price > 0
            ? `${d.price}元/小时`
            : '面议');
        const displayOrderId = (typeof d.orderId === 'string' && d.orderId.trim())
          ? d.orderId.trim()
          : ((typeof d.orderNumber === 'string' && d.orderNumber.trim()) ? d.orderNumber.trim() : '');
        // 标准化创建时间为字符串
        const ctRaw = d.createTime;
        const createTimeStr = !ctRaw
          ? new Date().toISOString()
          : (ctRaw instanceof Date
            ? ctRaw.toISOString()
            : (typeof ctRaw === 'string' ? ctRaw : String(ctRaw)));

        const order: Order = {
          title: d.title || '未填写',
          // 页面展示用订单编号：优先 orderId，其次 orderNumber，不再使用 _id
          orderId: displayOrderId || '未提供',
          status: d.status || 'pending',
          statusText: this.getStatusText(d.status || 'pending'),
          statusTheme: this.getStatusTheme(d.status || 'pending'),
          subject: d.subject || '未填写',
          educationStage: d.grade || d.educationStage || '未填写',
          price: typeof d.price === 'number' ? d.price : 0,
          salaryRange,
          timeRequirement: d.timeRequirement,
          hoursRequired: typeof d.hoursRequired === 'number' ? d.hoursRequired : undefined,
          location: d.location || '未填写',
          distance: typeof d.distance === 'number' ? d.distance : undefined,
          requirement: d.requirements || d.teacherRequirements || d.description || '',
          studentName: d.studentName || '',
          studentGender: (d.StudentGender ?? d.studentGender ?? d.gender ?? ''),
          studentGrade: d.grade || '',
          contactPhone: d.contactInfo || '',
          publisherName: d.publisherName || '管理员',
          publisherAvatar: d.publisherAvatar || 'https://tdesign.gtimg.com/miniprogram/images/avatar1.png',
          createTime: createTimeStr,
          publishTimeText: this.formatPublishTime(createTimeStr),
          latitude: typeof d.latitude === 'number' ? d.latitude : undefined,
          longitude: typeof d.longitude === 'number' ? d.longitude : undefined
        };

        const mapLocation = (order.latitude && order.longitude) ? {
          latitude: order.latitude,
          longitude: order.longitude
        } : { latitude: 0, longitude: 0 };

        const mapMarkers = (order.latitude && order.longitude) ? [{
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
        }] : [];

        this.setData({
          order,
          loading: false,
          mapLocation,
          mapMarkers
        });

        // 检查收藏状态（接单状态以云端为准，不再本地覆盖）
        this.checkFavoriteStatus(orderId);
      })
      .catch(error => {
        console.error('加载订单详情失败:', error);
        this.setData({ loading: false, order: null });
        Toast({
          context: this,
          selector: '#t-toast',
          message: '订单加载失败或已删除',
          theme: 'error'
        });
      });
  },

  // 检查收藏状态
  checkFavoriteStatus(orderId: string) {
    // 从本地存储获取收藏列表
    const favoriteList = wx.getStorageSync('favoriteOrders') || [];
    const isFavorite = favoriteList.includes(orderId);
    this.setData({ isFavorite });
  },

  // 检查接单状态
  // checkAcceptStatus(orderId: string) { /* 已删除，接单状态以云端为准 */ },

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
    
    // 直接更新订单状态（仅本地UI即时反馈，云端为准）
    const order = this.data.order;
    if (order) {
      const updatedOrder: Order = {
        ...order,
        status: 'accepted',
        statusText: this.getStatusText('accepted'),
        statusTheme: this.getStatusTheme('accepted')
      };
      this.setData({
        order: updatedOrder,
        showConfirmDialog: false
      });
    }
    
    // 写回数据库订单状态
    wx.cloud.callFunction({
      name: 'updateOrder',
      data: {
        orderId,
        title: this.data.order?.title || '未填写',
        studentName: this.data.order?.studentName || '学生',
        subject: this.data.order?.subject || '未填写',
        educationStage: this.data.order?.educationStage || '未填写',
        salaryRange: this.data.order?.salaryRange || '面议',
        grade: this.data.order?.studentGrade || '',
        studentGender: this.data.order?.studentGender || '',
        teacherRequirements: '',
        location: this.data.order?.location || '',
        hoursRequired: this.data.order?.hoursRequired || 0,
        description: this.data.order?.requirement || '',
        requirements: this.data.order?.requirement || '',
        contactInfo: this.data.order?.contactPhone || '',
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
    const { order } = this.data;
    
    if (!order || !(order.status === 'accepted' || order.status === 'taken')) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请先接单',
        theme: 'warning'
      });
      return;
    }
    // 联系方式必须存在且为字符串
    if (!order.contactPhone) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '暂无联系方式',
        theme: 'warning'
      });
      return;
    }
    const phoneNumber: string = order.contactPhone;
    
    wx.makePhoneCall({
      phoneNumber,
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

  // 实时监听订单详情
  startOrderWatcher() {
    const { orderId } = this.data;
    if (!orderId) return;
    try {
      const db = wx.cloud.database();
      // @ts-ignore
      if (this._orderWatcher) {
        // @ts-ignore
        try { this._orderWatcher.close(); } catch (e) {}
        // @ts-ignore
        this._orderWatcher = null;
      }
      // 通过查询监听指定文档
      // @ts-ignore
      this._orderWatcher = db.collection('orders').where({ _id: orderId }).watch({
        onChange: (snapshot: any) => {
          const doc = snapshot && Array.isArray(snapshot.docs) ? snapshot.docs[0] : null;
          if (!doc) return;
          const status = doc.status || 'pending';
          const order = this.data.order;
          const updatedOrder: Order = {
            ...(order || {
              title: doc.title || '未填写',
              orderId: (typeof doc.orderId === 'string' && doc.orderId.trim()) ? doc.orderId.trim() : (doc.orderNumber || ''),
              subject: doc.subject || '未填写',
              educationStage: doc.grade || doc.educationStage || '未填写',
              price: typeof doc.price === 'number' ? doc.price : 0,
              salaryRange: (typeof doc.salaryRange === 'string' && doc.salaryRange.trim()) ? doc.salaryRange.trim() : undefined,
              location: doc.location || '未填写',
              createTime: (doc.createTime instanceof Date ? doc.createTime.toISOString() : (doc.createTime || new Date().toISOString())),
              publishTimeText: this.formatPublishTime(doc.createTime || ''),
            } as Order),
            status,
            statusText: this.getStatusText(status),
            statusTheme: this.getStatusTheme(status)
          };
          this.setData({ order: updatedOrder });
        },
        onError: (err: any) => {
          console.error('订单详情监听错误:', err);
        }
      });
    } catch (e) {
      console.error('启动订单详情监听失败:', e);
    }
  },

  stopOrderWatcher() {
    try {
      // @ts-ignore
      if (this._orderWatcher) {
        // @ts-ignore
        this._orderWatcher.close();
        // @ts-ignore
        this._orderWatcher = null;
      }
    } catch (e) {
      console.error('关闭订单详情监听失败:', e);
    }
  },

  // 获取订单状态文本
  getStatusText(status: string) {
    const statusMap: Record<string, string> = {
      'pending': '待接单',
      'active': '待接单',
      'taken': '已接单',
      'accepted': '已接单',
      'completed': '已完成',
      'cancelled': '已取消'
    };
    return statusMap[status] || '未知状态';
  },

  // 获取状态主题颜色（用于 t-tag）
  getStatusTheme(status: string) {
    const themeMap: Record<string, string> = {
      'pending': 'primary',
      'active': 'primary',
      'taken': 'primary',
      'accepted': 'primary',
      'completed': 'default',
      'cancelled': 'warning'
    };
    return themeMap[status] || 'primary';
  },

  // 格式化时间为相对时间，兼容字符串、Date、时间戳
  formatTime(timeStr: any) {
    if (!timeStr) return '';
    const raw = timeStr as any;
    const s = String(raw);
    let date: Date;
    if (/^\d+$/.test(s)) {
      date = new Date(Number(s));
    } else {
      date = new Date(s.includes('T') ? s : s.replace(/-/g, '/'));
    }
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    return `${Math.floor(diff / 86400)}天前`;
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

  // 仅格式化为日期（去除时间戳，如 T03:28:38.817Z）
  formatDate(timeStr: string) {
    if (!timeStr) return '';
    const s = String(timeStr);
    if (s.includes('T')) {
      return s.split('T')[0];
    }
    if (s.includes(' ')) {
      return s.split(' ')[0];
    }
    const d = new Date(s.replace(/-/g, '/'));
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const day = d.getDate();
      return `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
    }
    return s;
  },

  // 性别展示格式化，兼容 '男'/'女'、'male'/'female'、'M'/'F'、1/2 等
  formatGender(gender: any) {
    const raw = gender;
    const val = String(raw).trim().toLowerCase();
    if (val === 'male' || val === 'm' || val === '1' || raw === '男') return '男';
    if (val === 'female' || val === 'f' || val === '2' || raw === '女') return '女';
    return '未知';
  },

  // 页面分享
  onShareAppMessage() {
    const { order } = this.data;
    return {
      title: `【${order?.subject || ''}家教】${order?.educationStage || ''} ${order?.salaryRange || '面议'}`,
      path: `/pages/order-detail/order-detail?id=${this.data.orderId}`,
      imageUrl: '/assets/images/share-order.png'
    };
  }
  ,
  // 朋友圈分享
  onShareTimeline() {
    const { orderId, order } = this.data;
    return {
      title: `【${order?.subject || ''}家教】${order?.educationStage || ''} 详单`,
      query: `id=${orderId}`,
      imageUrl: '/assets/images/share-order.png'
    };
  }
});

// 实时监听订单详情


// 关闭订单详情监听失败: