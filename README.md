# deepSea 项目接手说明

这份文档用于在新的 Codex / AI 对话中快速恢复项目上下文。文档刻意不包含任何生产用户名、密码、IP、邀请码、证书路径或私有连接串。

## 1. 项目介绍

deepSea 是一个类 X.com / Bluesky 的社交网站原型，当前以快速迭代为主。

核心目标：

- 用户注册、登录后才能浏览和发言。
- 首页是时间线，可以发 post、上传图片和视频、互动。
- UI 简洁，左侧导航 + 中间内容区，不做 X 右侧信息栏。
- 支持中文、英文、日文 UI。
- 品牌为 `deepSea`，包含海豚 logo、favicon、海底首页背景和海洋动物 avatar。

本地开发地址：

- `http://localhost:3000`

## 2. 技术栈

- Framework: Next.js 15 App Router
- Language: TypeScript
- UI: React 19
- Styling: `app/globals.css` 手写 CSS
- Icons: `lucide-react`
- Database: MySQL
- ORM: Prisma
- Auth: 自建 session cookie，cookie 名为 `myx_session`
- Admin Auth: 独立后台 session cookie，cookie 名为 `deepsea_admin_session`
- Upload: 本地 `public/uploads/`
- Image processing: `sharp` + `heic-convert`

注意：

- 当前项目没有使用 Tailwind。
- 上传文件本地存在 `public/uploads/`，该目录只保留 `.gitkeep`。
- HEIC/HEIF 转换依赖 `heic-convert` 的 WASM 包，`npm run build` 时可能出现 `libheif-js` dynamic require warning，目前 build 可通过。

## 3. 常用命令

```bash
npm run dev
npm run build
npx tsc --noEmit
npm run db:migrate
npm run db:generate
npm run db:studio
```

环境变量参考 `.env.example`，真实 `.env` 不要提交。

开发时经常在运行 `npm run build` 后重启 dev server，避免浏览器加载旧的 `.next` chunk。

## 4. 目录结构

```text
app/
  page.tsx                         # 首页 / 登录后的主时间线 / 未登录 landing
  layout.tsx                       # 全局 layout
  globals.css                      # 全站样式
  login/page.tsx                   # 登录页面
  register/page.tsx                # 注册页面
  terms/page.tsx                   # 服务条款
  privacy/page.tsx                 # 隐私政策
  explore/page.tsx                 # 搜索 post 页面
  notifications/page.tsx           # 通知页面
  bookmarks/page.tsx               # 书签页面
  settings/page.tsx                # 设置页面
  admin/page.tsx                   # 独立后台管理页面
  profile/page.tsx                 # 当前用户个人主页
  profile/edit/page.tsx            # 编辑当前用户资料
  users/[username]/page.tsx        # 其他用户主页
  users/[username]/follows/page.tsx# followers / following 用户列表
  posts/[postId]/page.tsx          # post 详情、评论、编辑、删除
  components/
    ComposerBox.tsx
    MediaGrid.tsx
    PostListPage.tsx
    ReportDialog.tsx
    LegalPage.tsx
  api/
    admin/*
    auth/*
    posts/*
    comments/*
    users/*
    profile/*
    settings/route.ts
    uploads/route.ts
    notifications/route.ts
lib/
  api.ts
  auth.ts
  admin-auth.ts
  avatars.ts
  notifications.ts
  password.ts
  posts.ts
  prisma.ts
  shared.ts
prisma/
  schema.prisma
  migrations/
public/
  avatars/
  uploads/
  deepsea-logo.svg
  deepsea-landing-bg.png
middleware.ts
```

## 5. 数据模型概览

主要 Prisma 模型：

- `User`: 用户资料、语言、头像、简介、IP/地区记录、无效化状态。
- `AdminUser` / `AdminSession`: 后台管理员和后台 session。
- `InviteCode`: 注册邀请码。公开源码不应包含真实邀请码 seed。
- `Session`: 普通用户 session。
- `Post`: post 正文、媒体、软删除、创建请求元数据。
- `Media`: post 图片 / 视频。
- `Comment` / `CommentMedia`: 评论和评论媒体。
- `Like`, `Bookmark`, `Repost`, `PostView`, `Notification`, `Follow`。
- `Report`: post/comment 举报。
- `UserBlock`: 用户屏蔽关系。

共享前端类型在 `lib/shared.ts`。

## 6. 已完成功能

- 注册、登录、退出、邀请码注册。
- 登录后时间线、For you / Following feed。
- 发帖、评论、图片/视频上传、HEIC/HEIF 转换。
- like、bookmark、repost、share、view count。
- post 编辑 / 删除。
- profile、用户主页、关注/取消关注、关注列表。
- 搜索、通知、设置、书签。
- post/comment 举报，带原因选择对话框。
- 用户主页 block / unblock。
- 后台用户管理、密码重置、账号无效化/恢复、数据库备份、reported content 列表、隐藏 post/comment。
- Terms of Service 和 Privacy Policy，支持 `zh / en / ja`。

## 7. 后续计划

1. Quote repost。
2. hashtag 和 mention。
3. 通知详情和已读状态 UI。
4. 用户头像自定义上传。
5. 评论编辑 / 删除。
6. 更完整的 profile tabs。
7. 后台内容审计、删除/隐藏内容、管理员操作日志。
8. 邀请码后台管理页面。
9. 视频转码或缩略图。
10. 对象存储或可靠上传备份策略。
11. 分页 / 无限滚动。
12. 更完整的测试覆盖。
13. 生产运维增强。

## 8. 开发注意事项

- 修改前先用 `rg` 找现有模式。
- 媒体展示优先复用 `app/components/MediaGrid.tsx`。
- post / comment 输入框优先复用 `app/components/ComposerBox.tsx`。
- Prisma 查询 post/comment 媒体时要选择 `{ type: true, url: true }`。
- 修改 `AppPost`、`AppComment`、`AppMedia` 类型后，要同步检查 `lib/posts.ts` 和相关 API include/select。
- 修改 Prisma schema 后，本地开发用 `npm run db:migrate`；生产部署使用 `npx prisma migrate deploy`。
- 后台权限相关代码主要在 `lib/admin-auth.ts`、`app/api/admin/*`、`app/admin/page.tsx`。
- 常规验证：

```bash
npx tsc --noEmit
npm run build
```

## 9. 安全提交规则

- 不提交 `.env`、真实数据库连接串、session secret、证书、服务器 IP、SSH 信息、真实邀请码、真实后台用户名或密码。
- 不提交 `public/uploads/` 内用户上传文件。
- 不提交 `.next/`、`.next.*/`、`node_modules/`、`storage/` 或本地备份。
- 公开迁移文件不应 seed 真实邀请码或真实管理员账号。
