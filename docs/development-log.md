# 开发日志

## 概述
- 项目路径：`g:\WechatProject\3`
- 云环境初始化：`miniprogram/app.ts` 使用环境 ID `cloud1-3gqdqvkpbeab224c`
- 技术栈：微信小程序（TDesign 组件）、云开发（数据库/云函数）
- 文档目标：按实际代码实现过程梳理开发顺序与关键成果，便于回顾与后续迭代。

## 开发顺序与成果

### 1. 开发结果预览（prototype）
- 位置：`g:\WechatProject\3\prototype`
- 原型文件：`admin.html`、`forum.html`、`index.html`、`login.html`、`order-detail.html`、`orders.html`、`profile.html`、`resume.html`
- 目的：用于快速对界面结构和核心交互进行预览与对齐，为后续页面实现提供视觉与交互参考。

### 2. 登录（login）的实现
- 云函数：`cloudfunctions/login/index.js`
  - 返回 `OPENID`、`APPID` 等基础上下文信息，并透传前端 `userInfo`。
- 相关云函数：
  - `cloudfunctions/sendSmsCode/index.js`：生成并存储短信验证码（模拟发送）。
  - `cloudfunctions/verifyPhoneCode/index.js`：校验验证码有效性与使用状态。
- 应用初始化：`miniprogram/app.ts`
  - 初始化云开发环境，读取本地 `userInfo` 登录状态。
- 结果：完成登录态建立与基础校验流程，为个人中心与权限相关功能打底。

### 3. 个人中心（profile）的实现与头像不显示 Bug 修复
- 页面代码：`miniprogram/pages/profile/`（`profile.ts`、`profile.wxml`、`profile.wxss`）
- 功能要点：
  - 资料编辑、隐私设置、关于与客服弹窗、消息通知弹窗。
  - 使用 TDesign 组件（如 `t-dialog`、`t-cell`、`t-switch` 等）。
- 消息通知弹窗优化：
  - 新增云函数：`cloudfunctions/initNotifications/index.js`（含 `package.json`）。
  - 优化前端加载：在 `profile.ts` 中强化 `loadNotifications()` 的错误处理与空数据初始化逻辑，新增 `initNotificationsData()` 自动填充示例数据并重试加载。
  - 结果：解决了“消息通知弹窗为空白”的问题，支持空状态与自动初始化数据。
- 头像不显示 Bug 修复思路与实现：
  - 头像上传：`profile.ts` 中的上传与更新逻辑（如 `uploadAvatar()`、`updateUserAvatar()`）。
  - 头像显示：完善头像地址处理（例如通过兜底默认头像 `miniprogram/images/avatar-default.svg`），保证在网络异常或无头像时正常显示。
  - 结果：修复头像不显示问题，提升稳定性与用户体验。

### 4. 简历（resume）的实现
- 文件位置：`miniprogram/pages/resume/`
- 实现目标：支持用户维护基本信息、教育/技能等简历数据并在相关业务中复用。
- 说明：该模块与个人中心数据结构关联，遵循统一的校验与存储策略（具体字段与交互以页面代码为准）。

### 5. 管理员界面（admin）的实现
- 页面位置：`miniprogram/pages/admin/`
- 管理员数据初始化：`cloudfunctions/initAdminData/index.js`
  - 集合：`admin_config`，内置默认管理员与权限清单，支持幂等初始化。
- 管理员登录：`cloudfunctions/adminLogin/index.js`
  - 校验用户名与密码（演示环境纯文本），登录成功后更新最后登录时间。
- 订单发布：`cloudfunctions/publishOrder/index.js`
  - 校验管理员权限（`ADMIN_OPENIDS` 或 `users` 集合中的 `isAdmin` 字段），校验表单字段并写入订单集合。
- 结果：完成管理员入口、权限校验与核心管理动作（发布订单）。

### 6. 论坛（forum）的实现
- 帖子流与详情：
  - `cloudfunctions/getPosts/index.js`：分页、分类与搜索（含关键词正则匹配）。
  - `cloudfunctions/getPostDetail/index.js`：帖子详情与时间格式化。
  - `cloudfunctions/createPost/index.js`：创建帖子（依照页面调用实现）。
- 评论相关：
  - `cloudfunctions/getComments/index.js`、`createComment/index.js`、`deleteComment/index.js`、`likeComment/index.js`。
  - 个人评论页面：`miniprogram/pages/my-comments/`，含分页加载、跳转帖子详情、删除评论等功能。
  - 事件修复：为防止父级 `comment-item` 的 `onCommentTap` 冒泡导致“删除触发跳转”，已将操作按钮事件由 `bindtap` 改为 `catchtap`。
- 我的帖子：`cloudfunctions/getMyPosts/index.js`，与页面 `miniprogram/pages/my-posts/` 协同。
- 结果：完成论坛核心功能闭环，用户可发帖、评论、点赞、管理自己的帖子与评论。

## 数据库与权限
- 规则脚本参考：`scripts/setup-database-permissions.md`
- 索引建议：`docs/database-index-recommendations.md`
  - `notifications` 集合推荐索引：`{ userId: 1, createTime: -1 }`，提升按用户与时间降序查询性能。

## 测试与预览
- 原型预览：通过 `prototype` 目录 HTML 文件进行结构/交互验证。
- 小程序联调：微信开发者工具中初始化云环境、检查数据库集合与安全规则；页面内对弹窗、列表与表单进行真机/模拟器测试。

## 后续建议
- 完善单元测试与错误上报（如埋点与日志聚合）。
- 对云函数增加更细粒度的权限与字段校验。
- 页面层面增强空态与加载态统一体验，提升一致性。
- 梳理数据库集合的创建脚本与初始化流程，减少首轮使用成本。

---
本文根据当前代码结构与实现细节撰写，旨在帮助团队高效回顾开发过程并指导后续演进。