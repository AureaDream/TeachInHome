import Toast from '../../miniprogram_npm/tdesign-miniprogram/toast/index';

interface UserInfo {
  _id: string;
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
    showContactDialog: false,
    
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
    notifications: [] as Notification[],
    
    // 客服信息
    customerService: {
      nickname: '一杯',
      wechatId: 'onepeople2city'
    }
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
    console.log('从本地存储获取的用户信息:', userInfo);
    
    if (userInfo && userInfo._id) {
      // 从云数据库获取最新用户信息
      const db = wx.cloud.database();
      db.collection('users').doc(userInfo._id).get().then(res => {
        if (!res.data) {
          console.error('云数据库中未找到用户信息');
          // 使用本地缓存的用户信息
          this.processAvatarUrl(userInfo).then(processedUserInfo => {
            this.setData({ userInfo: processedUserInfo as UserInfo });
            this.initEditForm(processedUserInfo);
          });
          return;
        }
        
        const latestUserInfo = res.data;
        console.log('从云数据库获取的用户信息:', latestUserInfo);
        
        // 优化用户信息合并逻辑
        const mergedUserInfo = {
          ...latestUserInfo,
          // 优先使用云数据库中的最新信息
          nickName: latestUserInfo.nickName || userInfo.nickName || '用户',
          avatarUrl: latestUserInfo.avatarUrl || userInfo.avatarUrl || ''
        };
        
        // 处理头像URL - 如果是云存储fileID，需要获取临时链接
        this.processAvatarUrl(mergedUserInfo).then(processedUserInfo => {
          // 更新本地存储
          wx.setStorageSync('userInfo', processedUserInfo);
          
          this.setData({ userInfo: processedUserInfo as UserInfo });
          this.initEditForm(processedUserInfo);
        }).catch(avatarErr => {
          console.error('处理头像URL失败:', avatarErr);
          // 即使头像处理失败，也要显示用户信息
          mergedUserInfo.avatarUrl = '/images/avatar-default.svg';
          wx.setStorageSync('userInfo', mergedUserInfo);
          this.setData({ userInfo: mergedUserInfo as UserInfo });
          this.initEditForm(mergedUserInfo);
        });
      }).catch(err => {
        console.error('获取用户信息失败', err);
        // 如果获取失败，使用本地缓存的用户信息
        this.processAvatarUrl(userInfo).then(processedUserInfo => {
          this.setData({ userInfo: processedUserInfo as UserInfo });
          this.initEditForm(processedUserInfo);
        }).catch(avatarErr => {
          console.error('处理本地用户头像失败:', avatarErr);
          userInfo.avatarUrl = '/images/avatar-default.svg';
          this.setData({ userInfo: userInfo as UserInfo });
          this.initEditForm(userInfo);
        });
          
          });
    } else {
      // 如果没有本地用户信息，显示默认信息
      const defaultUserInfo = {
        _id: '',
        userId: '',
        nickName: '用户',
        avatarUrl: '/images/avatar-default.svg',
        phone: '',
        email: '',
        bio: ''
      };
      this.setData({ userInfo: defaultUserInfo as UserInfo });
      this.initEditForm(defaultUserInfo);
    }
  },

  // 初始化编辑表单的辅助方法
  initEditForm(userInfo: any) {
    this.setData({
      editForm: {
        nickName: userInfo.nickName || '',
        phone: userInfo.phone || '',
        email: userInfo.email || '',
        bio: userInfo.bio || ''
      }
    });
  },

  // 处理头像URL，将云存储fileID转换为可访问的URL
  async processAvatarUrl(userInfo: any): Promise<any> {
    if (!userInfo) return userInfo;
    
    // 如果avatarUrl是云存储的fileID，需要获取临时下载链接
    if (userInfo.avatarUrl && userInfo.avatarUrl.startsWith('cloud://')) {
      try {
        // 确保云开发环境已初始化
        if (!wx.cloud) {
          console.error('云开发未初始化');
          userInfo.avatarUrl = '/images/avatar-default.svg';
          return userInfo;
        }
        
        wx.cloud.init({
          env: 'cloud1-3gqdqvkpbeab224c'
        });
        
        const result = await wx.cloud.getTempFileURL({
          fileList: [userInfo.avatarUrl]
        });
        
        if (result.fileList && result.fileList.length > 0) {
          const fileInfo = result.fileList[0];
          if (fileInfo.status === 0 && fileInfo.tempFileURL) {
            userInfo.avatarUrl = fileInfo.tempFileURL;
            console.log('头像URL转换成功:', userInfo.avatarUrl);
          } else {
            console.error('获取临时URL失败:', fileInfo.errMsg);
            userInfo.avatarUrl = '/images/avatar-default.svg';
          }
        } else {
          console.error('未获取到文件信息');
          userInfo.avatarUrl = '/images/avatar-default.svg';
        }
      } catch (error) {
        console.error('获取头像临时URL失败:', error);
        // 如果获取失败，使用默认头像
        userInfo.avatarUrl = '/images/avatar-default.svg';
      }
    } else if (!userInfo.avatarUrl || userInfo.avatarUrl === '') {
      // 如果没有头像URL，使用默认头像
      userInfo.avatarUrl = '/images/avatar-default.svg';
    }
    
    return userInfo;
  },

  // 加载统计数据
  loadStats() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo || !userInfo._id) return;
    
    const db = wx.cloud.database();
    const _ = db.command;
    
    // 获取订单数量
    const orderPromise = db.collection('orders')
      .where({
        userId: userInfo._id
      })
      .count();
    
    // 获取收藏数量
    const favoritePromise = db.collection('favorites')
      .where({
        userId: userInfo._id
      })
      .count();
    
    // 获取帖子数量
    const postPromise = db.collection('posts')
      .where({
        userId: userInfo._id
      })
      .count();
    
    // 分别处理每个请求
    let orderCount = 0;
    let favoriteCount = 0;
    let postCount = 0;
    let completedRequests = 0;
    
    const updateStats = () => {
      completedRequests++;
      if (completedRequests === 3) {
        this.setData({
          stats: {
            orderCount,
            favoriteCount,
            postCount
          }
        });
      }
    };
    
    orderPromise.then((res: any) => {
      orderCount = res.total || 0;
      updateStats();
    }).catch(() => updateStats());
    
    favoritePromise.then((res: any) => {
      favoriteCount = res.total || 0;
      updateStats();
    }).catch(() => updateStats());
    
    postPromise.then((res: any) => {
      postCount = res.total || 0;
      updateStats();
    }).catch(() => updateStats());
  },

  // 加载消息通知
  loadNotifications() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo || !userInfo._id) {
      console.log('用户信息不存在，无法加载通知');
      // 如果没有用户信息，先尝试初始化通知数据
      this.initNotificationsData();
      return;
    }
    
    console.log('开始加载消息通知，用户ID:', userInfo._id);
    const db = wx.cloud.database();
    
    db.collection('notifications')
      .where({
        userId: userInfo._id
      })
      .orderBy('createTime', 'desc')
      .limit(10)
      .get()
      .then((res: any) => {
        console.log('获取通知数据成功:', res.data);
        
        if (res.data.length === 0) {
          console.log('没有通知数据，尝试初始化');
          this.initNotificationsData();
          return;
        }
        
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
        // 如果是集合不存在的错误，尝试初始化数据
        if (err.errCode === -502001 || err.message.includes('collection')) {
          console.log('notifications集合不存在，尝试初始化数据');
          this.initNotificationsData();
        } else {
          // 其他错误，使用空数组
          this.setData({
            notifications: [],
            unreadCount: 0
          });
        }
      });
  },

  // 初始化通知数据
  initNotificationsData() {
    console.log('开始初始化通知数据');
    wx.cloud.callFunction({
      name: 'initNotifications',
      data: {}
    }).then((res: any) => {
      console.log('初始化通知数据结果:', res);
      if (res.result && res.result.success) {
        // 初始化成功后重新加载通知
        setTimeout(() => {
          this.loadNotifications();
        }, 1000);
      } else {
        // 初始化失败，创建默认的空状态
        this.setData({
          notifications: [],
          unreadCount: 0
        });
      }
    }).catch(err => {
      console.error('初始化通知数据失败:', err);
      // 创建默认的空状态
      this.setData({
        notifications: [],
        unreadCount: 0
      });
    });
  },
  
  // 格式化时间
  formatTime(date: Date | string | number) {
    if (!date) return '';
    
    let d: Date;
    if (date instanceof Date) {
      d = date;
    } else {
      d = new Date(date as string | number);
    }
    
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString();
    const day = d.getDate().toString();
    const hour = d.getHours().toString();
    const minute = d.getMinutes().toString();
    
    const paddedMonth = month.length === 1 ? '0' + month : month;
    const paddedDay = day.length === 1 ? '0' + day : day;
    const paddedHour = hour.length === 1 ? '0' + hour : hour;
    const paddedMinute = minute.length === 1 ? '0' + minute : minute;
    
    return `${year}-${paddedMonth}-${paddedDay} ${paddedHour}:${paddedMinute}`;
  },

  // 加载隐私设置
  loadPrivacySettings() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo || !userInfo._id) return;
    
    const db = wx.cloud.database();
    
    db.collection('user_settings')
      .where({
        userId: userInfo._id
      })
      .get()
      .then((res: any) => {
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
          this.createDefaultPrivacySettings(userInfo._id);
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
  createDefaultPrivacySettings(userId: string) {
    const defaultSettings = {
      publicProfile: true,
      orderNotification: true,
      forumNotification: true
    };
    
    const db = wx.cloud.database();
    
    db.collection('user_settings')
      .add({
        data: {
          userId: userId,
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
    // 确保编辑表单显示最新的用户信息
    const { userInfo } = this.data;
    console.log('准备编辑个人信息，当前用户信息:', userInfo);
    
    // 检查用户是否已登录
    if (!userInfo || !userInfo._id) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请先登录',
        theme: 'warning'
      });
      wx.navigateTo({
        url: '/pages/login/login'
      });
      return;
    }
    
    // 初始化编辑表单数据
    const editFormData = {
      nickName: userInfo.nickName || '',
      phone: userInfo.phone || '',
      email: userInfo.email || '',
      bio: userInfo.bio || ''
    };
    
    console.log('编辑表单初始数据:', editFormData);
    
    this.setData({
      editForm: editFormData,
      showEditDialog: true
    });
  },

  onCancelEdit() {
    // 取消编辑时重置表单数据
    const { userInfo } = this.data;
    this.setData({
      editForm: {
        nickName: userInfo.nickName || '',
        phone: userInfo.phone || '',
        email: userInfo.email || '',
        bio: userInfo.bio || ''
      },
      showEditDialog: false
    });
  },

  // 表单输入事件处理
  onNickNameChange(e: any) {
    const value = e.detail.value;
    console.log('昵称输入变化:', value);
    this.setData({
      'editForm.nickName': value
    });
  },

  onPhoneChange(e: any) {
    const value = e.detail.value;
    console.log('手机号输入变化:', value);
    this.setData({
      'editForm.phone': value
    });
  },

  onEmailChange(e: any) {
    const value = e.detail.value;
    console.log('邮箱输入变化:', value);
    this.setData({
      'editForm.email': value
    });
  },

  onBioChange(e: any) {
    const value = e.detail.value;
    console.log('个人简介输入变化:', value);
    this.setData({
      'editForm.bio': value
    });
  },

  // 确认编辑个人信息
  async onConfirmEdit() {
    console.log('开始确认编辑个人信息');
    
    // 验证表单数据
    if (!this.validateEditForm()) {
      return;
    }
    
    const { editForm, userInfo } = this.data;
    console.log('准备更新的数据:', editForm);
    console.log('当前用户信息:', userInfo);
    
    // 检查用户ID
    if (!userInfo._id) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '用户信息异常，请重新登录',
        theme: 'error'
      });
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/login/login'
        });
      }, 1500);
      return;
    }
    
    // 显示加载提示
    wx.showLoading({
      title: '更新中...',
      mask: true
    });
    
    try {
      // 初始化云开发环境
      if (!wx.cloud) {
        console.error('云开发未初始化');
        throw new Error('云开发未初始化');
      }
      
      // 设置云开发环境ID
      wx.cloud.init({
        env: 'cloud1-3gqdqvkpbeab224c'
      });
      
      const db = wx.cloud.database();
      
      // 准备更新数据，只更新非空字段
      const updateData: any = {
        updateTime: db.serverDate() // 使用服务器时间
      };
      
      // 只更新有值的字段
      if (editForm.nickName && editForm.nickName.trim()) {
        updateData.nickName = editForm.nickName.trim();
      }
      if (editForm.phone !== undefined) {
        updateData.phone = editForm.phone.trim();
      }
      if (editForm.email !== undefined) {
        updateData.email = editForm.email.trim();
      }
      if (editForm.bio !== undefined) {
        updateData.bio = editForm.bio.trim();
      }
      
      console.log('即将更新到云数据库的数据:', updateData);
      console.log('目标文档ID:', userInfo._id);
      
      // 更新云数据库中的用户信息
      const updateResult = await db.collection('users')
        .doc(userInfo._id)
        .update({
          data: updateData
        });
      
      console.log('云数据库更新结果:', updateResult);
      
      // 检查更新结果
      if (updateResult && (updateResult.stats?.updated > 0 || updateResult.errMsg === 'document.update:ok')) {
        // 更新成功，同步本地数据
        const updatedUserInfo = {
          ...userInfo,
          ...updateData,
          updateTime: new Date() // 本地使用当前时间
        };
        
        // 更新本地存储
        wx.setStorageSync('userInfo', updatedUserInfo);
        
        // 更新页面数据
        this.setData({
          userInfo: updatedUserInfo,
          showEditDialog: false
        });
        
        // 更新全局用户信息（如果存在）
        const app = getApp();
        if (app.globalData && app.globalData.userInfo) {
          app.globalData.userInfo = updatedUserInfo;
        }
        
        wx.hideLoading();
        
        Toast({
          context: this,
          selector: '#t-toast',
          message: '个人信息更新成功',
          theme: 'success'
        });
        
        console.log('个人信息更新完成:', updatedUserInfo);
      } else {
        console.error('更新结果异常:', updateResult);
        throw new Error('更新失败，可能是权限问题或文档不存在');
      }
      
    } catch (error) {
      console.error('更新用户信息失败:', error);
      
      wx.hideLoading();
      
      let errorMessage = '更新失败，请稍后重试';
      
      if (error instanceof Error) {
        const errMsg = error.message.toLowerCase();
        if (errMsg.includes('permission') || errMsg.includes('权限')) {
          errorMessage = '没有权限更新用户信息，请检查数据库权限设置';
        } else if (errMsg.includes('network') || errMsg.includes('网络')) {
          errorMessage = '网络连接失败，请检查网络';
        } else if (errMsg.includes('not found') || errMsg.includes('不存在')) {
          errorMessage = '用户信息不存在，请重新登录';
        } else if (errMsg.includes('云开发')) {
          errorMessage = '云开发服务异常，请稍后重试';
        }
        console.error('详细错误信息:', error.message);
      }
      
      Toast({
        context: this,
        selector: '#t-toast',
        message: errorMessage,
        theme: 'error'
      });
      
      // 如果是用户不存在的错误，跳转到登录页
      if (errorMessage.includes('重新登录')) {
        setTimeout(() => {
          wx.redirectTo({
            url: '/pages/login/login'
          });
        }, 2000);
      }
    }
  },

  // 验证编辑表单
  validateEditForm(): boolean {
    const { editForm } = this.data;
    
    console.log('开始验证表单数据:', editForm);
    
    // 验证昵称
    if (!editForm.nickName || !editForm.nickName.trim()) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入昵称',
        theme: 'warning'
      });
      return false;
    }
    
    if (editForm.nickName.trim().length < 2) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '昵称至少需要2个字符',
        theme: 'warning'
      });
      return false;
    }
    
    if (editForm.nickName.trim().length > 20) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '昵称不能超过20个字符',
        theme: 'warning'
      });
      return false;
    }
    
    // 验证手机号（如果填写了）
    if (editForm.phone && editForm.phone.trim()) {
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(editForm.phone.trim())) {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '请输入正确的手机号格式',
          theme: 'warning'
        });
        return false;
      }
    }
    
    // 验证邮箱（如果填写了）
    if (editForm.email && editForm.email.trim()) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(editForm.email.trim())) {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '请输入正确的邮箱格式',
          theme: 'warning'
        });
        return false;
      }
    }
    
    // 验证个人简介长度
    if (editForm.bio && editForm.bio.trim().length > 200) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '个人简介不能超过200个字符',
        theme: 'warning'
      });
      return false;
    }
    
    console.log('表单验证通过');
    return true;
  },

  // 消息通知 - 跳转到消息通知页面
  onNotificationSettings() {
    wx.navigateTo({
      url: '/pages/notifications/notifications'
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
    if (!userInfo || !userInfo._id) return;
    
    // 显示加载提示
    wx.showLoading({
      title: '保存中...'
    });
    
    const db = wx.cloud.database();
    
    // 查询是否已有设置记录
    db.collection('user_settings')
      .where({
        userId: userInfo._id
      })
      .get()
      .then((res: any) => {
        if (res.data.length > 0) {
          // 更新现有记录
          const settingId = res.data[0]._id as string;
          db.collection('user_settings').doc(settingId).update({
            data: {
              ...this.data.privacySettings,
              updateTime: new Date()
            }
          }).then(() => {
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
          }).catch((err: any) => {
            console.error('更新隐私设置失败', err);
            
            wx.hideLoading();
            
            Toast({
              context: this,
              selector: '#t-toast',
              message: '保存失败，请稍后重试',
              theme: 'error'
            });
          });
        } else {
          // 创建新记录
          db.collection('user_settings').add({
            data: {
              userId: userInfo._id,
              ...this.data.privacySettings,
              createTime: new Date()
            }
          }).then(() => {
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
          }).catch((err: any) => {
            console.error('创建隐私设置失败', err);
            
            wx.hideLoading();
            
            Toast({
              context: this,
              selector: '#t-toast',
              message: '保存失败，请稍后重试',
              theme: 'error'
            });
          });
        }
      })
      .catch((err: any) => {
        console.error('查询隐私设置失败', err);
        
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

  // 编辑头像
  onEditAvatar() {
    // 使用 wx.chooseImage 替代 wx.chooseMedia 以避免磁盘空间问题
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'], // 使用压缩图片减少文件大小
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        this.uploadAvatar(tempFilePath);
      },
      fail: (err) => {
        console.error('选择图片失败', err);
        
        // 根据错误类型提供更具体的错误信息
        let errorMessage = '选择图片失败';
        if (err.errMsg && err.errMsg.includes('ENOSPC')) {
          errorMessage = '设备存储空间不足，请清理后重试';
        } else if (err.errMsg && err.errMsg.includes('cancel')) {
          return; // 用户取消选择，不显示错误提示
        }
        
        Toast({
          context: this,
          selector: '#t-toast',
          message: errorMessage,
          theme: 'error'
        });
      }
    });
  },

  // 上传头像到云存储
  uploadAvatar(tempFilePath: string) {
    wx.showLoading({
      title: '上传中...'
    });

    const userInfo = this.data.userInfo;
    
    // 检查用户信息是否有效
    if (!userInfo || (!userInfo._id && !userInfo.userId)) {
      wx.hideLoading();
      Toast({
        context: this,
        selector: '#t-toast',
        message: '用户信息无效，请重新登录',
        theme: 'error'
      });
      return;
    }

    // 生成唯一的文件名，使用时间戳确保唯一性
    const timestamp = Date.now();
    const fileName = `${userInfo._id || userInfo.userId}_${timestamp}.jpg`;
    const cloudPath = `avatars/${fileName}`;

    wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: tempFilePath,
      success: (uploadRes) => {
        console.log('头像上传成功', uploadRes);
        this.updateUserAvatar(uploadRes.fileID);
      },
      fail: (err) => {
        console.error('头像上传失败', err);
        wx.hideLoading();
        
        // 根据错误类型提供更具体的错误信息
        let errorMessage = '头像上传失败';
        if (err.errMsg && err.errMsg.includes('ENOSPC')) {
          errorMessage = '存储空间不足，请稍后重试';
        } else if (err.errMsg && err.errMsg.includes('network')) {
          errorMessage = '网络连接异常，请检查网络';
        }
        
        Toast({
          context: this,
          selector: '#t-toast',
          message: errorMessage,
          theme: 'error'
        });
      }
    });
  },

  // 更新用户头像信息
  async updateUserAvatar(fileID: string) {
    const db = wx.cloud.database();
    const userInfo = this.data.userInfo;

    try {
      const updateResult = await db.collection('users').doc(userInfo._id).update({
        data: {
          avatarUrl: fileID,
          updateTime: new Date()
        }
      });
      
      console.log('头像更新成功', updateResult);
      wx.hideLoading();
      
      // 获取头像的临时链接用于显示
      const tempUrlResult = await wx.cloud.getTempFileURL({
        fileList: [fileID]
      });
      
      let displayUrl = fileID;
      if (tempUrlResult.fileList && tempUrlResult.fileList.length > 0 && tempUrlResult.fileList[0].tempFileURL) {
        displayUrl = tempUrlResult.fileList[0].tempFileURL;
      }
      
      // 更新本地数据
      const updatedUserInfo = {
        ...userInfo,
        avatarUrl: displayUrl
      };
      
      this.setData({
        userInfo: updatedUserInfo
      });
      
      // 更新本地存储
      wx.setStorageSync('userInfo', {
        ...updatedUserInfo,
        avatarUrl: fileID // 本地存储保存原始fileID
      });
      
      // 更新全局用户信息
      const app = getApp();
      if (app.globalData.userInfo) {
        app.globalData.userInfo.avatarUrl = displayUrl;
      }
      
      Toast({
        context: this,
        selector: '#t-toast',
        message: '头像更新成功',
        theme: 'success'
      });
      
    } catch (err) {
      console.error('头像更新失败', err);
      wx.hideLoading();
      Toast({
        context: this,
        selector: '#t-toast',
        message: '头像更新失败',
        theme: 'error'
      });
    }
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
    this.setData({
      showContactDialog: true
    });
  },

  // 关闭客服弹窗
  onCloseContactDialog() {
    this.setData({
      showContactDialog: false
    });
  },

  // 复制微信号
  onCopyWechatId() {
    const { customerService } = this.data;
    wx.setClipboardData({
      data: customerService.wechatId,
      success: () => {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '微信号已复制到剪贴板',
          theme: 'success'
        });
        // 复制成功后关闭弹窗
        this.setData({
          showContactDialog: false
        });
      },
      fail: (err) => {
        console.error('复制微信号失败', err);
        Toast({
          context: this,
          selector: '#t-toast',
          message: '复制失败，请手动复制',
          theme: 'error'
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