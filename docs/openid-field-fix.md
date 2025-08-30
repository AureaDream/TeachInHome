# _openid 字段处理修复指南

## 问题描述

在创建用户时遇到错误：`errCode: -501007 invalid parameters | errMsg: Invalid Key Name: _openid`

## 问题原因

在微信小程序云开发中，`_openid` 是系统保留字段，由云数据库自动管理，不能在客户端代码中手动设置。

## 错误代码示例

```javascript
// ❌ 错误：手动设置 _openid
const newUser = {
  nickName: 'test',
  _openid: openid  // 这会导致 -501007 错误
};

db.collection('users').add({
  data: newUser
});
```

## 正确的处理方式

### 1. 创建用户时不设置 _openid

```javascript
// ✅ 正确：让系统自动添加 _openid
const newUser = {
  nickName: userInfo.nickName || '微信用户',
  avatarUrl: userInfo.avatarUrl || '',
  loginType: 'wechat',
  isAuthenticated: false,
  createTime: db.serverDate(),
  lastLoginTime: db.serverDate(),
  phone: '',
  email: '',
  bio: '',
  role: 'user',
  status: 'active'
  // _openid 字段由云数据库自动添加，不需要手动设置
};

db.collection('users').add({
  data: newUser
}).then(res => {
  // 用户创建成功，_openid 已自动添加
  console.log('用户创建成功:', res);
});
```

### 2. 查询用户时使用 _openid

```javascript
// ✅ 正确：使用 _openid 查询用户
db.collection('users').where({
  _openid: openid
}).get().then(res => {
  if (res.data.length > 0) {
    // 用户已存在
    const userInfo = res.data[0];
  } else {
    // 新用户，需要创建
  }
});
```

### 3. 数据库安全规则配置

```json
{
  "read": "auth != null",
  "write": "auth != null && (resource == null || auth.openid == resource._openid)"
}
```

**规则说明：**
- `auth != null`: 要求用户已登录
- `resource == null`: 允许创建新记录（此时 resource 为 null）
- `auth.openid == resource._openid`: 用户只能修改自己的记录

## 修复步骤

### 1. 修改客户端代码

移除所有手动设置 `_openid` 的代码：

```javascript
// 在 login.ts 中
// 移除：_openid: openid
// 移除：newUser._openid = openid;
```

### 2. 配置数据库安全规则

在云开发控制台中为 users 集合配置安全规则：

```json
{
  "read": "auth != null",
  "write": "auth != null && (resource == null || auth.openid == resource._openid)"
}
```

### 3. 测试验证

1. 重新运行小程序
2. 测试微信登录功能
3. 测试手机号登录功能
4. 验证用户创建和更新功能

## 注意事项

1. **系统字段**：`_openid`、`_id` 等以下划线开头的字段通常是系统保留字段
2. **自动管理**：云数据库会在用户登录后自动为记录添加 `_openid` 字段
3. **权限控制**：使用 `_openid` 进行权限控制时，应在安全规则中配置，而不是在客户端代码中
4. **查询使用**：可以使用 `_openid` 进行查询，但不能手动设置其值

## 相关错误码

- `-501007`: Invalid Key Name - 使用了无效的键名（如手动设置系统保留字段）
- `-502003`: Database Permission Denied - 数据库权限被拒绝

## 相关文档

- [云开发数据库文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/database/)
- [数据库安全规则](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/database/security-rules.html)
- [用户身份与权限](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/database/security-rules.html#用户身份与权限)