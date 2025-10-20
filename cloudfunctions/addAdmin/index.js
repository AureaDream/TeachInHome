const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.getWXContext().ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const { username, password } = event || {};
    if (!username || !password) {
      return { success: false, message: '缺少用户名或密码' };
    }

    // 检查是否已存在同名管理员
    const exists = await db.collection('admin_config').where({ username }).get();
    if (exists.data && exists.data.length > 0) {
      return { success: false, message: '用户名已存在' };
    }

    await db.collection('admin_config').add({
      data: {
        username,
        password,
        createdAt: new Date(),
      }
    });

    return { success: true };
  } catch (err) {
    console.error('addAdmin error:', err);
    return { success: false, message: '服务器错误' };
  }
};