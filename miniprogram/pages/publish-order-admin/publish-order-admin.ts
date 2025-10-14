import Toast from '../../miniprogram_npm/tdesign-miniprogram/toast/index';

interface CloudFunctionResult {
  success: boolean;
  message?: string;
  data?: any;
}

interface PublishOrderForm {
  orderNumber: string;
  title: string;
  studentName: string;
  subject: string;
  grade: string;
  studentGender: string;
  teacherRequirements: string;
  location: string;
  salaryRange: string;
  hoursRequired: number;
  description: string;
  requirements: string;
  contactInfo: string;
}

Page({
  data: {
    // 表单数据
    publishOrderForm: {
      orderNumber: '',
      title: '',
      studentName: '',
      subject: '',
      grade: '',
      studentGender: '',
      teacherRequirements: '',
      location: '',
      salaryRange: '',
      hoursRequired: 0,
      description: '',
      requirements: '',
      contactInfo: ''
    } as PublishOrderForm,
    
    // 状态
    publishingOrder: false
  },

  onLoad() {
    // 生成默认订单编号
    const now = new Date();
    const orderNumber = `JLJ${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    
    this.setData({
      'publishOrderForm.orderNumber': orderNumber
    });
  },

  // 表单输入处理
  onPublishOrderFormChange(e: any) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    this.setData({
      [`publishOrderForm.${field}`]: value
    });
  },

  // 发布订单
  async onConfirmPublishOrder() {
    const form = this.data.publishOrderForm;
    
    // 表单验证
    if (!form.orderNumber.trim()) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入订单编号',
        theme: 'warning'
      });
      return;
    }
    
    if (!form.title.trim()) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入订单标题',
        theme: 'warning'
      });
      return;
    }
    
    if (!form.studentName.trim()) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入学生姓名',
        theme: 'warning'
      });
      return;
    }
    
    if (!form.location.trim()) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入上课地点',
        theme: 'warning'
      });
      return;
    }
    
    if (!form.salaryRange.trim()) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入薪资范围',
        theme: 'warning'
      });
      return;
    }
    
    if (!form.description.trim()) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入订单描述',
        theme: 'warning'
      });
      return;
    }
    
    if (form.hoursRequired <= 0) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入正确的课时要求',
        theme: 'warning'
      });
      return;
    }
    
    this.setData({ publishingOrder: true });
    
    try {
      // 调用云函数发布订单
      const result = await wx.cloud.callFunction({
        name: 'publishOrder',
        data: {
          orderNumber: form.orderNumber.trim(),
          title: form.title.trim(),
          studentName: form.studentName.trim(),
          subject: form.subject,
          grade: form.grade,
          studentGender: form.studentGender,
          teacherRequirements: form.teacherRequirements.trim(),
          location: form.location.trim(),
          salaryRange: form.salaryRange.trim(),
          hoursRequired: form.hoursRequired,
          description: form.description.trim(),
          requirements: form.requirements.trim(),
          contactInfo: form.contactInfo.trim(),
          status: 'pending'
        }
      });
      
      console.log('发布订单结果:', result);
      
      // 检查云函数调用是否成功以及返回结果
      if (result.result && typeof result.result === 'object' && (result.result as CloudFunctionResult).success) {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '订单发布成功',
          theme: 'success'
        });
        
        // 延迟返回上一页
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        const errorMessage = (result.result && typeof result.result === 'object' ? (result.result as any).message : null) || result.errMsg || '发布订单失败';
        Toast({
          context: this,
          selector: '#t-toast',
          message: errorMessage,
          theme: 'error'
        });
      }
    } catch (error) {
      console.error('发布订单失败:', error);
      Toast({
        context: this,
        selector: '#t-toast',
        message: '发布订单失败，请重试',
        theme: 'error'
      });
    } finally {
      this.setData({ publishingOrder: false });
    }
  },

  // 重置表单
  onResetForm() {
    const now = new Date();
    const orderNumber = `JLJ${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    
    this.setData({
      publishOrderForm: {
        orderNumber: orderNumber,
        title: '',
        studentName: '',
        subject: '',
        grade: '',
        studentGender: '',
        teacherRequirements: '',
        location: '',
        salaryRange: '',
        hoursRequired: 0,
        description: '',
        requirements: '',
        contactInfo: ''
      }
    });
  },

  // 返回上一页
  onBack() {
    wx.navigateBack();
  }
});