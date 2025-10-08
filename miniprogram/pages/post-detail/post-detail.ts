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
  category: string;
  author: Author;
  images: string[];
  likeCount: number;
  commentCount: number;
  viewCount: number;
  isLiked: boolean;
  createTime: string;
}

interface Comment {
  id: string;
  content: string;
  author: Author;
  replyToId?: string;
  likeCount: number;
  isLiked: boolean;
  createTime: string;
}

Page({
  data: {
    postId: '',
    post: null as Post | null,
    comments: [] as Comment[],
    loading: true,
    loadingComments: false,
    hasMoreComments: true,
    commentsPage: 1,
    commentsPageSize: 20,
    
    // 评论相关
    showCommentInput: false,
    commentInput: '',
    replyToComment: null as Comment | null,
    sendingComment: false,
    
    // 分类选项
    categoryOptions: [
      { label: '求助', value: 'help' },
      { label: '分享', value: 'share' },
      { label: '讨论', value: 'discuss' },
      { label: '资源', value: 'resource' }
    ]
  },

  onLoad(options: any) {
    const { id, focus } = options;
    if (id) {
      this.setData({ postId: id });
    this.loadPostDetail();
    this.setData({ commentsPage: 1 });
    this.loadComments();
      
      // 如果需要聚焦到评论区
      if (focus === 'comment') {
        setTimeout(() => {
          this.setData({ showCommentInput: true });
        }, 500);
      }
    }
  },

  // 加载帖子详情
  loadPostDetail() {
    wx.cloud.callFunction({
      name: 'getPostDetail',
      data: {
        postId: this.data.postId
      },
      success: (res: any) => {
        if (res.result && typeof res.result === 'object' && (res.result as any).success) {
          const post = (res.result as any).data;
          
          this.setData({
            post: post,
            loading: false
          });
        } else {
          Toast({
            context: this,
            selector: '#t-toast',
            message: (res.result && res.result.message) || '加载帖子详情失败',
            theme: 'error'
          });
          
          this.setData({ loading: false });
        }
      },
      fail: (err) => {
        console.error('获取帖子详情失败:', err);
        Toast({
          context: this,
          selector: '#t-toast',
          message: '网络错误，请重试',
          theme: 'error'
        });
        
        this.setData({ loading: false });
      }
    });
  },

  // 加载评论
  loadComments() {
    if (this.data.loadingComments) return;
    
    this.setData({ loadingComments: true });
    
    wx.cloud.callFunction({
      name: 'getComments',
      data: {
        postId: this.data.postId,
        page: this.data.commentsPage,
        pageSize: 10
      },
      success: (res: any) => {
        if (res.result && typeof res.result === 'object' && (res.result as any).success) {
          const newComments = (res.result as any).data.comments || [];
          const hasMore = (res.result as any).data.hasMore || false;
          
          this.setData({
            comments: this.data.commentsPage === 1 ? newComments : [...this.data.comments, ...newComments],
            hasMoreComments: hasMore,
            commentsPage: this.data.commentsPage + 1,
            loadingComments: false
          });
        } else {
          Toast({
            context: this,
            selector: '#t-toast',
            message: (res.result && res.result.message) || '加载评论失败',
            theme: 'error'
          });
          
          this.setData({ loadingComments: false });
        }
      },
      fail: (err) => {
        console.error('获取评论失败:', err);
        Toast({
          context: this,
          selector: '#t-toast',
          message: '网络错误，请重试',
          theme: 'error'
        });
        
        this.setData({ loadingComments: false });
      }
    });
  },

  // 加载更多评论
  onLoadMoreComments() {
    if (this.data.loadingComments || !this.data.hasMoreComments) {
      return;
    }
    
    this.setData({
      commentsPage: this.data.commentsPage + 1
    });
    
    this.loadComments();
  },

  // 点赞帖子
  onLikePost() {
    if (!this.data.post) return;
    
    wx.cloud.callFunction({
      name: 'likePost',
      data: {
        postId: this.data.post.id,
        isLike: !this.data.post.isLiked
      },
      success: (res: any) => {
        if (res.result && typeof res.result === 'object' && (res.result as any).success) {
          const updatedPost = {
            ...this.data.post!,
            isLiked: (res.result as any).data.isLiked,
            likeCount: (res.result as any).data.likeCount
          };
          
          this.setData({ post: updatedPost });
          
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

  // 点赞评论
  onLikeComment(e: any) {
    const comment = e.currentTarget.dataset.comment;
    if (!comment) return;
    
    wx.cloud.callFunction({
      name: 'likeComment',
      data: {
        commentId: comment.id,
        isLike: !comment.isLiked
      },
      success: (res: any) => {
        if (res.result && typeof res.result === 'object' && (res.result as any).success) {
          // 更新评论列表中的点赞状态
          const updatedComments = this.data.comments.map(c => {
            if (c.id === comment.id) {
              return {
                ...c,
                isLiked: (res.result as any).data.isLiked,
                likeCount: (res.result as any).data.likeCount
              };
            }
            return c;
          });
          
          this.setData({ comments: updatedComments });
          
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
        console.error('点赞评论失败:', err);
        Toast({
          context: this,
          selector: '#t-toast',
          message: '操作失败，请重试',
          theme: 'error'
        });
      }
    });
  },

  // 显示评论输入框
  onShowCommentInput() {
    // 检查登录状态
    const userInfo = wx.getStorageSync('userInfo');
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
    
    this.setData({
      showCommentInput: true,
      replyToComment: null
    });
  },

  // 回复评论
  onReplyComment(e: any) {
    // 检查登录状态
    const userInfo = wx.getStorageSync('userInfo');
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
    
    const comment = e.currentTarget.dataset.comment;
    this.setData({
      showCommentInput: true,
      replyToComment: comment
    });
  },

  // 评论输入变化
  onCommentInputChange(e: any) {
    this.setData({
      commentInput: e.detail.value
    });
  },

  // 取消评论
  onCancelComment() {
    this.setData({
      showCommentInput: false,
      commentInput: '',
      replyToComment: null
    });
  },

  // 发送评论
  onSendComment() {
    const content = this.data.commentInput.trim();
    if (!content) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入评论内容',
        theme: 'warning'
      });
      return;
    }
    
    this.setData({ sendingComment: true });
    
    wx.cloud.callFunction({
      name: 'createComment',
      data: {
        postId: this.data.postId,
        content: content,
        replyToId: this.data.replyToComment?.id || null
      },
      success: (res: any) => {
        if (res.result && typeof res.result === 'object' && (res.result as any).success) {
          // 清空输入框
          this.setData({
            commentInput: '',
            showCommentInput: false,
            replyToComment: null,
            sendingComment: false
          });
          
          // 重新加载评论列表
          this.setData({ 
            comments: [],
            commentsPage: 1
          });
          this.loadComments();
          
          // 更新帖子评论数
          if (this.data.post) {
            this.setData({
              post: {
                ...this.data.post,
                commentCount: this.data.post.commentCount + 1
              }
            });
          }
          
          Toast({
            context: this,
            selector: '#t-toast',
            message: '评论发表成功',
            theme: 'success'
          });
        } else {
          Toast({
            context: this,
            selector: '#t-toast',
            message: (res.result && res.result.message) || '评论发表失败',
            theme: 'error'
          });
          
          this.setData({ sendingComment: false });
        }
      },
      fail: (err) => {
        console.error('发表评论失败:', err);
        Toast({
          context: this,
          selector: '#t-toast',
          message: '网络错误，请重试',
          theme: 'error'
        });
        
        this.setData({ sendingComment: false });
      }
    });
  },

  // 图片预览
  onImageTap(e: any) {
    const { images, current } = e.currentTarget.dataset;
    
    wx.previewImage({
      urls: images,
      current: current
    });
  },

  // 分享帖子
  onSharePost() {
    if (!this.data.post) return;
    
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
    
    // 可以在这里添加分享统计
    wx.cloud.callFunction({
      name: 'sharePost',
      data: {
        postId: this.data.post.id
      },
      success: (res: any) => {
        console.log('分享统计成功:', res);
      },
      fail: (err) => {
        console.error('分享统计失败:', err);
      }
    });
    
    Toast({
      context: this,
      selector: '#t-toast',
      message: '分享成功',
      theme: 'success'
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
    const post = this.data.post;
    return {
      title: post ? post.title : '家教论坛帖子',
      path: `/pages/post-detail/post-detail?id=${this.data.postId}`
    };
  }
});