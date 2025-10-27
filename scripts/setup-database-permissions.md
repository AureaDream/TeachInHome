# 数据库权限快速配置脚本

## 使用说明

本脚本帮助您快速配置云开发数据库和存储的安全规则，解决权限相关错误。

## 配置步骤

### 1. 打开云开发控制台

1. 在微信开发者工具中点击「云开发」按钮
2. 或直接访问：https://console.cloud.tencent.com/tcb
3. 选择您的环境ID：`cloud1-3gqdqvkpbeab224c`

### 2. 配置数据库安全规则

#### 步骤：
1. 点击左侧菜单「数据库」
2. 选择「安全规则」标签页
3. 依次为以下集合添加规则：

#### users 集合规则
```json
{
  "read": "auth != null",
  "write": "auth != null && (resource == null || auth.openid == resource._openid)"
}
```

**说明：** 此规则允许创建新用户和用户修改自己的数据。

#### orders 集合规则
```json
{
  "read": "auth != null",
  "write": "auth != null"
}
```

#### posts 集合规则
```json
{
  "read": "auth != null",
  "write": "auth != null"
}
```

#### comments 集合规则
```json
{
  "read": "auth != null",
  "write": "auth != null"
}
```

### 3. 配置云存储安全规则

#### 步骤：
1. 点击左侧菜单「存储」
2. 选择「安全规则」标签页
3. 添加以下规则：

```json
{
  "read": "auth != null",
  "write": "auth != null"
}
```

### 4. 验证配置

1. 保存所有规则后，等待2-3分钟生效
2. 重新启动微信开发者工具
3. 测试登录功能
4. 测试个人信息编辑功能

### 5. 常见错误解决

#### 错误 -501007: Invalid Key Name: _openid
- **原因：** 手动设置了系统保留字段 `_openid`
- **解决：** 移除代码中所有手动设置 `_openid` 的部分
- **详细说明：** 参考 `docs/openid-field-fix.md`

#### 错误 -502003: Database Permission Denied
- **原因：** 数据库安全规则未配置或配置错误
- **解决：** 按照上述步骤配置安全规则

### 6. 故障排除

如果仍然遇到权限错误：

1. **检查环境ID**
   - 确认app.ts中的cloudEnvId与控制台环境一致

2. **检查用户登录状态**
   - 确认用户已通过微信登录
   - 检查本地存储中的用户信息

3. **检查数据结构**
   - 确认不要手动设置 `_openid` 字段
   - 检查集合名称是否正确

4. **临时调试**
   - 可以临时使用更宽松的规则进行测试：
   ```json
   {
     "read": true,
     "write": true
   }
   ```
   - 确认功能正常后再恢复严格规则

### 7. 完成确认

配置完成后，您应该能够：
- ✅ 成功进行微信登录
- ✅ 创建新用户记录
- ✅ 编辑个人信息
- ✅ 上传和显示头像
- ✅ 正常使用所有数据库功能

如果遇到问题，请参考相关文档：
- `docs/database-security-rules-setup.md` - 详细配置指南
- `docs/openid-field-fix.md` - _openid 字段处理指南

## 通知（notifications）集合权限建议
- 目的：允许客户端读取自己的通知；写入（标记已读/删除）由云函数执行，避免 -502003。
- 控制台设置：将 `notifications` 集合设置为“仅创建者可读写”。
- 字段约定：每条通知包含 `userId`（指向 `users._id`），用于所有权判断。
- 客户端策略：
  - 读取：`where({ userId: 当前用户ID })` 正常读取。
  - 写入：统一改为调用云函数（例如 `deleteNotification`、`markNotificationsRead`）。

> 如果需要允许客户端直接修改为已读，可将权限调为“所有用户可读，创建者可读写”，但推荐继续使用云函数写入以降低误操作风险。