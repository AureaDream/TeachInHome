import Toast from '../../miniprogram_npm/tdesign-miniprogram/toast/index';

interface Author {
  id: string;
  name: string;
  avatar: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  summary: string;
  category: string;
  author: Author;
  images: string[];
  likeCount: number;
  commentCount: number;
  viewCount: number;
  isLiked: boolean;
  createTime: string;
}

Page({
  data: {
    posts: [] as Post[],
    loading: false,
    refreshing: false,
    loadingMore: false,
    hasMore: true,
    page: 1,
    pageSize: 10,
    
    categoryOptions: [
      { label: '求助', value: 'help' },
      { label: '分享', value: 'share' },
      { label: '讨论', value: 'discuss' },
      { label: '资源', value: 'resource' }
    ]
  },

  onLoad() {
    this.loadMyPosts(true);
  },

  onShow() {
    // 同步登录状态到全局数据
    const userInfo = wx.getStorageSync('userInfo');
    const app = getApp<IAppOption>();
    
    if (userInfo && !app.globalData.userInfo) {
      app.globalData.userInfo = userInfo;
      app.globalData.isLoggedIn = true;
    } else if (!userInfo && app.globalData.userInfo) {
      app.globalData.userInfo = undefined;
      app.globalData.isLoggedIn = false;
    }
    
    // 检查登录状态
    if (!userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateTo({
          url: '/pages/login/login'
        });
      }, 1500);
      return;
    }
    
    // 页面显示时刷新数据
    this.setData({ page: 1 });
    this.loadMyPosts(true);
  },

  onPullDownRefresh() {
    this.refreshPosts();
  },

  onReachBottom() {
    this.loadMore();
  },

  // 刷新帖子
  refreshPosts() {
    this.setData({ 
      page: 1,
      refreshing: true 
    });
    this.loadMyPosts(true);
  },

  // 加载更多
  loadMore() {
    if (this.data.loadingMore || !this.data.hasMore) {
      return;
    }
    
    this.setData({
      page: this.data.page + 1,
      loadingMore: true
    });
    
    this.loadMyPosts(false);
  },

  // 加载我的帖子
  loadMyPosts(reset = false) {
    if (reset) {
      this.setData({ loading: true });
    }
    
    // 调用云函数获取我的帖子
    wx.cloud.callFunction({
      name: 'getMyPosts',
      data: {
        page: this.data.page,
        pageSize: this.data.pageSize
      },
      success: (res: any) => {
        if (res.result && typeof res.result === 'object' && (res.result as any).success) {
          const posts = (res.result as any).data || [];
          
          if (reset) {
            this.setData({
              posts: posts,
              loading: false,
              refreshing: false,
              hasMore: posts.length === this.data.pageSize
            });
          } else {
            this.setData({
              posts: [...this.data.posts, ...posts],
              loadingMore: false,
              hasMore: posts.length === this.data.pageSize
            });
          }
        } else {
          Toast({
            context: this,
            selector: '#t-toast',
            message: (res.result && res.result.message) || '加载失败',
            theme: 'error'
          });
        }
        
        wx.stopPullDownRefresh();
      },
      fail: (err) => {
        console.error('获取我的帖子失败:', err);
        Toast({
          context: this,
          selector: '#t-toast',
          message: '网络错误，请重试',
          theme: 'error'
        });
        
        this.setData({
          loading: false,
          refreshing: false,
          loadingMore: false
        });
        
        wx.stopPullDownRefresh();
      }
    });
  },

  // 跳转到帖子详情页
  onJumpToPost(e: any) {
    // 阻止事件冒泡
    if (e && e.stopPropagation && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    const post = e.currentTarget.dataset.post;
    wx.navigateTo({
      url: `/pages/post-detail/post-detail?id=${post.id}`
    });
  },

  // 帖子点击
  onPostTap(e: any) {
    const post = e.currentTarget.dataset.post;
    wx.navigateTo({
      url: `/pages/post-detail/post-detail?id=${post.id}`
    });
  },

  // 点赞帖子
  onLikePost(e: any) {
    // TDesign 组件的事件对象可能不包含 stopPropagation 方法
    if (e && e.stopPropagation && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    const post = e.currentTarget.dataset.post;
    
    wx.cloud.callFunction({
      name: 'likePost',
      data: {
        postId: post.id,
        isLike: !post.isLiked
      },
      success: (res: any) => {
        if (res.result && typeof res.result === 'object' && (res.result as any).success) {
          const posts = this.data.posts.map(p => {
            if (p.id === post.id) {
              return {
                ...p,
                isLiked: (res.result as any).data.isLiked,
                likeCount: (res.result as any).data.likeCount
              };
            }
            return p;
          });
          
          this.setData({ posts });
          
          Toast({
            context: this,
            selector: '#t-toast',
            message: res.result.data.isLiked ? '点赞成功' : '取消点赞',
            theme: 'success'
          });
        } else {
          Toast({
            context: this,
            selector: '#t-toast',
            message: (res.result && res.result.message) || '操作失败',
            theme: 'warning'
          });
        }
      },
      fail: (err) => {
        console.error('点赞失败:', err);
        Toast({
          context: this,
          selector: '#t-toast',
          message: '操作失败，请重试',
          theme: 'error'
        });
      }
    });
  },

  // 评论帖子
  onCommentPost(e: any) {
    // TDesign 组件的事件对象可能不包含 stopPropagation 方法
    if (e && e.stopPropagation && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    const post = e.currentTarget.dataset.post;
    wx.navigateTo({
      url: `/pages/post-detail/post-detail?id=${post.id}&focus=comment`
    });
  },

  // 分享帖子
  onSharePost(e: any) {
    // TDesign 组件的事件对象可能不包含 stopPropagation 方法
    if (e && e.stopPropagation && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    const post = e.currentTarget.dataset.post;
    
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
    
    Toast({
      context: this,
      selector: '#t-toast',
      message: '分享成功',
      theme: 'success'
    });
  },

  // 删除帖子
  onDeletePost(e: any) {
    // TDesign 组件的事件对象可能不包含 stopPropagation 方法
    if (e && e.stopPropagation && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    const post = e.currentTarget.dataset.post;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这篇帖子吗？删除后无法恢复。',
      success: (res) => {
        if (res.confirm) {
          this.deletePost(post.id);
        }
      }
    });
  },

  // 执行删除帖子
  deletePost(postId: string) {
    wx.showLoading({
      title: '删除中...'
    });
    
    wx.cloud.callFunction({
      name: 'deletePost',
      data: {
        postId: postId
      },
      success: (res: any) => {
        wx.hideLoading();
        
        if (res.result && typeof res.result === 'object' && (res.result as any).success) {
          // 从列表中移除已删除的帖子
          const posts = this.data.posts.filter(p => p.id !== postId);
          this.setData({ posts });
          
          Toast({
            context: this,
            selector: '#t-toast',
            message: '删除成功',
            theme: 'success'
          });
        } else {
          Toast({
            context: this,
            selector: '#t-toast',
            message: (res.result && res.result.message) || '删除失败',
            theme: 'error'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('删除帖子失败:', err);
        Toast({
          context: this,
          selector: '#t-toast',
          message: '网络错误，请重试',
          theme: 'error'
        });
      }
    });
  },

  // 图片预览
  onImageTap(e: any) {
    // TDesign 组件的事件对象可能不包含 stopPropagation 方法
    if (e && e.stopPropagation && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    const { images, current } = e.currentTarget.dataset;
    
    wx.previewImage({
      urls: images,
      current: current
    });
  },

  // 获取分类主题
  getCategoryTheme(category: string): string {
    const themes: Record<string, string> = {
      help: 'warning',
      share: 'success',
      discuss: 'primary',
      resource: 'danger'
    };
    return themes[category] || 'default';
  },

  // 获取分类名称
  getCategoryName(category: string): string {
    const names: Record<string, string> = {
      help: '求助',
      share: '分享',
      discuss: '讨论',
      resource: '资源'
    };
    return names[category] || '未知';
  },

  // 页面分享
  onShareAppMessage() {
    return {
      title: '我的帖子 - 家教论坛',
      path: '/pages/my-posts/my-posts'
    };
  }
});