# 解忧小镇

一个把线下吉他路演、青年访谈与可探索数字小镇连接起来的 Web MVP。主理人收集烦恼，每棵树或每只动物代表一个问题；参与者在线下回答，主理人自行转录、确认授权并以虚拟旅人身份发布。系统不上传录音，不让 AI 代替人发表观点。

## 功能边界

- 公共端：当前活动、画卷小镇、林场/牧场、烦恼详情、公开观点、虚拟旅人主页和文字列表降级。
- 主理台：活动与烦恼草稿、状态生命周期、地图摆放、精选排序、旅人创建、授权观点发布、账号恢复和永久删除审核。
- 旅人端：一次性二维码认领、长期登录、虚拟资料维护、立即隐藏/恢复自己的观点、申请永久删除。
- 明确不包含：录音上传、自动转写、AI 观点、公开投稿/评论、点赞、实时多人、自由行走、素材上传和支付。

## 本地启动

要求 Node.js `22.14.x` 和 npm `10.9.x`。

```powershell
npm install
Copy-Item .env.example .env
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

`.env` 示例：

```dotenv
DATABASE_URL="file:./prisma/dev.db"
ADMIN_BOOTSTRAP_PASSWORD="请换成至少 12 位的强密码"
CRISIS_RESOURCE_NOTICE="如果你或身边的人正面临立即危险，请联系当地急救或专业危机干预服务。"
```

首次设置 `ADMIN_BOOTSTRAP_PASSWORD` 后运行 `npm run db:seed`，后台账号为 `curator`。不要把 `.env`、数据库或参与者链接提交到 Git。

## 主理人工作流

1. 访问 `/admin/login` 登录。
2. 创建活动和烦恼草稿；烦恼发布后才能进入精选。
3. 在地图页选择预置树木/动物，摆放到林场或牧场，并按顺序选择 3～5 个本场精选。
4. 线下访谈后创建虚拟旅人，手工录入已经编辑确认的最终观点，记录公开授权说明并发布。
5. 为未认领旅人生成一次性二维码。链接只返回一次，数据库只保存哈希。
6. 参与者认领后可维护虚拟身份、隐藏观点或提交永久删除申请；主理人在隐私队列核对处理。

活动生命周期是 `draft → active → ended → archived`；烦恼生命周期是 `draft → published → archived`。归档内容不能直接重新公开。只有 `published` 观点计入生命成长。

## 测试与生产检查

```powershell
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

端到端测试每次会删除并重建明确的 `prisma/e2e.db`，不会触碰开发数据库。首次运行 Playwright 如提示缺少浏览器，请执行：

```powershell
npx playwright install chromium
```

## 部署与备份

```powershell
npm run build
npm start
```

SQLite 试点部署需要：

- 单个持久 Node 实例；
- 持久磁盘挂载 `prisma/dev.db`；
- 每日停止写入后复制数据库文件，并定期验证恢复；
- HTTPS、强管理员密码和不可公开的环境变量。

备份示例（先停止应用写入）：

```powershell
Copy-Item -LiteralPath 'prisma/dev.db' -Destination ("backups/relief-town-" + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.db')
```

开始横向扩容、多人同时编辑或长期公开运营前，应迁移到 PostgreSQL；仓储层边界使页面组件无需随数据库切换而重写。

## 数据删除与安全

- 公共接口不返回草稿、隐藏/删除观点、授权说明、密码哈希、账号令牌或会话信息。
- 旅人可以立即隐藏/恢复自己的观点；永久删除经审核后正文替换为最小审计占位并永不公开。
- 原始录音始终保留在主理人自己的手机流程中，不进入系统。
- 如需彻底移除一名参与者的数据，先处理其删除请求并撤销会话/令牌，再在备份保留规则允许的范围内清理关联记录。
- 危机敏感内容只展示主理人配置的专业求助提示，不输出诊断或自动化安慰结论。
