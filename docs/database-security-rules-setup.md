# 云数据库安全规则配置指南

## 问题描述
遇到数据库权限错误：`errCode: -502003 database permission denied`

## 解决方案

### 1. 在云开发控制台配置数据库安全规则

1. 打开微信开发者工具
2. 点击「云开发」按钮
3. 进入云开发控制台
4. 选择「数据库」-> 「安全规则」
5. 为每个集合配置相应的安全规则

### 2. 各集合安全规则配置

#### users 集合
```json
{
  "read": "auth != null",
  "write": "auth != null && (resource == null || auth.openid == resource._openid)"
}
```

**注意：** 此规则允许创建新用户（resource == null）和用户修改自己的数据。

#### orders 集合
```json
{
  "read": "auth != null",
  "write": "auth != null"
}
```

#### posts 集合
```json
{
  "read": "auth != null",
  "write": "auth != null"
}
```

#### comments 集合
```json
{
  "read": "auth != null",
  "write": "auth != null"
}
```

### 3. 规则说明

- `auth != null`: 要求用户已登录
- `auth.openid == resource.data._openid`: 用户只能修改自己的数据
- `resource.data`: 表示数据库中的文档数据

### 4. 云存储安全规则

#### 存储权限配置
```json
{
  "read": "auth != null",
  "write": "auth != null"
}
```

### 5. 配置步骤

#### 数据库权限配置
1. **进入云开发控制台**
   - 在微信开发者工具中点击「云开发」
   - 或直接访问：https://console.cloud.tencent.com/tcb

2. **选择数据库**
   - 点击左侧菜单「数据库」
   - 选择「安全规则」标签页

3. **配置集合规则**
   - 点击「添加规则」
   - 选择对应的集合名称
   - 粘贴对应的JSON规则
   - 点击「保存」

#### 云存储权限配置
1. **选择云存储**
   - 点击左侧菜单「存储」
   - 选择「安全规则」标签页

2. **配置存储规则**
   - 粘贴存储权限JSON规则
   - 点击「保存」

3. **验证配置**
   - 重新运行小程序
   - 测试登录和数据操作功能

### 6. 常见问题

#### 问题1：规则配置后仍然报错
- 检查集合名称是否正确
- 确认用户已正确登录
- 检查_openid字段是否存在

#### 问题2：无法创建新用户
- 检查users集合的write规则
- 确认新用户数据包含_openid字段

#### 问题3：权限过于严格
- 可以临时使用 `"write": "auth != null"` 进行测试
- 确认功能正常后再添加更严格的权限控制

### 7. 测试验证

1. **登录测试**
   ```javascript
   // 确认用户已登录
   wx.cloud.callFunction({
     name: 'login'
   })
   ```

2. **数据操作测试**
   ```javascript
   // 测试创建用户
   db.collection('users').add({
     data: {
       nickName: 'test',
       _openid: 'user_openid'
     }
   })
   ```

### 8. 注意事项

- 安全规则配置后需要等待几分钟生效
- 建议先在测试环境验证规则的正确性
- 定期检查和更新安全规则
- 避免使用过于宽松的权限设置

### 9. 相关文档

- [云开发数据库安全规则](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/database/security-rules.html)
- [云开发控制台](https://console.cloud.tencent.com/tcb)