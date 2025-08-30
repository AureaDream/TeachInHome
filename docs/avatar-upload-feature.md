# 头像编辑功能实现说明

## 功能概述
在个人中心页面的用户头像旁边添加了编辑按钮，用户点击后可以选择图片并上传到云存储作为新头像。

## 实现内容

### 1. 界面修改
- **文件**: `miniprogram/pages/profile/profile.wxml`
- **修改**: 将头像包装在 `avatar-container` 容器中，添加编辑按钮
- **功能**: 点击编辑按钮触发 `onEditAvatar` 方法

### 2. 样式优化
- **文件**: `miniprogram/pages/profile/profile.wxss`
- **新增样式**:
  - `.avatar-container`: 头像容器，使用相对定位
  - `.edit-avatar-btn`: 编辑按钮，绝对定位在头像右下角

### 3. 功能实现
- **文件**: `miniprogram/pages/profile/profile.ts`
- **新增方法**:
  - `onEditAvatar()`: 调用微信选择媒体API
  - `uploadAvatar(tempFilePath)`: 上传图片到云存储
  - `updateUserAvatar(fileID)`: 更新数据库中的用户头像信息

## 技术特点

### 云存储路径
- 头像文件存储在 `/avatars/` 文件夹下
- 文件名格式: `{用户ID}.jpg`
- 使用用户的 `_id` 或 `userId` 作为文件名

### 数据更新
- 更新 `users` 集合中用户的 `avatarUrl` 字段
- 同步更新本地页面数据和全局用户信息
- 添加 `updateTime` 字段记录更新时间

### 用户体验
- 支持从相册选择或拍照
- 显示上传进度提示
- 成功/失败消息反馈
- 实时更新头像显示

## 使用方法
1. 进入个人中心页面
2. 点击头像右下角的编辑按钮
3. 选择图片来源（相册或拍照）
4. 等待上传完成
5. 头像自动更新显示

## 注意事项
- 需要确保云开发环境已正确配置
- 需要在云存储中创建 `avatars` 文件夹
- 建议设置合适的云存储访问权限
- 图片会自动转换为 `.jpg` 格式