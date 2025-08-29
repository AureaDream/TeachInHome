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
    
    // 分类选项
    categoryOptions: [
      { label: '求助', value: 'help' },
      { label: '分享', value: 'share' },
      { label: '讨论', value: 'discuss' },
      { label: '资源', value: 'resource' }
    ]
  },

  onLoad() {
    this.checkLoginStatus();
    this.loadPosts();
  },

  onShow() {
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
    
    // 模拟API请求
    setTimeout(() => {
      const mockPosts = this.generateMockPosts();
      const filteredPosts = this.filterPosts(mockPosts);
      
      if (reset) {
        this.setData({
          posts: filteredPosts,
          loading: false,
          refreshing: false,
          hasMore: filteredPosts.length >= this.data.pageSize
        });
      } else {
        this.setData({
          posts: [...this.data.posts, ...filteredPosts],
          loadingMore: false,
          hasMore: filteredPosts.length >= this.data.pageSize
        });
      }
      
      wx.stopPullDownRefresh();
    }, 1000);
  },

  // 筛选帖子
  filterPosts(posts: Post[]): Post[] {
    let filtered = posts;
    
    // 按分类筛选
    if (this.data.activeCategory !== 'all') {
      filtered = filtered.filter(post => post.category === this.data.activeCategory);
    }
    
    // 按搜索词筛选
    if (this.data.searchValue) {
      const keyword = this.data.searchValue.toLowerCase();
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(keyword) ||
        post.content.toLowerCase().includes(keyword)
      );
    }
    
    return filtered;
  },

  // 生成模拟数据
  generateMockPosts(): Post[] {
    const categories = ['help', 'share', 'discuss', 'resource'];
    const titles = [
      '求助：高中数学函数题解题思路',
      '分享：我的英语学习方法',
      '讨论：如何提高学生的学习兴趣',
      '资源：初中物理实验视频合集',
      '求助：小学语文作文指导技巧',
      '分享：在线教学工具推荐',
      '讨论：家教过程中遇到的问题',
      '资源：高考数学真题解析'
    ];
    
    const posts: Post[] = [];
    const startIndex = (this.data.page - 1) * this.data.pageSize;
    
    for (let i = 0; i < this.data.pageSize; i++) {
      const index = startIndex + i;
      if (index >= 50) break; // 模拟总共50条数据
      
      const category = categories[index % categories.length];
      const title = titles[index % titles.length];
      
      posts.push({
        id: `post_${index + 1}`,
        title: title,
        content: `这是帖子${index + 1}的详细内容，包含了相关的讨论和分享...`,
        summary: `这是帖子${index + 1}的摘要内容...`,
        category: category,
        author: {
          id: `user_${(index % 10) + 1}`,
          name: `用户${(index % 10) + 1}`,
          avatar: '/images/avatar-default.png'
        },
        images: index % 3 === 0 ? ['/images/post-1.jpg', '/images/post-2.jpg'] : [],
        likeCount: Math.floor(Math.random() * 100),
        commentCount: Math.floor(Math.random() * 50),
        viewCount: Math.floor(Math.random() * 500) + 100,
        isLiked: Math.random() > 0.7,
        createTime: this.formatTime(new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000))
      });
    }
    
    return posts;
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
    e.stopPropagation();
    const post = e.currentTarget.dataset.post;
    const posts = this.data.posts.map(p => {
      if (p.id === post.id) {
        return {
          ...p,
          isLiked: !p.isLiked,
          likeCount: p.isLiked ? p.likeCount - 1 : p.likeCount + 1
        };
      }
      return p;
    });
    
    this.setData({ posts });
    
    Toast({
      context: this,
      selector: '#t-toast',
      message: post.isLiked ? '取消点赞' : '点赞成功',
      theme: 'success'
    });
  },

  // 评论帖子
  onCommentPost(e: any) {
    e.stopPropagation();
    const post = e.currentTarget.dataset.post;
    // 这里可以跳转到帖子详情页的评论区
    wx.navigateTo({
      url: `/pages/post-detail/post-detail?id=${post.id}&focus=comment`
    });
  },

  // 分享帖子
  onSharePost(e: any) {
    e.stopPropagation();
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

  // 图片点击
  onImageTap(e: any) {
    e.stopPropagation();
    const { images, current } = e.currentTarget.dataset;
    
    wx.previewImage({
      urls: images,
      current: current
    });
  },

  // 发帖相关
  onCreatePost() {
    this.setData({
      showCreateDialog: true,
      newPost: {
        category: 'help',
        title: '',
        content: '',
        images: []
      }
    });
  },

  onCancelCreate() {
    this.setData({ showCreateDialog: false });
  },

  onConfirmCreate() {
    if (!this.validateNewPost()) {
      return;
    }
    
    // 模拟发布帖子
    const newPost: Post = {
      id: `post_new_${Date.now()}`,
      title: this.data.newPost.title,
      content: this.data.newPost.content,
      summary: this.data.newPost.content.substring(0, 50) + '...',
      category: this.data.newPost.category,
      author: {
        id: 'current_user',
        name: '我',
        avatar: '/images/avatar-default.png'
      },
      images: this.data.newPost.images,
      likeCount: 0,
      commentCount: 0,
      viewCount: 1,
      isLiked: false,
      createTime: '刚刚'
    };
    
    this.setData({
      posts: [newPost, ...this.data.posts],
      showCreateDialog: false
    });
    
    Toast({
      context: this,
      selector: '#t-toast',
      message: '发布成功',
      theme: 'success'
    });
  },

  onNewPostCategoryChange(e: any) {
    this.setData({
      'newPost.category': e.detail.value
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