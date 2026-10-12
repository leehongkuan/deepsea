# X-like Social Website Step-by-Step Plan

## 当前目标

我们不要一次性把所有功能做完。这个项目按小步推进：

1. 先确定技术方案。
2. 确认本机开发环境和必要软件。
3. 先做界面设计与交互原型。
4. 你确认界面后，再开发第一批核心功能。
5. 每完成一小阶段就运行、检查、调整。

## Step 1: 技术选型

因为上一项目已经安装过 MySQL、Node、Python，本项目优先复用现有环境，减少配置成本。

采用技术：

- 前端和后端框架：Next.js
- 语言：TypeScript
- UI：React
- 样式：Tailwind CSS
- 图标：lucide-react
- 数据库：MySQL
- ORM：Prisma
- 登录认证：Auth.js 或自建 session auth
- 图片上传：第一阶段先使用本地开发存储，后续再换成 S3 / Cloudflare R2 / Supabase Storage
- 多语言：next-intl 或自建 locale JSON

推荐第一版采用：

- Next.js + TypeScript
- Tailwind CSS
- MySQL + Prisma
- 自建简单登录系统
- 本地图片上传目录
- 自建 `zh / en / ja` 语言文件

原因：

- MySQL 已安装，可以直接用。
- Next.js 可以同时做页面和 API。
- Prisma 方便后续维护数据表。
- 第一阶段不用接外部云存储，先把产品逻辑跑通。

## Step 2: 环境确认

当前已确认：

- Node: `v24.16.0`
- npm: `11.13.0`
- Python: `3.9.6`
- MySQL: `8.0.46`

下一步需要确认：

- MySQL 服务是否正在运行。
- 是否可以创建项目数据库。
- 是否要创建独立数据库名，例如 `x_clone_dev`。

建议数据库：

- 数据库名：`x_clone_dev`
- 本地开发账号：沿用本机 MySQL 当前账号
- 环境变量文件：`.env`

需要的软件：

- 已有 Node
- 已有 npm
- 已有 MySQL
- 已有 Python
- 需要安装项目 npm dependencies

## Step 3: 项目初始化

初始化内容：

- 创建 Next.js 项目结构
- 配置 TypeScript
- 配置 Tailwind CSS
- 配置 ESLint
- 配置 Prisma
- 创建 `.env.example`
- 创建基础目录

建议目录：

```text
app/
  [locale]/
    layout.tsx
    page.tsx
    explore/
    notifications/
    bookmarks/
    profile/
  api/
components/
  layout/
  post/
  ui/
lib/
  auth/
  db/
  i18n/
  upload/
messages/
  zh.json
  en.json
  ja.json
prisma/
  schema.prisma
public/
  uploads/
```

完成标准：

- 本地开发服务器可以启动。
- 首页可以打开。
- Tailwind 样式生效。
- 多语言路由基础可用。

## Step 4: 界面设计和确认

先不做完整后端，先做静态界面，让你确认视觉方向。

### 桌面布局

界面分两栏：

- 左侧固定导航栏
- 中间主内容区

不做 x.com 右侧栏。

左侧保留：

- Home
- Explore
- Notifications
- Bookmarks
- Profile
- Post
- 用户名字和 handle

中间区域：

- 顶部标题
- 发帖输入框
- 时间线列表
- post 卡片

### 移动端布局

- 底部导航栏
- 右下角浮动 Post 按钮
- 主内容单栏显示

### 视觉方向

关键词：

- 简洁
- 白底
- 高可读性
- 类似 x.com，但更清爽
- 不做复杂装饰
- 不做右侧信息流

### 第一版界面需要展示

- 主页 timeline
- post composer
- 文字 post
- 带图片 post
- 200 字折叠效果
- reply / repost / like / view / bookmark / share 操作栏
- 左侧导航
- 语言切换入口

完成标准：

- 桌面端界面完整。
- 移动端不挤压、不重叠。
- 你确认整体布局和风格。

