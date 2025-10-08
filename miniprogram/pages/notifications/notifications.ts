// pages/notifications/notifications.ts

interface Notification {
  _id: string;
  id: string;
  title: string;
  content: string;
  time: string;
  createTime: Date;
  read: boolean;
  userId: string;
}

interface UserInfo {
  _id: string;
  nickName: string;
  avatarUrl: string;
}

Page({
  data: {
    notifications: [] as Notification[],
    loading: false,
    refreshing: false,
    hasMore: true,
    page: 1,
    pageSize: 20,
    showDeleteConfirm: false,
    deletingNotification: null as Notification | null
  },

  onLoad() {
    this.checkLoginStatus();
    this.loadNotifications();
  },

  onShow() {
    // 页面显示时刷新数据
    this.refreshNotifications();
  },

  onPullDownRefresh() {
    this.refreshNotifications();
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreNotifications();
    }
  },

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/login/login'
        });
      }, 1500);
      return false;
    }
    return true;
  },

  // 刷新通知列表
  refreshNotifications() {
    this.setData({
      refreshing: true,
      page: 1,
      hasMore: true,
      notifications: []
    });
    this.loadNotifications();
  },

  // 加载更多通知
  loadMoreNotifications() {
    if (!this.data.hasMore || this.data.loading) return;
    
    this.setData({
      page: this.data.page + 1
    });
    this.loadNotifications(false);
  },

  // 加载消息通知
  loadNotifications(showLoading = true) {
    const userInfo = wx.getStorageSync('userInfo') as UserInfo;
    if (!userInfo || !userInfo._id) {
      console.log('用户信息不存在，无法加载通知');
      return;
    }

    if (showLoading) {
      this.setData({ loading: true });
    }

    const db = wx.cloud.database();
    const { page, pageSize, notifications } = this.data;
    
    db.collection('notifications')
      .where({
        userId: userInfo._id
      })
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()
      .then((res: any) => {
        console.log('获取通知数据成功:', res.data);
        
        const newNotifications = res.data.map((item: any) => ({
          _id: item._id,
          id: item._id,
          title: item.title,
          content: item.content,
          time: this.formatTime(item.createTime),
          createTime: item.createTime,
          read: item.read,
          userId: item.userId
        }));

        // 合并数据
        const allNotifications = page === 1 ? newNotifications : [...notifications, ...newNotifications];
        
        this.setData({
          notifications: allNotifications,
          hasMore: res.data.length === pageSize,
          loading: false,
          refreshing: false
        });

        // 停止下拉刷新
        if (this.data.refreshing) {
          wx.stopPullDownRefresh();
        }

        // 标记所有通知为已读
        this.markAllAsRead();
      })
      .catch(err => {
        console.error('获取消息通知失败', err);
        
        this.setData({
          loading: false,
          refreshing: false
        });

        // 停止下拉刷新
        wx.stopPullDownRefresh();

        wx.showToast({
          title: '加载失败，请稍后重试',
          icon: 'error'
        });
      });
  },

  // 标记所有通知为已读
  markAllAsRead() {
    const userInfo = wx.getStorageSync('userInfo') as UserInfo;
    if (!userInfo || !userInfo._id) {
      console.error('用户信息不存在');
      return;
    }

    const db = wx.cloud.database();
    const _ = db.command;

    // 批量更新所有未读通知
    db.collection('notifications')
      .where({
        userId: userInfo._id,
        read: _.eq(false)
      })
      .get()
      .then((res: any) => {
        if (res.data.length === 0) {
          console.log('没有未读通知需要更新');
          return;
        }

        // 批量更新每个未读通知
        const updatePromises = res.data.map((notification: any) => {
          return db.collection('notifications')
            .doc(notification._id)
            .update({
              data: {
                read: true,
                readTime: new Date()
              }
            });
        });

        return Promise.all(updatePromises);
      })
      .then(() => {
        console.log('标记通知为已读成功');
        // 更新本地数据
        const notifications = this.data.notifications.map(n => ({ ...n, read: true }));
        this.setData({ notifications });
      })
      .catch((err: any) => {
        console.error('标记通知为已读失败', err);
        wx.showToast({
          title: '操作失败，请稍后重试',
          icon: 'error'
        });
      });
  },

  // 格式化时间
  formatTime(date: Date | string): string {
    const now = new Date();
    const time = new Date(date);
    const diff = now.getTime() - time.getTime();
    
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    
    if (diff < minute) {
      return '刚刚';
    } else if (diff < hour) {
      return `${Math.floor(diff / minute)}分钟前`;
    } else if (diff < day) {
      return `${Math.floor(diff / hour)}小时前`;
    } else if (diff < 7 * day) {
      return `${Math.floor(diff / day)}天前`;
    } else {
      return `${time.getFullYear()}-${String(time.getMonth() + 1).padStart(2, '0')}-${String(time.getDate()).padStart(2, '0')}`;
    }
  },

  // 删除通知
  onDeleteNotification(e: any) {
    const index = e.currentTarget.dataset.index;
    const notification = this.data.notifications[index];
    
    this.setData({
      showDeleteConfirm: true,
      deletingNotification: notification
    });
  },

  // 确认删除
  onConfirmDelete() {
    const { deletingNotification } = this.data;
    
    if (!deletingNotification) return;

    wx.showLoading({
      title: '删除中...'
    });

    // 调用云函数删除通知
    wx.cloud.callFunction({
      name: 'deleteNotification',
      data: {
        notificationId: deletingNotification._id
      }
    }).then((res: any) => {
      wx.hideLoading();
      
      if (res.result && res.result.success) {
        // 从本地数据中移除
        const notifications = this.data.notifications.filter(n => n._id !== deletingNotification._id);
        
        this.setData({
          notifications,
          showDeleteConfirm: false,
          deletingNotification: null
        });

        wx.showToast({
          title: '删除成功',
          icon: 'success'
        });
      } else {
        wx.showToast({
          title: res.result?.message || '删除失败',
          icon: 'error'
        });
      }
    }).catch((err: any) => {
      console.error('删除通知失败', err);
      wx.hideLoading();
      
      wx.showToast({
        title: '删除失败，请稍后重试',
        icon: 'error'
      });
    });
  },

  // 取消删除
  onCancelDelete() {
    this.setData({
      showDeleteConfirm: false,
      deletingNotification: null
    });
  },

  // 返回上一页
  onBack() {
    wx.navigateBack();
  }
});