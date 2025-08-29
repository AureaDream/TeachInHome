import Toast from '../../miniprogram_npm/tdesign-miniprogram/toast/index';

interface FormData {
  name: string;
  gender: string;
  age: string;
  school: string;
  major: string;
  grade: string;
  hometown: string;
  subjects: string[];
  experience: string;
  certificates: string;
  tutorExperience: string;
  skills: string;
  philosophy: string;
  phone: string;
  wechat: string;
  qq: string;
}

Page({
  data: {
    activeTab: 'form',
    saving: false,
    canPreview: false,
    
    // 表单数据
    formData: {
      name: '',
      gender: '',
      age: '',
      school: '',
      major: '',
      grade: '',
      hometown: '',
      subjects: [],
      experience: '',
      certificates: '',
      tutorExperience: '',
      skills: '',
      philosophy: '',
      phone: '',
      wechat: '',
      qq: ''
    } as FormData,
    
    // 选项数据
    subjects: ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治', '音乐', '美术', '体育'],
    gradeOptions: ['大一', '大二', '大三', '大四', '研一', '研二', '研三', '博士'],
    experienceOptions: ['无经验', '1年以下', '1-2年', '2-3年', '3年以上']
  },

  onLoad() {
    this.checkLoginStatus();
    this.loadSavedResume();
  },

  onShow() {
    this.updateCanPreview();
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

  // 加载已保存的简历
  loadSavedResume() {
    const savedResume = wx.getStorageSync('resumeData');
    if (savedResume) {
      this.setData({
        formData: { ...this.data.formData, ...savedResume }
      });
      this.updateCanPreview();
    }
  },

  // 标签切换
  onTabChange(e: any) {
    this.setData({
      activeTab: e.detail.value
    });
  },

  // 输入框变化
  onInputChange(e: any) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    
    this.setData({
      [`formData.${field}`]: value
    });
    
    this.updateCanPreview();
  },

  // 性别选择
  onGenderChange(e: any) {
    this.setData({
      'formData.gender': e.detail.value
    });
    this.updateCanPreview();
  },

  // 年级选择
  onGradeChange(e: any) {
    this.setData({
      'formData.grade': e.detail.value
    });
    this.updateCanPreview();
  },

  // 经验选择
  onExperienceChange(e: any) {
    this.setData({
      'formData.experience': e.detail.value
    });
    this.updateCanPreview();
  },

  // 科目选择
  onSubjectTap(e: any) {
    const subject = e.currentTarget.dataset.subject;
    const subjects = [...this.data.formData.subjects];
    const index = subjects.indexOf(subject);
    
    if (index > -1) {
      subjects.splice(index, 1);
    } else {
      subjects.push(subject);
    }
    
    this.setData({
      'formData.subjects': subjects
    });
    
    this.updateCanPreview();
  },

  // 更新预览状态
  updateCanPreview() {
    const { formData } = this.data;
    const canPreview = !!(formData.name && formData.gender && formData.school && formData.major && formData.subjects.length > 0 && formData.phone);
    
    this.setData({ canPreview });
  },

  // 保存简历
  onSaveResume() {
    if (!this.validateForm()) {
      return;
    }
    
    this.setData({ saving: true });
    
    // 模拟保存过程
    setTimeout(() => {
      wx.setStorageSync('resumeData', this.data.formData);
      
      Toast({
        context: this,
        selector: '#t-toast',
        message: '简历保存成功',
        theme: 'success'
      });
      
      this.setData({ saving: false });
    }, 1000);
  },

  // 预览简历
  onPreviewResume() {
    if (!this.data.canPreview) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请先填写必要信息',
        theme: 'warning'
      });
      return;
    }
    
    this.setData({
      activeTab: 'preview'
    });
  },

  // 编辑简历
  onEditResume() {
    this.setData({
      activeTab: 'form'
    });
  },

  // 导出简历
  onExportResume() {
    wx.showActionSheet({
      itemList: ['复制简历文本', '分享给朋友', '保存到相册'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.copyResumeText();
            break;
          case 1:
            this.shareResume();
            break;
          case 2:
            this.saveToAlbum();
            break;
        }
      }
    });
  },

  // 复制简历文本
  copyResumeText() {
    const resumeText = this.generateResumeText();
    
    wx.setClipboardData({
      data: resumeText,
      success: () => {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '简历已复制到剪贴板',
          theme: 'success'
        });
      }
    });
  },

  // 分享简历
  shareResume() {
    // 这里可以实现分享功能
    Toast({
      context: this,
      selector: '#t-toast',
      message: '分享功能开发中',
      theme: 'warning'
    });
  },

  // 保存到相册
  saveToAlbum() {
    // 这里可以实现保存图片功能
    Toast({
      context: this,
      selector: '#t-toast',
      message: '保存功能开发中',
      theme: 'warning'
    });
  },

  // 生成简历文本
  generateResumeText(): string {
    const { formData } = this.data;
    
    let text = '个人简历\n\n';
    text += '=== 基本信息 ===\n';
    text += `姓名：${formData.name}\n`;
    text += `性别：${formData.gender === 'male' ? '男' : '女'}\n`;
    text += `年龄：${formData.age}\n`;
    text += `学校：${formData.school}\n`;
    text += `专业：${formData.major}\n`;
    if (formData.grade) text += `年级：${formData.grade}\n`;
    if (formData.hometown) text += `户籍：${formData.hometown}\n`;
    
    text += '\n=== 教学能力 ===\n';
    text += `擅长科目：${formData.subjects.join('、')}\n`;
    if (formData.experience) text += `教学经验：${formData.experience}\n`;
    if (formData.certificates) text += `获得证书：${formData.certificates}\n`;
    
    if (formData.tutorExperience || formData.skills || formData.philosophy) {
      text += '\n=== 个人经验 ===\n';
      if (formData.tutorExperience) text += `家教经历：${formData.tutorExperience}\n`;
      if (formData.skills) text += `个人特长：${formData.skills}\n`;
      if (formData.philosophy) text += `教学理念：${formData.philosophy}\n`;
    }
    
    text += '\n=== 联系方式 ===\n';
    text += `手机号：${formData.phone}\n`;
    if (formData.wechat) text += `微信号：${formData.wechat}\n`;
    if (formData.qq) text += `QQ号：${formData.qq}\n`;
    
    return text;
  },

  // 表单验证
  validateForm(): boolean {
    const { formData } = this.data;
    
    if (!formData.name) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入姓名',
        theme: 'warning'
      });
      return false;
    }
    
    if (!formData.gender) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请选择性别',
        theme: 'warning'
      });
      return false;
    }
    
    if (!formData.school) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入学校',
        theme: 'warning'
      });
      return false;
    }
    
    if (!formData.major) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入专业',
        theme: 'warning'
      });
      return false;
    }
    
    if (formData.subjects.length === 0) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请选择擅长科目',
        theme: 'warning'
      });
      return false;
    }
    
    if (!formData.phone) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入手机号',
        theme: 'warning'
      });
      return false;
    }
    
    if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入正确的手机号',
        theme: 'warning'
      });
      return false;
    }
    
    return true;
  },

  // 页面分享
  onShareAppMessage() {
    return {
      title: '我的家教简历',
      path: '/pages/resume/resume'
    };
  }
});