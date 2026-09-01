<p align="center"><img src="docs/banner.svg" alt="StudyPilot AI — Less collecting. More connecting." width="100%"></p>

# StudyPilot AI

上传 PDF，整理知识点、安排复习，并基于原文进行问答。

**状态：v0.1 开发预览版（Alpha），不是生产就绪版本。** 本仓库包含前后端实现和可运行的本地演示。真实模型联调、浏览器端完整回归、部署验收仍未全部完成。演示内容和真实 AI 输出有明确区分，不使用虚构用户数、通过率或部署链接。

[快速开始](#快速开始) · [项目架构](docs/architecture.md) · [开发路线](docs/roadmap.md) · [安全边界](SECURITY.md) · [MIT 许可证](LICENSE)

## 不止是一个聊天窗口

| 工作环节 | 当前实现                                                    |
| -------- | ----------------------------------------------------------- |
| 阅读     | PDF 上传、异步处理、分页阅读、文本视图、原文关键词搜索      |
| 理解     | 章节与知识点树，重要程度、难度、摘录和来源页码              |
| 问答     | pgvector 检索、文档内问答、可跳转的引用；证据不足时明确提示 |
| 复习     | 按时间容量安排学习计划、任务勾选、闪卡与间隔复习            |
| 自测     | 选择题、判断题、简答题，以及带出处的答题反馈                |
| 控制     | 浅色/深色主题、文档重命名与删除、服务端模型配置             |

页面包括产品首页、学习仪表盘、文档库、PDF 学习工作区、复习计划、模型设置、隐私说明和开源说明。界面当前以英文为主。

## 快速开始

需要 **Node.js 22.13+、Python 3.11+**。首次运行需要联网安装开源依赖。不需要购买数据库或模型服务即可体验内置样例。

### macOS / Linux

```bash
git clone https://github.com/ZZZ234234234/study-pilot-ai.git
cd study-pilot-ai
cp .env.example .env
make install
make dev
```

### Windows PowerShell

```powershell
git clone https://github.com/ZZZ234234234/study-pilot-ai.git
cd study-pilot-ai
Copy-Item .env.example .env
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e "apps/api[dev]"
npm install
.\.venv\Scripts\python.exe scripts/dev.py
```

然后打开：

- 学习界面：<http://localhost:3000>
- 后端交互文档：<http://127.0.0.1:8000/docs>

在页面中点击 **Try the original sample / Add sample**，等待处理完成后体验完整学习流程。

`scripts/dev.py` 会启动仅供本地开发使用的 **PGlite + pgvector**、执行数据库迁移，并运行 API、后台处理进程和前端。开发数据库监听 `127.0.0.1:54329`，不要对公网开放。数据保存在 `data/`，重启后保留。

> `npm run dev` 只启动前端，不会启动 API 和数据库。完整项目请使用 `make dev` 或 Python 启动脚本。

## Demo 与真实模型

默认 `AI_PROVIDER=demo`：

- 内置八页神经网络资料是项目原创内容，随 MIT 许可证提供。
- 样例知识点是人工整理的固定内容；问答是确定性的原文摘录，不是大模型生成。
- 自己上传的 PDF 可以解析、阅读和搜索；未配置模型时，不会假装为其生成 AI 知识点和答案。

使用真实模型时，在根目录 `.env` 中设置以下变量，然后重启 API 和 Worker：

```dotenv
AI_PROVIDER=openai
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=填写你自己的服务端密钥
CHAT_MODEL=填写支持JSON输出的聊天模型名称
EMBEDDING_MODEL=填写嵌入模型名称
```

也可使用 `AI_PROVIDER=ollama`，设置 `OLLAMA_BASE_URL` 以及已经在本机安装的聊天和嵌入模型名称。适配器使用 OpenAI 兼容的 `/chat/completions` 和 `/embeddings` 接口；并非所有第三方服务都完整支持这两种接口。

**密钥只放在服务端，不要写入 `NEXT_PUBLIC_*`，不要提交 `.env`。** 使用远程模型时，文档片段与问题会发送到你选择的模型服务。更换嵌入模型后，需要在文档页重新处理 PDF。

## 技术与目录

| 层                  | 技术                                             | 目录                     |
| ------------------- | ------------------------------------------------ | ------------------------ |
| 界面与同源 API 转发 | Next.js、React、TypeScript、Tailwind CSS、PDF.js | `apps/web`               |
| 业务 API 与任务处理 | FastAPI、SQLAlchemy、Pydantic、pypdf             | `apps/api`               |
| 数据与检索          | PostgreSQL / 本地 PGlite、pgvector、Alembic      | `apps/api/migrations`    |
| 本地运行与原创样例  | Python、Node.js、ReportLab                       | `scripts`、`docs/sample` |

## 检查与构建

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
npm run test:pdf
npm run build
npm run test:e2e:api
.venv/bin/python -m ruff check apps/api scripts
.venv/bin/python -m pytest apps/api/tests
```

Windows 将 `.venv/bin/python` 替换为 `.\.venv\Scripts\python.exe`。

启动完整项目后，还可运行 `.venv/bin/python scripts/smoke_test.py`。也可使用 `.venv/bin/python scripts/smoke_test.py --start-services` 自动启动临时测试数据库、API 和 Worker。它只连接本机 API，在新的匿名测试工作区中验证样例处理、引用、计划、闪卡、测验和文档隔离，并删除自己创建的测试文档。

`npm run build` 构建的是前端；构建成功不代表真实 AI、数据库部署与所有用户路径已经验收。当前验证结果见 [验证记录](docs/verification.md)。

### 独立端到端测试

先完成依赖安装和 `npm run build`。`npm run test:e2e:api` 不需要浏览器，会启动生产构建的前端、临时 API、Worker 和独立 PGlite 数据库，测试同源转发、静态资源、上传、引用和工作区隔离。它强制使用 Demo 模式，不连接你的真实模型或正常开发数据库，结束后清理临时测试数据。

浏览器测试需要额外安装 Chromium：

```bash
npx playwright install chromium
npm run test:e2e
```

完整测试分为 `api`、`desktop`、`mobile` 三组；后两组使用 Chromium，手机尺寸是浏览器模拟，不代表 iOS/Safari 真机验收。可用 `npm run test:e2e -- --project=desktop` 单独运行，或 `npm run test:e2e -- --list` 只检查用例收集。浏览器无法启动时测试会明确失败，不会跳过后宣称通过。

报告位于 `apps/web/playwright-report/`；浏览器能运行后，截图和失败跟踪位于 `apps/web/test-results/`。测试默认使用 `127.0.0.1:3310`，不复用已有服务；可通过 `E2E_PORT` 调整端口，或通过 `E2E_PYTHON` 指定已安装后端依赖的 Python。`npm run test:pdf` 只验证 Node 下的 PDF 渲染兼容性，不替代上述浏览器测试。

### 构建后的本地前端

`npm run build` 会把公共资源和编译后的 CSS/JS 复制到 Next.js standalone 目录，随后可用 `npm start` 启动前端。API 与 Worker 仍需单独运行，例如 `.venv/bin/python scripts/dev.py --api-only`；同源代理默认连接 `127.0.0.1:8000`，可用 `API_INTERNAL_URL` 修改。这不是一键生产部署。

PDF.js 的 Worker、字体、CMap 和图像解码资源由安装/构建脚本从锁定依赖复制到 `apps/web/public/`，无需外部 CDN，不要手工修改这些生成文件。前端 CSS 按用途拆分在 `apps/web/src/styles/`，由 `globals.css` 统一引入。

## 部署边界

当前优先提供本地运行流程，**尚未提供经过验证的 Docker Compose 或一键生产部署**。线上运行需要独立的 API、Worker、带 pgvector 的 PostgreSQL、持久化文件存储和 HTTPS 反向代理；只把前端放到 Vercel，并不能运行完整项目。

生产配置会要求 `APP_ENV=production`、长度至少 32 的 `SESSION_SECRET`、`COOKIE_SECURE=true`、明确的 `DATABASE_URL` 和实际域名的 `ALLOWED_ORIGINS`。这些检查不等同于完整的安全加固。

当前采用匿名浏览器 Cookie 工作区，不提供账号找回、多设备同步或多人组织权限。不要直接对公网开放无限制上传；不要用于敏感资料，除非你已经评估存储、模型服务、配额、备份和访问控制。

## 参与开发

欢迎提交复现明确的 Issue 和范围清晰的 Pull Request。开发约定见 [CONTRIBUTING.md](CONTRIBUTING.md)，未完成事项见 [Roadmap](docs/roadmap.md)。不在仓库中上传个人资料、第三方教材全文、API 密钥或验证器信息。

代码、项目原创演示 PDF 和原创 SVG 采用 [MIT](LICENSE)。第三方依赖保留其各自许可证。
