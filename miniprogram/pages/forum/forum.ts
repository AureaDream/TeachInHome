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

interface NewPost {
  category: string;
  title: string;
  content: string;
  images: string[];
}

Page({
  data: {
    searchValue: '',
    activeCategory: 'all',
    posts: [] as Post[],
    loading: false,
    refreshing: false,
    loadingMore: false,
    hasMore: true,
    page: 1,
    pageSize: 10,
    
    // 发帖相关
    showCreateDialog: false,
    newPost: {
      category: 'help',
      title: '',
      content: '',
      images: []
    } as NewPost,
    
    // picker 选中的索引
    selectedCategoryIndex: [0],
    
    // 分类选项
    categoryOptions: [
      { label: '求助', value: 'help' },
      { label: '分享', value: 'share' },
      { label: '讨论', value: 'discuss' },
      { label: '资源', value: 'resource' }
    ]
  },

  // 解析头像URL：支持云存储 fileID、http(s) 链接、或本地默认头像
  async resolveAvatarUrl(raw?: string): Promise<string> {
    console.log('resolveAvatarUrl 输入:', raw);
    
    const fallback = '/images/avatar-default.svg';
    if (!raw || typeof raw !== 'string' || raw.trim() === '') {
      console.log('头像为空，使用默认头像');
      return fallback;
    }
    const val = raw.trim();
    // 已是 http(s) 或本地路径
    if (/^https?:\/\//.test(val) || val.startsWith('/')) {
      console.log('头像是HTTP链接或本地路径，直接返回:', val);
      return val;
    }
    // 云存储 fileID -> 临时可访问链接
    if (val.startsWith('cloud://')) {
      try {
        console.log('尝试获取云存储临时链接:', val);
        const result = await wx.cloud.getTempFileURL({ fileList: [val] });
        const info = result && result.fileList && result.fileList[0];
        if (info && info.status === 0 && info.tempFileURL) {
          console.log('云存储临时链接获取成功:', info.tempFileURL);
          return info.tempFileURL;
        }
      } catch (e) {
        console.error('获取头像临时URL失败:', e);
      }
      console.log('云存储临时链接获取失败，使用默认头像');
      return fallback;
    }
    // 其他不识别的格式，使用默认头像
    console.log('头像格式不识别，使用默认头像');
    return fallback;
  },

  // 解析图片URL：支持云存储 fileID、http(s) 链接，并检测损坏图片
  async resolveImageUrl(raw?: string): Promise<string> {
    const fallback = '/images/image-placeholder.svg';
    if (!raw || typeof raw !== 'string' || raw.trim() === '') return fallback;
    const val = raw.trim();
    // 已是 http(s) 或本地路径
    if (/^https?:\/\//.test(val) || val.startsWith('/')) return val;
    // 云存储 fileID -> 临时可访问链接
    if (val.startsWith('cloud://')) {
      try {
        const result = await wx.cloud.getTempFileURL({ fileList: [val] });
        const info = result && result.fileList && result.fileList[0];
        if (info && info.status === 0 && info.tempFileURL) return info.tempFileURL;
      } catch (e) {
        console.error('获取图片临时URL失败:', e);
      }
      return fallback;
    }
    // 其他不识别的格式，使用占位图
    return fallback;
  },

  async preparePostsAvatars(posts: any[]): Promise<any[]> {
    try {
      console.log('=== 开始处理帖子头像 ===');
      console.log('原始帖子数据:', posts.map(p => ({
        id: p.id,
        title: p.title,
        authorName: p.author?.name,
        originalAvatar: p.author?.avatar
      })));
      
      const processedPosts = await Promise.all(posts.map(async (post) => {
        const processedPost = { ...post };
        
        // 处理作者头像
        if (processedPost.author && processedPost.author.avatar) {
          const originalAvatar = processedPost.author.avatar;
          console.log(`处理帖子 ${post.id} 的头像:`, originalAvatar);
          
          processedPost.author.avatar = await this.resolveAvatarUrl(processedPost.author.avatar);
          
          console.log(`头像处理结果:`, {
            原始: originalAvatar,
            处理后: processedPost.author.avatar
          });
        } else {
          console.log(`帖子 ${post.id} 没有头像数据`);
        }
        
        // 处理帖子图片
        if (processedPost.images && processedPost.images.length > 0) {
          processedPost.images = await Promise.all(
            processedPost.images.map((img: string) => this.resolveImageUrl(img))
          );
        }
        
        return processedPost;
      }));
      
      console.log('=== 头像处理完成 ===');
      console.log('处理后的帖子数据:', processedPosts.map(p => ({
        id: p.id,
        title: p.title,
        authorName: p.author?.name,
        processedAvatar: p.author?.avatar
      })));
      
      return processedPosts;
    } catch (error) {
      console.error('处理头像失败:', error);
      return posts; // 返回原始数据作为后备
    }
  },

  onLoad() {
    this.checkLoginStatus();
    this.loadPosts();
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
    
    // 刷新帖子列表
    this.refreshPosts();
  },

  onPullDownRefresh() {
    this.refreshPosts();
  },

  onReachBottom() {
    this.loadMore();
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
  onSearch(e: any) {
    this.setData({
      searchValue: e.detail.value,
      page: 1
    });
    this.loadPosts(true);
  },

  onSearchClear() {
    this.setData({
      searchValue: '',
      page: 1
    });
    this.loadPosts(true);
  },

  // 分类切换
  onCategoryChange(e: any) {
    this.setData({
      activeCategory: e.detail.value,
      page: 1
    });
    this.loadPosts(true);
  },

  // 刷新帖子
  onRefresh() {
    this.setData({ refreshing: true });
    this.refreshPosts();
  },

  refreshPosts() {
    this.setData({ page: 1 });
    this.loadPosts(true);
  },

  // 加载更多
  onLoadMore() {
    this.loadMore();
  },

  loadMore() {
    if (this.data.loadingMore || !this.data.hasMore) {
      return;
    }
    
    this.setData({
      page: this.data.page + 1,
      loadingMore: true
    });
    
    this.loadPosts(false);
  },

  // 加载帖子列表
  loadPosts(reset = false) {
    if (reset) {
      this.setData({ loading: true });
    }
    
    // 调用云函数获取帖子列表
    wx.cloud.callFunction({
      name: 'getPosts',
      data: {
        page: this.data.page,
        pageSize: this.data.pageSize,
        category: this.data.activeCategory,
        searchValue: this.data.searchValue
      },
      success: (res: any) => {
        if (res.result && typeof res.result === 'object' && (res.result as any).success) {
          const { posts, hasMore } = (res.result as any).data;
          
          // 处理头像URL
          this.preparePostsAvatars(posts).then((processedPosts) => {
            if (reset) {
              this.setData({
                posts: processedPosts,
                loading: false,
                refreshing: false,
                hasMore: hasMore
              });
            } else {
              this.setData({
                posts: [...this.data.posts, ...processedPosts],
                loadingMore: false,
                hasMore: hasMore
              });
            }
          }).catch(() => {
            // 如果头像处理失败，使用原始数据
            if (reset) {
              this.setData({
                posts: posts,
                loading: false,
                refreshing: false,
                hasMore: hasMore
              });
            } else {
              this.setData({
                posts: [...this.data.posts, ...posts],
                loadingMore: false,
                hasMore: hasMore
              });
            }
          });
        } else {
          Toast({
            context: this,
            selector: '#t-toast',
            message: res.result.message || '加载失败',
            theme: 'error'
          });
        }
        
        wx.stopPullDownRefresh();
      },
      fail: (err) => {
        console.error('获取帖子列表失败:', err);
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



  // 帖子点击
  onPostTap(e: any) {
    const post = e.currentTarget.dataset.post;
    // 这里可以跳转到帖子详情页
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
    // 这里可以跳转到帖子详情页的评论区
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

  // 图片点击
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

  // 头像加载错误处理
  onAvatarError(e: any) {
    const postId = e.currentTarget.dataset.postId;
    console.log('头像加载失败，帖子ID:', postId);
    
    // 更新对应帖子的头像为默认头像
    const posts = this.data.posts;
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          author: {
            ...post.author,
            avatar: '/images/avatar-default.svg'
          }
        };
      }
      return post;
    });
    
    this.setData({ posts: updatedPosts });
  },

  // 图片加载错误处理
  onImageError(e: any) {
    const { index, postId } = e.currentTarget.dataset;
    console.warn('图片加载失败:', e.detail);
    
    // 更新对应帖子的图片为占位符
    const posts = this.data.posts.map(post => {
      if (post.id === postId && post.images && post.images[index]) {
        const newImages = [...post.images];
        newImages[index] = '/images/image-placeholder.svg';
        return { ...post, images: newImages };
      }
      return post;
    });
    
    this.setData({ posts });
  },

  // 发帖相关
  onCreatePost() {
    // 检查登录状态 - 优先检查本地存储，然后检查全局数据
    const userInfo = wx.getStorageSync('userInfo');
    const app = getApp<IAppOption>();
    
    if (!userInfo && !app.globalData.userInfo) {
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
    
    // 如果本地存储有用户信息但全局数据没有，更新全局数据
    if (userInfo && !app.globalData.userInfo) {
      app.globalData.userInfo = userInfo;
      app.globalData.isLoggedIn = true;
    }
    
    console.log('Opening create dialog...');
    console.log('Current data:', this.data.newPost);
    console.log('Category options:', this.data.categoryOptions);
    
    this.setData({
      showCreateDialog: true,
      newPost: {
        category: '', // 设置为空字符串，让用户主动选择分类
        title: '',
        content: '',
        images: []
      },
      selectedCategoryIndex: [-1] // 设置为-1表示未选择任何分类
    }, () => {
      console.log('Dialog opened, showCreateDialog:', this.data.showCreateDialog);
      console.log('New post data:', this.data.newPost);
      console.log('Selected category index:', this.data.selectedCategoryIndex);
    });
  },

  onMaskTap(e: any) {
    // 只有当点击的是遮罩层本身时才关闭弹窗
    if (e.target === e.currentTarget) {
      this.onCancelCreate();
    }
  },

  onCancelCreate() {
    this.setData({ 
      showCreateDialog: false,
      selectedCategoryIndex: [0],
      newPost: {
        category: 'help',
        title: '',
        content: '',
        images: []
      }
    });
  },

  onConfirmCreate() {
    if (!this.validateNewPost()) {
      return;
    }
    
    // 显示加载提示
    wx.showLoading({
      title: '发布中...'
    });
    
    // 调用云函数发布帖子
    wx.cloud.callFunction({
      name: 'createPost',
      data: {
        title: this.data.newPost.title,
        content: this.data.newPost.content,
        category: this.data.newPost.category,
        images: this.data.newPost.images
      },
      success: (res: any) => {
        wx.hideLoading();
        
        if (res.result && typeof res.result === 'object' && (res.result as any).success) {
          this.setData({
            showCreateDialog: false,
            newPost: {
              category: 'help',
              title: '',
              content: '',
              images: []
            }
          });
          
          // 刷新帖子列表
          this.setData({ page: 1 });
          this.loadPosts(true);
          
          Toast({
            context: this,
            selector: '#t-toast',
            message: '发布成功',
            theme: 'success'
          });
        } else {
          Toast({
            context: this,
            selector: '#t-toast',
            message: (res.result && res.result.message) || '发布失败',
            theme: 'error'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('发布帖子失败:', err);
        Toast({
          context: this,
          selector: '#t-toast',
          message: '网络错误，请重试',
          theme: 'error'
        });
      }
    });
  },

  onNewPostCategoryChange(e: any) {
    const selectedIndex = e.detail.value[0]; // picker 返回的是索引数组
    const selectedCategory = this.data.categoryOptions[selectedIndex]?.value || 'help';
    this.setData({
      selectedCategoryIndex: e.detail.value,
      'newPost.category': selectedCategory
    });
  },

  onTitleChange(e: any) {
    this.setData({
      'newPost.title': e.detail.value
    });
  },

  onContentChange(e: any) {
    this.setData({
      'newPost.content': e.detail.value
    });
  },

  // 原生组件事件处理函数
  onNativeCategoryChange(e: any) {
    const selectedIndex = e.detail.value;
    const selectedCategory = this.data.categoryOptions[selectedIndex]?.value || 'help';
    console.log('Native category change:', selectedIndex, selectedCategory);
    
    // 确保数据同步更新，触发界面重新渲染
    this.setData({
      selectedCategoryIndex: [selectedIndex],
      'newPost.category': selectedCategory
    }, () => {
      // 验证数据更新是否成功
      console.log('Category updated - Index:', this.data.selectedCategoryIndex);
      console.log('Category updated - Value:', this.data.newPost.category);
      console.log('Category display name:', this.getCategoryName(this.data.newPost.category));
    });
  },

  onNativeTitleChange(e: any) {
    console.log('Native title change:', e.detail.value);
    this.setData({
      'newPost.title': e.detail.value
    });
  },

  onNativeContentChange(e: any) {
    console.log('Native content change:', e.detail.value);
    this.setData({
      'newPost.content': e.detail.value
    });
  },

  // 上传图片
  onUploadImage() {
    wx.chooseImage({
      count: 3 - this.data.newPost.images.length,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const images = [...this.data.newPost.images, ...res.tempFilePaths];
        this.setData({
          'newPost.images': images
        });
      }
    });
  },

  // 删除图片
  onDeleteImage(e: any) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.newPost.images.filter((_, i) => i !== index);
    this.setData({
      'newPost.images': images
    });
  },

  // 验证新帖子
  validateNewPost(): boolean {
    const { newPost } = this.data;
    
    if (!newPost.category || newPost.category.trim() === '') {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请选择帖子分类',
        theme: 'warning'
      });
      return false;
    }
    
    if (!newPost.title.trim()) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入帖子标题',
        theme: 'warning'
      });
      return false;
    }
    
    if (!newPost.content.trim()) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入帖子内容',
        theme: 'warning'
      });
      return false;
    }
    
    return true;
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

  // 时间格式化
  formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) {
      return '刚刚';
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}分钟前`;
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}小时前`;
    } else if (diff < 604800000) {
      return `${Math.floor(diff / 86400000)}天前`;
    } else {
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    }
  },

  // 页面分享
  onShareAppMessage() {
    return {
      title: '家教论坛 - 分享交流教学经验',
      path: '/pages/forum/forum'
    };
  }
});