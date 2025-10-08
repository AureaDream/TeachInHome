# 云开发数据库索引建议

## 1. notifications 集合索引建议

### 查询模式分析
根据代码分析，`notifications` 集合的主要查询模式为：
```javascript
db.collection('notifications')
  .where({
    userId: userInfo._id
  })
  .orderBy('createTime', 'desc')
  .limit(10)
  .get()
```

### 推荐索引
**组合索引：**
- `userId`: 升序 (1)
- `createTime`: 降序 (-1)

### 索引创建命令
```javascript
// 在云开发控制台数据库管理中创建索引
{
  "userId": 1,
  "createTime": -1
}
```

### 索引效果
- 支持按 `userId` 精确查找
- 支持按 `createTime` 降序排序
- 提高分页查询性能
- 减少查询响应时间

## 2. 其他集合索引建议

### orders 集合
**查询模式：**
```javascript
// 查询1: 按状态和发布者查询
db.collection('orders').where({
  publisherId: userInfo._id
}).orderBy('createTime', 'desc')

// 查询2: 按状态查询
db.collection('orders').where({
  status: 'active'
})
```

**推荐索引：**
1. 组合索引：`{ "publisherId": 1, "createTime": -1 }`
2. 单字段索引：`{ "status": 1 }`

### posts 集合
**查询模式：**
```javascript
db.collection('posts')
  .where(whereCondition)
  .orderBy('createTime', 'desc')
  .skip((page - 1) * pageSize)
  .limit(pageSize)
```

**推荐索引：**
1. 组合索引：`{ "createTime": -1 }`（用于时间排序）
2. 根据具体查询条件添加相应索引

### comments 集合
**查询模式：**
```javascript
// 按作者查询评论
db.collection('comments')
  .where({
    'author.id': user._id
  })
  .orderBy('createTime', 'desc')

// 按帖子ID查询评论
db.collection('comments').where({
  postId: postId
})
```

**推荐索引：**
1. 组合索引：`{ "author.id": 1, "createTime": -1 }`
2. 单字段索引：`{ "postId": 1 }`

### users 集合
**查询模式：**
```javascript
// 按openid查询用户
db.collection('users').where({
  openid: wxContext.OPENID
})
```

**推荐索引：**
1. 单字段索引：`{ "openid": 1 }`

## 3. 索引创建优先级

### 高优先级（立即创建）
1. **notifications**: `{ "userId": 1, "createTime": -1 }`
2. **orders**: `{ "publisherId": 1, "createTime": -1 }`
3. **users**: `{ "openid": 1 }`

### 中优先级（根据使用频率创建）
1. **comments**: `{ "author.id": 1, "createTime": -1 }`
2. **comments**: `{ "postId": 1 }`
3. **orders**: `{ "status": 1 }`

### 低优先级（可选）
1. **posts**: `{ "createTime": -1 }`

## 4. 索引创建注意事项

1. **索引大小限制**：每个索引键的大小不能超过1024字节
2. **索引数量限制**：每个集合最多64个索引
3. **写入性能影响**：索引会影响写入性能，需要权衡
4. **存储空间**：索引会占用额外的存储空间

## 5. 监控建议

1. 定期检查查询性能
2. 监控索引使用情况
3. 根据实际查询模式调整索引
4. 删除不再使用的索引

## 6. 实施步骤

1. 在云开发控制台进入数据库管理
2. 选择对应的集合
3. 点击"索引管理"
4. 添加推荐的索引配置
5. 监控索引创建进度和效果