## Step 5: 第一批功能范围

先完成最小可用版本，不急着做全部功能。

第一批功能包括：

- 多语言 UI：中文、英文、日文
- 用户注册
- 用户登录
- 用户退出
- 只有登录用户可以发 post
- 文字 post，最多 3000 字
- timeline 默认显示前 200 字
- 点击 `Show more` 展开全文
- post 列表展示
- 左侧导航页面跳转

第一批暂不做：

- 图片上传
- 视频上传
- reply 真实功能
- repost 真实功能
- like 真实功能
- bookmark 真实功能
- notification 数据
- explore 搜索

这些按钮会先显示在界面上，但可以暂时不连接真实数据。

## Step 6: 第二批功能范围

第二批加入互动和媒体：

- 图片上传
- 最多 9 张图片
- 图片预览和删除
- like / unlike
- bookmark / unbookmark
- share 复制链接
- profile 页面显示用户 posts
- bookmarks 页面显示收藏 posts

暂不做视频转码，只做基础文件校验。

## Step 7: 第三批功能范围

第三批做社交结构：

- reply
- post detail 页面
- repost
- view count
- notifications
- explore 搜索

## Step 8: 第四批功能范围

第四批做增强：

- video 上传
- quote repost
- hashtags
- mentions
- follow 系统
- 用户资料编辑
- 内容举报
- 基础管理功能

## 数据模型规划

第一批需要：

### users

- id
- username
- display_name
- email
- password_hash
- language
- avatar_url
- created_at
- updated_at

### posts

- id
- author_id
- body
- created_at
- updated_at
- deleted_at

第二批加入：

### media

- id
- post_id
- uploader_id
- type
- url
- thumbnail_url
- sort_order
- created_at

### likes

- id
- post_id
- user_id
- created_at

### bookmarks

- id
- post_id
- user_id
- created_at

第三批加入：

### reposts

- id
- post_id
- user_id
- created_at

### post_views

- id
- post_id
- user_id
- anonymous_session_id
- created_at

### notifications

- id
- user_id
- actor_id
- post_id
- type
- read_at
- created_at

## 第一阶段具体执行清单

### 1. 初始化项目

- 创建 Next.js 项目
- 安装依赖
- 配置 Tailwind
- 配置基础目录

### 2. 做静态界面

- App shell
- 左侧导航
- 首页时间线
- 发帖框
- PostCard
- PostActionBar
- 语言切换

### 3. 你确认界面

确认点：

- 左侧导航是否合适
- 主内容宽度是否合适
- 字体大小是否舒服
- post 卡片是否清爽
- 手机端是否能接受
- 是否需要更接近 x.com 或更独立

### 4. 接入数据库

- 创建 MySQL 数据库
- 配置 Prisma
- 创建 users / posts 表
- 运行 migration

### 5. 做登录注册

- 注册页面
- 登录页面
- session 保存
- 退出登录
- 登录状态展示

### 6. 做发帖

- 登录用户可以发帖
- 未登录用户点击发帖提示登录
- 限制 3000 字
- 空内容不能提交
- timeline 展示 posts
- 超过 200 字默认折叠

## 界面确认前的静态示例内容

为了先看效果，可以使用假数据：

- 中文 post
- 英文 post
- 日文 post
- 长 post，用于测试 200 字折叠
- 带图片占位的 post

## 决策点

在进入开发前，需要确认这几个选择：

- 数据库名是否使用 `x_clone_dev`
- 第一版是否先不做图片上传，只做界面占位
- 网站默认语言是否用中文
- 产品名字是否先暂定为 `MyX`
- 登录方式是否先只支持邮箱 + 密码

## 当前建议

建议下一步直接做：

1. 创建 Next.js 项目。
2. 安装 Tailwind、Prisma、lucide-react。
3. 先做静态界面。
4. 启动本地服务器给你看。
5. 你确认界面后，再接 MySQL 和登录发帖功能。

