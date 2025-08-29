import Toast from '../../miniprogram_npm/tdesign-miniprogram/toast/index';

Page({
  data: {
    phone: '',
    code: '',
    wechatLoading: false,
    phoneLoading: false,
    codeDisabled: false,
    codeText: '获取验证码',
    countdown: 60,
    showAdminDialog: false,
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
            const { openid, userInfo } = result.result;
            
            // 检查用户是否已存在
            const db = wx.cloud.database();
            db.collection('users').where({
              _openid: openid
            }).get().then(res => {
              if (res.data.length > 0) {
                // 用户已存在，更新信息
                const dbUserInfo = res.data[0];
                const userId = dbUserInfo._id;
                
                // 合并用户信息
                const updatedUserInfo = {
                  ...dbUserInfo,
                  nickName: userInfo.nickName,
                  avatarUrl: userInfo.avatarUrl,
                  lastLoginTime: new Date()
                };
                
                // 更新数据库
                db.collection('users').doc(userId).update({
                  data: {
                    nickName: userInfo.nickName,
                    avatarUrl: userInfo.avatarUrl,
                    lastLoginTime: new Date()
                  }
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
                const newUser = {
                  nickName: userInfo.nickName,
                  avatarUrl: userInfo.avatarUrl,
                  loginType: 'wechat',
                  isAuthenticated: false,
                  createTime: new Date(),
                  lastLoginTime: new Date(),
                  phone: '',
                  email: '',
                  bio: '',
                  role: 'user',
                  status: 'active'
                };
                
                db.collection('users').add({
                  data: newUser
                }).then(res => {
                  // 添加ID并保存到本地
                  newUser._id = res._id;
                  newUser._openid = openid;
                  wx.setStorageSync('userInfo', newUser);
                  this.loginSuccess();
                }).catch(err => {
                  console.error('创建用户失败', err);
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

  // 手机号输入
  onPhoneChange(e: any) {
    this.setData({
      phone: e.detail.value
    });
  },

  // 验证码输入
  onCodeChange(e: any) {
    this.setData({
      code: e.detail.value
    });
  },

  // 发送验证码
  onSendCode() {
    const { phone } = this.data;
    
    if (!phone) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入手机号',
        theme: 'warning'
      });
      return;
    }
    
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入正确的手机号',
        theme: 'warning'
      });
      return;
    }
    
    // 调用云函数发送验证码
    wx.cloud.callFunction({
      name: 'sendSmsCode',
      data: {
        phone
      },
      success: (res) => {
        const { success, message } = res.result;
        
        if (success) {
          Toast({
            context: this,
            selector: '#t-toast',
            message: '验证码已发送',
            theme: 'success'
          });
          
          // 开始倒计时
          this.startCountdown();
        } else {
          Toast({
            context: this,
            selector: '#t-toast',
            message: message || '发送失败，请稍后重试',
            theme: 'error'
          });
        }
      },
      fail: (err) => {
        console.error('发送验证码失败', err);
        Toast({
          context: this,
          selector: '#t-toast',
          message: '发送失败，请稍后重试',
          theme: 'error'
        });
      }
    });
  },

  // 倒计时
  startCountdown() {
    this.setData({
      codeDisabled: true,
      countdown: 60
    });
    
    const timer = setInterval(() => {
      const { countdown } = this.data;
      if (countdown <= 1) {
        clearInterval(timer);
        this.setData({
          codeDisabled: false,
          codeText: '获取验证码'
        });
      } else {
        this.setData({
          countdown: countdown - 1,
          codeText: `${countdown - 1}s后重发`
        });
      }
    }, 1000);
  },

  // 手机号登录
  onPhoneLogin() {
    const { phone, code } = this.data;
    
    if (!phone || !code) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请填写完整信息',
        theme: 'warning'
      });
      return;
    }
    
    this.setData({ phoneLoading: true });
    
    // 调用云函数验证手机号和验证码
    wx.cloud.callFunction({
      name: 'verifyPhoneCode',
      data: {
        phone,
        code
      },
      success: (res) => {
        const { success, message, openid } = res.result;
        
        if (success) {
          // 验证成功，查询用户信息
          const db = wx.cloud.database();
          db.collection('users').where({
            _openid: openid
          }).get().then(userRes => {
            if (userRes.data.length > 0) {
              // 用户已存在，更新信息
              const dbUserInfo = userRes.data[0];
              const userId = dbUserInfo._id;
              
              // 更新手机号和登录时间
              db.collection('users').doc(userId).update({
                data: {
                  phone: phone,
                  lastLoginTime: new Date()
                }
              }).then(() => {
                // 更新本地存储
                const updatedUserInfo = {
                  ...dbUserInfo,
                  phone: phone,
                  lastLoginTime: new Date()
                };
                wx.setStorageSync('userInfo', updatedUserInfo);
                this.loginSuccess();
              }).catch(err => {
                console.error('更新用户信息失败', err);
                this.loginFail();
              });
            } else {
              // 新用户，创建记录
              const newUser = {
                nickName: phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
                avatarUrl: '',
                phone: phone,
                loginType: 'phone',
                isAuthenticated: false,
                createTime: new Date(),
                lastLoginTime: new Date(),
                email: '',
                bio: '',
                role: 'user',
                status: 'active'
              };
              
              db.collection('users').add({
                data: newUser
              }).then(res => {
                // 添加ID并保存到本地
                newUser._id = res._id;
                newUser._openid = openid;
                wx.setStorageSync('userInfo', newUser);
                this.loginSuccess();
              }).catch(err => {
                console.error('创建用户失败', err);
                this.loginFail();
              });
            }
          }).catch(err => {
            console.error('查询用户失败', err);
            this.loginFail();
          });
        } else {
          // 验证失败
          Toast({
            context: this,
            selector: '#t-toast',
            message: message || '验证码错误',
            theme: 'error'
          });
        }
      },
      fail: (err) => {
        console.error('云函数调用失败', err);
        this.loginFail();
      },
      complete: () => {
        this.setData({ phoneLoading: false });
      }
    });
  },

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

  // 管理员密码输入
  onAdminPasswordChange(e: any) {
    this.setData({
      adminPassword: e.detail.value
    });
  },

  // 管理员登录
  onAdminLogin() {
    const { adminPassword } = this.data;
    
    // 调用云函数验证管理员密码
    wx.cloud.callFunction({
      name: 'adminLogin',
      data: {
        password: adminPassword
      },
      success: (res) => {
        const { success, message, adminInfo } = res.result;
        
        if (success) {
          // 登录成功，保存管理员信息
          wx.setStorageSync('userInfo', adminInfo);
          
          Toast({
            context: this,
            selector: '#t-toast',
            message: '管理员登录成功',
            theme: 'success'
          });
          
          setTimeout(() => {
            wx.switchTab({
              url: '/pages/admin/admin'
            });
          }, 1500);
        } else {
          Toast({
            context: this,
            selector: '#t-toast',
            message: message || '密码错误',
            theme: 'error'
          });
        }
      },
      fail: (err) => {
        console.error('管理员登录失败', err);
        Toast({
          context: this,
          selector: '#t-toast',
          message: '登录失败，请稍后重试',
          theme: 'error'
        });
      },
      complete: () => {
        this.setData({ showAdminDialog: false });
      }
    });
  },

  // 关闭管理员弹窗
  onCloseAdminDialog() {
    this.setData({ showAdminDialog: false });
  },

  // 跳转到主页面
  redirectToMain() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo && userInfo.isAdmin) {
      wx.switchTab({
        url: '/pages/admin/admin'
      });
    } else {
      wx.switchTab({
        url: '/pages/orders/orders'
      });
    }
  }
});