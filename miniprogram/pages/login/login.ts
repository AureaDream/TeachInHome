import Toast from '../../miniprogram_npm/tdesign-miniprogram/toast/index';

Page({
  data: {
    wechatLoading: false,
    adminLoading: false,
    showAdminDialog: false,
    adminUsername: '',
    adminPassword: ''
  },

  onLoad() {
    // 检查是否已登录
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.redirectToMain();
    }
  },

  // 微信一键登录
  onWechatLogin() {
    this.setData({ wechatLoading: true });
    
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        console.log('获取用户信息成功', res);
        
        // 调用云函数登录
        wx.cloud.callFunction({
          name: 'login',
          data: {
            userInfo: res.userInfo
          },
          success: (result) => {
            console.log('云函数登录成功', result);
            // 检查云函数返回结果并添加类型断言
            if (!result.result) {
              console.error('云函数返回结果为空');
              this.loginFail();
              return;
            }
            const { openid, userInfo } = result.result as { openid: string, userInfo: any };
            
            // 检查用户是否已存在
            const db = wx.cloud.database();
            db.collection('users').where({
              _openid: openid
            }).get().then(res => {
              if (res.data.length > 0) {
                // 用户已存在，更新信息
                const dbUserInfo = res.data[0];
                // 添加类型断言，确保 userId 是 string 类型
                const userId = dbUserInfo._id as string;
                
                // 合并用户信息，确保包含所有必要字段
                // 只有当用户没有自定义昵称和头像时，才使用微信信息
                const shouldUpdateNickName = !dbUserInfo.nickName || dbUserInfo.nickName === '微信用户' || dbUserInfo.nickName === '测试用户';
                const shouldUpdateAvatar = !dbUserInfo.avatarUrl || dbUserInfo.avatarUrl === '';
                
                const updatedUserInfo = {
                  ...dbUserInfo,
                  userId: dbUserInfo.userId || dbUserInfo._id,
                  nickName: shouldUpdateNickName ? userInfo.nickName : dbUserInfo.nickName,
                  avatarUrl: shouldUpdateAvatar ? userInfo.avatarUrl : dbUserInfo.avatarUrl,
                  lastLoginTime: new Date(),
                  isAdmin: false,
                  role: dbUserInfo.role || 'user'
                };
                
                // 准备更新数据库的数据
                const updateData: any = {
                  lastLoginTime: new Date()
                };
                
                // 只有需要更新时才添加昵称和头像
                if (shouldUpdateNickName) {
                  updateData.nickName = userInfo.nickName;
                }
                if (shouldUpdateAvatar) {
                  updateData.avatarUrl = userInfo.avatarUrl;
                }
                
                // 更新数据库
                db.collection('users').doc(userId).update({
                  data: updateData
                }).then(() => {
                  // 保存到本地
                  wx.setStorageSync('userInfo', updatedUserInfo);
                  this.loginSuccess();
                }).catch(err => {
                  console.error('更新用户信息失败', err);
                  this.loginFail();
                });
              } else {
                // 新用户，创建记录
                console.log('创建新用户，微信用户信息:', userInfo);
                
                const newUser: any = {
                  userId: openid, // 使用openid作为userId
                  nickName: userInfo.nickName || '微信用户',
                  avatarUrl: userInfo.avatarUrl || '',
                  loginType: 'wechat',
                  isAuthenticated: false,
                  createTime: db.serverDate(),
                  lastLoginTime: db.serverDate(),
                  phone: '',
                  email: '',
                  bio: '',
                  role: 'user',
                  isAdmin: false,
                  status: 'active'
                  // _openid 字段由云数据库自动添加，不需要手动设置
                };
                
                console.log('准备创建的用户数据:', newUser);
                
                db.collection('users').add({
                  data: newUser
                }).then(res => {
                  console.log('用户创建成功:', res);
                  // 添加ID并保存到本地，确保包含所有必要字段
                  const completeUserInfo = {
                    ...newUser,
                    _id: res._id,
                    userId: newUser.userId || res._id
                  };
                  
                  // 保存到本地存储
                  wx.setStorageSync('userInfo', completeUserInfo);
                  console.log('用户信息已保存到本地:', newUser);
                  
                  this.loginSuccess();
                }).catch(err => {
                  console.error('创建用户失败:', err);
                  console.error('错误详情:', err.errMsg);
                  this.loginFail();
                });
              }
            }).catch(err => {
              console.error('查询用户失败', err);
              this.loginFail();
            });
          },
          fail: (err) => {
            console.error('云函数调用失败', err);
            this.loginFail();
          }
        });
      },
      fail: (err) => {
        console.error('获取用户信息失败', err);
        this.loginFail();
      },
      complete: () => {
        this.setData({ wechatLoading: false });
      }
    });
  },
  
  // 登录成功处理
  loginSuccess() {
    Toast({
      context: this,
      selector: '#t-toast',
      message: '登录成功',
      theme: 'success'
    });
    
    setTimeout(() => {
      this.redirectToMain();
    }, 1500);
  },
  
  // 登录失败处理
  loginFail() {
    Toast({
      context: this,
      selector: '#t-toast',
      message: '登录失败，请重试',
      theme: 'error'
    });
  },

  // 手机号登录功能已移除（onPhoneChange）

  // 手机号登录功能已移除（onCodeChange）

  // 手机号登录功能已移除（onSendCode）

  // 手机号登录功能已移除（startCountdown）

  // 手机号登录功能已移除（onPhoneLogin）

  // 显示用户协议
  onShowAgreement() {
    wx.showModal({
      title: '用户协议',
      content: '这里是用户协议的内容...',
      showCancel: false
    });
  },

  // 显示隐私政策
  onShowPrivacy() {
    wx.showModal({
      title: '隐私政策',
      content: '这里是隐私政策的内容...',
      showCancel: false
    });
  },

  // 管理员入口
  onAdminEntry() {
    this.setData({
      showAdminDialog: true,
      adminPassword: ''
    });
  },

  // 管理员用户名输入
  onAdminUsernameChange(e: any) {
    this.setData({
      adminUsername: e.detail.value
    });
  },

  // 管理员密码输入
  onAdminPasswordChange(e: any) {
    this.setData({
      adminPassword: e.detail.value
    });
  },

  // 管理员登录
  onAdminLogin() {
    const { adminUsername, adminPassword } = this.data;
    
    if (!adminUsername || !adminPassword) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入完整的用户名和密码',
        theme: 'warning'
      });
      return;
    }
    
    // 设置加载状态
    this.setData({ adminLoading: true });
    
    // 调用云函数验证管理员用户名和密码
    wx.cloud.callFunction({
      name: 'adminLogin',
      data: {
        username: adminUsername.trim(),
        password: adminPassword.trim()
      },
      success: (res) => {
        console.log('管理员登录云函数返回:', res);
        
        if (!res.result) {
          console.error('管理员登录云函数返回结果为空');
          Toast({
            context: this,
            selector: '#t-toast',
            message: '登录失败，服务器无响应',
            theme: 'error'
          });
          return;
        }
        
        const { success, message, adminInfo } = res.result as { success: boolean, message: string, adminInfo: any };
        
        if (success && adminInfo) {
          // 查询users表中的管理员记录，获取完整的用户信息
          const db = wx.cloud.database();
          db.collection('users').where({
            _openid: adminInfo._openid
          }).get().then(userResult => {
            let completeUserInfo;
            if (userResult.data.length > 0) {
              // 使用users表中的完整信息
              completeUserInfo = {
                ...userResult.data[0],
                isAdmin: true,
                role: 'admin',
                loginType: 'admin',
                permissions: adminInfo.permissions
              };
            } else {
              // 如果users表中没有记录，使用adminInfo但补充必要字段
              completeUserInfo = {
                ...adminInfo,
                _id: adminInfo._openid || 'admin_' + Date.now(),
                phone: '',
                email: '',
                bio: '系统管理员',
                status: 'active'
              };
            }
            
            // 保存完整的用户信息到本地缓存
            wx.setStorageSync('userInfo', completeUserInfo);
            wx.setStorageSync('isAdmin', true);
            
            Toast({
              context: this,
              selector: '#t-toast',
              message: '管理员登录成功',
              theme: 'success'
            });
            
            // 关闭弹窗并跳转
            this.setData({ 
              showAdminDialog: false,
              adminUsername: '',
              adminPassword: ''
            });
            
            setTimeout(() => {
              wx.switchTab({
                url: '/pages/admin/admin',
                fail: (err) => {
                  console.error('跳转管理员页面失败:', err);
                  wx.navigateTo({
                    url: '/pages/admin/admin'
                  });
                }
              });
            }, 1000);
          }).catch(err => {
            console.error('查询用户信息失败:', err);
            // 如果查询失败，仍然使用adminInfo登录
            const fallbackUserInfo = {
              ...adminInfo,
              _id: adminInfo._openid || 'admin_' + Date.now(),
              phone: '',
              email: '',
              bio: '系统管理员',
              status: 'active'
            };
            wx.setStorageSync('userInfo', fallbackUserInfo);
            wx.setStorageSync('isAdmin', true);
            
            Toast({
              context: this,
              selector: '#t-toast',
              message: '管理员登录成功',
              theme: 'success'
            });
            
            this.setData({ 
              showAdminDialog: false,
              adminUsername: '',
              adminPassword: ''
            });
            
            setTimeout(() => {
              wx.switchTab({
                url: '/pages/admin/admin',
                fail: (err) => {
                  console.error('跳转管理员页面失败:', err);
                  wx.navigateTo({
                    url: '/pages/admin/admin'
                  });
                }
              });
            }, 1000);
          });
        } else {
          Toast({
            context: this,
            selector: '#t-toast',
            message: message || '用户名或密码错误',
            theme: 'error'
          });
        }
      },
      fail: (err) => {
        console.error('管理员登录云函数调用失败:', err);
        Toast({
          context: this,
          selector: '#t-toast',
          message: '网络错误，请检查网络连接后重试',
          theme: 'error'
        });
      },
      complete: () => {
        this.setData({ adminLoading: false });
      }
    });
  },

  // 关闭管理员弹窗
  onCloseAdminDialog() {
    this.setData({ 
      showAdminDialog: false,
      adminUsername: '',
      adminPassword: ''
    });
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 阻止点击弹窗内容区域时关闭弹窗
  },

  // 跳转到主页面
  redirectToMain() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo && userInfo.isAdmin) {
      // 管理员页面不在tabBar中，使用navigateTo
      wx.navigateTo({
        url: '/pages/admin/admin',
        fail: (err) => {
          console.error('跳转管理员页面失败:', err);
          // 如果跳转失败，回退到订单页面
          wx.switchTab({
            url: '/pages/orders/orders'
          });
        }
      });
    } else {
      wx.switchTab({
        url: '/pages/orders/orders',
        fail: (err) => {
          console.error('跳转订单页面失败:', err);
        }
      });
    }
  }
});