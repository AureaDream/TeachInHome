// 我的评论页面
interface Comment {
  id: string;
  content: string;
  postId: string;
  postTitle: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  createTime: string;
  likeCount: number;
  isLiked: boolean;
}

Page({
  data: {
    comments: [] as Comment[],
    loading: true,
    loadingMore: false,
    hasMore: true,
    page: 1,
    pageSize: 10
  },

  onLoad() {
    this.loadMyComments();
  },

  onPullDownRefresh() {
    this.onRefresh();
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.loadMore();
    }
  },

  // 刷新评论列表
  onRefresh() {
    this.setData({
      page: 1,
      hasMore: true,
      comments: []
    });
    this.loadMyComments();
  },

  // 加载更多评论
  loadMore() {
    if (!this.data.hasMore || this.data.loadingMore) return;
    
    this.setData({
      loadingMore: true,
      page: this.data.page + 1
    });
    
    this.loadMyComments(false);
  },

  // 加载我的评论
  async loadMyComments(showLoading = true) {
    if (showLoading) {
      this.setData({ loading: true });
    }

    try {
      const result = await wx.cloud.callFunction({
        name: 'getMyComments',
        data: {
          page: this.data.page,
          pageSize: this.data.pageSize
        }
      });

      if (result.result && typeof result.result === 'object' && (result.result as any).success) {
        const newComments = (result.result as any).data;
        const comments = this.data.page === 1 ? newComments : [...this.data.comments, ...newComments];
        
        this.setData({
          comments,
          hasMore: newComments.length === this.data.pageSize,
          loading: false,
          loadingMore: false
        });
      } else {
        wx.showToast({
          title: (result.result && typeof result.result === 'object' && (result.result as any).message) || '加载失败',
          icon: 'none'
        });
        this.setData({
          loading: false,
          loadingMore: false
        });
      }
    } catch (error) {
      console.error('加载我的评论失败:', error);
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
      this.setData({
        loading: false,
        loadingMore: false
      });
    }

    if (showLoading) {
      wx.stopPullDownRefresh();
    }
  },

  // 点击评论跳转到帖子详情
  onCommentTap(e: any) {
    const comment = e.currentTarget.dataset.comment;
    wx.navigateTo({
      url: `/pages/post-detail/post-detail?id=${comment.postId}`
    });
  },

  // 点赞评论
  async onLikeComment(e: any) {
    e.stopPropagation();
    const comment = e.currentTarget.dataset.comment;
    
    try {
      const result = await wx.cloud.callFunction({
        name: 'likeComment',
        data: {
          commentId: comment.id
        }
      });

      if (result.result && typeof result.result === 'object' && (result.result as any).success) {
        const comments = this.data.comments.map(item => {
          if (item.id === comment.id) {
            return {
              ...item,
              isLiked: (result.result as any).data.isLiked,
              likeCount: (result.result as any).data.likeCount
            };
          }
          return item;
        });
        
        this.setData({ comments });
        
        wx.showToast({
          title: (result.result as any).data.isLiked ? '点赞成功' : '取消点赞',
          icon: 'success'
        });
      } else {
        wx.showToast({
          title: (result.result && typeof result.result === 'object' && (result.result as any).message) || '操作失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('点赞评论失败:', error);
      wx.showToast({
        title: '操作失败，请重试',
        icon: 'none'
      });
    }
  },

  // 跳转到帖子详情页
  onJumpToPost(e: any) {
    const comment = e.currentTarget.dataset.comment;
    if (!comment || !comment.postId) {
      wx.showToast({
        title: '帖子信息不存在',
        icon: 'none'
      });
      return;
    }

    wx.navigateTo({
      url: `/pages/post-detail/post-detail?id=${comment.postId}`
    });
  },

  // 删除评论
  onDeleteComment(e: any) {
    // TDesign 组件的事件对象可能不包含 stopPropagation 方法
    if (e && e.stopPropagation && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    const comment = e.currentTarget.dataset.comment;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条评论吗？',
      success: (res) => {
        if (res.confirm) {
          this.deleteComment(comment.id);
        }
      }
    });
  },

  // 执行删除评论
  async deleteComment(commentId: string) {
    try {
      const result = await wx.cloud.callFunction({
        name: 'deleteComment',
        data: {
          commentId
        }
      });

      if (result.result && typeof result.result === 'object' && (result.result as any).success) {
        const comments = this.data.comments.filter(item => item.id !== commentId);
        this.setData({ comments });
        
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        });
      } else {
        wx.showToast({
          title: (result.result && typeof result.result === 'object' && (result.result as any).message) || '删除失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('删除评论失败:', error);
      wx.showToast({
        title: '删除失败，请重试',
        icon: 'none'
      });
    }
  },

  // 分享评论
  onShareComment(e: any) {
    // TDesign 组件的事件对象可能不包含 stopPropagation 方法
    if (e && e.stopPropagation && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    const comment = e.currentTarget.dataset.comment;
    
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  // 去论坛页面
  onGoToForum() {
    wx.switchTab({
      url: '/pages/forum/forum'
    });
  },

  // 格式化时间
  formatTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) {
      return '刚刚';
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}分钟前`;
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}小时前`;
    } else if (diff < 2592000000) {
      return `${Math.floor(diff / 86400000)}天前`;
    } else {
      const date = new Date(timestamp);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
  },

  // 页面分享
  onShareAppMessage() {
    return {
      title: '我的评论',
      path: '/pages/my-comments/my-comments'
    };
  }
});