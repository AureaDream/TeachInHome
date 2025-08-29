import Toast from '../../miniprogram_npm/tdesign-miniprogram/toast/index';

interface UserInfo {
  userId: string;
  nickName: string;
  avatarUrl: string;
  phone: string;
  email: string;
  bio: string;
}

interface Stats {
  orderCount: number;
  favoriteCount: number;
  postCount: number;
}

interface EditForm {
  nickName: string;
  phone: string;
  email: string;
  bio: string;
}

interface PrivacySettings {
  publicProfile: boolean;
  orderNotification: boolean;
  forumNotification: boolean;
}

interface Notification {
  id: string;
  title: string;
  content: string;
  time: string;
  read: boolean;
}

Page({
  data: {
    userInfo: {} as UserInfo,
    stats: {} as Stats,
    unreadCount: 0,
    
    // 弹窗状态
    showEditDialog: false,
    showNotificationDialog: false,
    showPrivacyDialog: false,
    showAboutDialog: false,
    
    // 编辑表单
    editForm: {
      nickName: '',
      phone: '',
      email: '',
      bio: ''
    } as EditForm,
    
    // 隐私设置
    privacySettings: {
      publicProfile: true,
      orderNotification: true,
      forumNotification: true
    } as PrivacySettings,
    
    // 消息通知
    notifications: [] as Notification[]
  },

  onLoad() {
    this.checkLoginStatus();
    this.loadUserInfo();
    this.loadStats();
    this.loadNotifications();
    this.loadPrivacySettings();
  },

  onShow() {
    // 刷新用户数据
    this.loadUserInfo();
    this.loadStats();
    this.loadNotifications();
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

  // 加载用户信息
  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      // 从云数据库获取最新用户信息
      const db = wx.cloud.database();
      db.collection('users').doc(userInfo._id).get().then(res => {
        const latestUserInfo = res.data;
        // 更新本地存储
        wx.setStorageSync('userInfo', latestUserInfo);
        
        this.setData({ userInfo: latestUserInfo });
        
        // 初始化编辑表单
        this.setData({
          editForm: {
            nickName: latestUserInfo.nickName || '',
            phone: latestUserInfo.phone || '',
            email: latestUserInfo.email || '',
            bio: latestUserInfo.bio || ''
          }
        });
      }).catch(err => {
        console.error('获取用户信息失败', err);
        // 如果获取失败，使用本地缓存的用户信息
        this.setData({ userInfo });
        
        // 初始化编辑表单
        this.setData({
          editForm: {
            nickName: userInfo.nickName || '',
            phone: userInfo.phone || '',
            email: userInfo.email || '',
            bio: userInfo.bio || ''
          }
        });
      });
    }
  },

  // 加载统计数据
  loadStats() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo || !userInfo._openid) return;
    
    const db = wx.cloud.database();
    const _ = db.command;
    
    // 获取订单数量
    const orderPromise = db.collection('orders')
      .where({
        _openid: userInfo._openid
      })
      .count();
    
    // 获取收藏数量
    const favoritePromise = db.collection('favorites')
      .where({
        _openid: userInfo._openid
      })
      .count();
    
    // 获取帖子数量
    const postPromise = db.collection('posts')
      .where({
        _openid: userInfo._openid
      })
      .count();
    
    // 并行请求
    Promise.all([orderPromise, favoritePromise, postPromise])
      .then(([orderRes, favoriteRes, postRes]) => {
        this.setData({
          stats: {
            orderCount: orderRes.total || 0,
            favoriteCount: favoriteRes.total || 0,
            postCount: postRes.total || 0
          }
        });
      })
      .catch(err => {
        console.error('获取统计数据失败', err);
        // 加载失败时使用默认值
        this.setData({
          stats: {
            orderCount: 0,
            favoriteCount: 0,
            postCount: 0
          }
        });
      });
  },

  // 加载消息通知
  loadNotifications() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo || !userInfo._openid) return;
    
    const db = wx.cloud.database();
    
    db.collection('notifications')
      .where({
        user_id: userInfo._openid
      })
      .orderBy('createTime', 'desc')
      .limit(10)
      .get()
      .then(res => {
        const notifications = res.data.map((item: any) => ({
          id: item._id,
          title: item.title,
          content: item.content,
          time: this.formatTime(item.createTime),
          read: item.read
        }));
        
        const unreadCount = notifications.filter((n: Notification) => !n.read).length;
        
        this.setData({
          notifications,
          unreadCount
        });
      })
      .catch(err => {
        console.error('获取消息通知失败', err);
        // 加载失败时使用空数组
        this.setData({
          notifications: [],
          unreadCount: 0
        });
      });
  },
  
  // 格式化时间
  formatTime(date: Date | string | number) {
    if (!date) return '';
    
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const hour = d.getHours().toString().padStart(2, '0');
    const minute = d.getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hour}:${minute}`;
  },

  // 加载隐私设置
  loadPrivacySettings() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo || !userInfo._openid) return;
    
    const db = wx.cloud.database();
    
    db.collection('user_settings')
      .where({
        _openid: userInfo._openid
      })
      .get()
      .then(res => {
        if (res.data.length > 0) {
          const settings = res.data[0];
          this.setData({
            privacySettings: {
              publicProfile: settings.publicProfile,
              orderNotification: settings.orderNotification,
              forumNotification: settings.forumNotification
            }
          });
          
          // 同步到本地存储
          wx.setStorageSync('privacySettings', this.data.privacySettings);
        } else {
          // 如果没有设置记录，使用默认值并创建记录
          this.createDefaultPrivacySettings(userInfo._openid);
        }
      })
      .catch(err => {
        console.error('获取隐私设置失败', err);
        // 加载失败时使用本地存储或默认值
        const settings = wx.getStorageSync('privacySettings');
        if (settings) {
          this.setData({ privacySettings: settings });
        }
      });
  },
  
  // 创建默认隐私设置
  createDefaultPrivacySettings(openid: string) {
    const defaultSettings = {
      publicProfile: true,
      orderNotification: true,
      forumNotification: true
    };
    
    const db = wx.cloud.database();
    
    db.collection('user_settings')
      .add({
        data: {
          _openid: openid,
          ...defaultSettings,
          createTime: new Date()
        }
      })
      .then(() => {
        this.setData({ privacySettings: defaultSettings });
        wx.setStorageSync('privacySettings', defaultSettings);
      })
      .catch(err => {
        console.error('创建隐私设置失败', err);
      });
  },

  // 退出登录
  onLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 调用云函数退出登录
          wx.cloud.callFunction({
            name: 'logout',
            success: () => {
              // 清除本地登录信息
              wx.removeStorageSync('userInfo');
              wx.removeStorageSync('token');
              wx.removeStorageSync('privacySettings');
              
              // 跳转到登录页
              wx.redirectTo({
                url: '/pages/login/login'
              });
              
              Toast({
                context: this,
                selector: '#t-toast',
                message: '已退出登录',
                theme: 'success'
              });
            },
            fail: (err) => {
              console.error('退出登录失败', err);
              
              // 即使云函数失败，也清除本地信息并退出
              wx.removeStorageSync('userInfo');
              wx.removeStorageSync('token');
              wx.removeStorageSync('privacySettings');
              
              wx.redirectTo({
                url: '/pages/login/login'
              });
            }
          });
        }
      }
    });
  },

  // 编辑个人信息
  onEditProfile() {
    this.setData({ showEditDialog: true });
  },

  onCancelEdit() {
    this.setData({ showEditDialog: false });
  },

  onConfirmEdit() {
    if (!this.validateEditForm()) {
      return;
    }
    
    const { editForm, userInfo } = this.data;
    
    // 显示加载提示
    wx.showLoading({
      title: '更新中...'
    });
    
    // 更新云数据库中的用户信息
    const db = wx.cloud.database();
    db.collection('users').doc(userInfo._id).update({
      data: {
        nickName: editForm.nickName,
        phone: editForm.phone,
        email: editForm.email,
        bio: editForm.bio,
        updateTime: new Date()
      }
    }).then(() => {
      // 更新本地用户信息
      const updatedUserInfo = {
        ...userInfo,
        nickName: editForm.nickName,
        phone: editForm.phone,
        email: editForm.email,
        bio: editForm.bio
      };
      
      wx.setStorageSync('userInfo', updatedUserInfo);
      
      this.setData({
        userInfo: updatedUserInfo,
        showEditDialog: false
      });
      
      wx.hideLoading();
      
      Toast({
        context: this,
        selector: '#t-toast',
        message: '个人信息已更新',
        theme: 'success'
      });
    }).catch(err => {
      console.error('更新用户信息失败', err);
      
      wx.hideLoading();
      
      Toast({
        context: this,
        selector: '#t-toast',
        message: '更新失败，请稍后重试',
        theme: 'error'
      });
    });
  },

  // 验证编辑表单
  validateEditForm(): boolean {
    const { editForm } = this.data;
    
    if (!editForm.nickName.trim()) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入昵称',
        theme: 'warning'
      });
      return false;
    }
    
    if (editForm.phone && !/^1[3-9]\d{9}$/.test(editForm.phone)) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入正确的手机号',
        theme: 'warning'
      });
      return false;
    }
    
    if (editForm.email && !/^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(editForm.email)) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入正确的邮箱',
        theme: 'warning'
      });
      return false;
    }
    
    return true;
  },

  // 消息通知
  onNotificationSettings() {
    this.setData({ showNotificationDialog: true });
    
    // 标记所有通知为已读
    const notifications = this.data.notifications.map(n => ({ ...n, read: true }));
    this.setData({
      notifications,
      unreadCount: 0
    });
  },

  onCloseNotificationDialog() {
    this.setData({ showNotificationDialog: false });
  },

  // 隐私设置
  onPrivacySettings() {
    this.setData({ showPrivacyDialog: true });
  },

  onPrivacyChange(e: any) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    
    this.setData({
      [`privacySettings.${field}`]: value
    });
  },

  onConfirmPrivacy() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo || !userInfo._openid) return;
    
    // 显示加载提示
    wx.showLoading({
      title: '保存中...'
    });
    
    const db = wx.cloud.database();
    
    // 查询是否已有设置记录
    db.collection('user_settings')
      .where({
        _openid: userInfo._openid
      })
      .get()
      .then(res => {
        if (res.data.length > 0) {
          // 更新现有记录
          const settingId = res.data[0]._id;
          return db.collection('user_settings').doc(settingId).update({
            data: {
              ...this.data.privacySettings,
              updateTime: new Date()
            }
          });
        } else {
          // 创建新记录
          return db.collection('user_settings').add({
            data: {
              _openid: userInfo._openid,
              ...this.data.privacySettings,
              createTime: new Date()
            }
          });
        }
      })
      .then(() => {
        // 保存到本地存储
        wx.setStorageSync('privacySettings', this.data.privacySettings);
        
        this.setData({ showPrivacyDialog: false });
        
        wx.hideLoading();
        
        Toast({
          context: this,
          selector: '#t-toast',
          message: '隐私设置已保存',
          theme: 'success'
        });
      })
      .catch(err => {
        console.error('保存隐私设置失败', err);
        
        wx.hideLoading();
        
        Toast({
          context: this,
          selector: '#t-toast',
          message: '保存失败，请稍后重试',
          theme: 'error'
        });
      });
  },

  onCancelPrivacy() {
    this.setData({ showPrivacyDialog: false });
  },

  // 关于我们
  onAboutUs() {
    this.setData({ showAboutDialog: true });
  },

  onCloseAboutDialog() {
    this.setData({ showAboutDialog: false });
  },

  // 联系客服
  onContactService() {
    wx.makePhoneCall({
      phoneNumber: '400-123-4567',
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

  // 用户协议
  onOpenUserAgreement() {
    wx.navigateTo({
      url: '/pages/agreement/agreement?type=user'
    });
  },

  // 隐私政策
  onOpenPrivacyPolicy() {
    wx.navigateTo({
      url: '/pages/agreement/agreement?type=privacy'
    });
  },

  // 页面分享
  onShareAppMessage() {
    return {
      title: '家教小程序 - 个人中心',
      path: '/pages/profile/profile'
    };
  }
});