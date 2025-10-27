// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 暂停短信功能：始终返回关闭提示
exports.main = async (event, context) => {
  return {
    success: false,
    message: '短信验证功能已暂时关闭'
  }
}