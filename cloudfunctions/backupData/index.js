const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.getWXContext().ENV });
const db = cloud.database();

async function fetchAll(collection) {
  // 简化：假设总量不大，直接一次get
  const res = await db.collection(collection).get();
  return res.data || [];
}

exports.main = async () => {
  try {
    const [users, orders, posts, settings] = await Promise.all([
      fetchAll('users'),
      fetchAll('orders'),
      fetchAll('posts'),
      fetchAll('settings')
    ]);

    await db.collection('backups').add({
      data: {
        type: 'full',
        createdAt: new Date(),
        users,
        orders,
        posts,
        settings
      }
    });

    return { success: true };
  } catch (err) {
    console.error('backupData error:', err);
    return { success: false, message: '备份失败' };
  }
};