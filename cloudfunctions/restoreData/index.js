const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.getWXContext().ENV });
const db = cloud.database();

async function clearCollection(name) {
  // 清空集合（条件删除）
  await db.collection(name).where({}).remove();
}

async function insertAll(name, docs) {
  if (!docs || !docs.length) return;
  for (const doc of docs) {
    const {_id, ...data} = doc;
    await db.collection(name).add({ data });
  }
}

exports.main = async () => {
  try {
    // 取最近一次备份
    const latest = await db.collection('backups').orderBy('createdAt', 'desc').limit(1).get();
    if (!latest.data || !latest.data.length) {
      return { success: false, message: '没有可用的备份' };
    }
    const backup = latest.data[0];

    // 清空并写入
    await clearCollection('users');
    await clearCollection('orders');
    await clearCollection('posts');
    await clearCollection('settings');

    await insertAll('users', backup.users || []);
    await insertAll('orders', backup.orders || []);
    await insertAll('posts', backup.posts || []);
    await insertAll('settings', backup.settings || []);

    return { success: true };
  } catch (err) {
    console.error('restoreData error:', err);
    return { success: false, message: '恢复失败' };
  }
};