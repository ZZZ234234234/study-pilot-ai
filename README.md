<p align="center"><img src="docs/banner.svg" alt="StudyPilot AI — Less collecting. More connecting." width="100%"></p>

# StudyPilot AI

一个以本地运行为优先的开源 AI 学习助手：上传 PDF，将阅读、知识整理、原文问答和复习练习放在同一个工作区。

**默认中文 · 设置中切换 English · 本地 PDF 阅读 · 带出处的问答 · 学习计划与自测**

下载代码、安装依赖并启动后，在自己的浏览器中使用。**不需要购买域名、云服务器或云数据库；本仓库目前不提供公共在线体验服务。** 内置演示不需要 AI 密钥，使用自己的 PDF 生成学习内容则需要自行配置模型。

**当前版本：v0.1 本地开发预览版（Alpha）。** 本地演示与接口工作流已通过自动化验证；真实模型联调、浏览器完整回归及生产部署仍待完成。这是可本地运行、可继续开发的开源项目，不是已经完成生产验收的托管服务。

[快速开始](#快速开始) · [第一次使用](#第一次使用) · [中英文切换](#中英文切换) · [配置真实模型](#demo-与真实模型) · [常见问题](#常见问题) · [验证状态](#当前验证状态) · [MIT 许可证](LICENSE)

## 不止是一个聊天窗口

| 工作环节 | 当前实现                                                                       |
| -------- | ------------------------------------------------------------------------------ |
| 阅读     | PDF 上传、异步处理、分页阅读、文本视图、原文关键词搜索                         |
| 理解     | 章节与知识点树，重要程度、难度、摘录和来源页码；自有 PDF 需要模型              |
| 问答     | pgvector 检索、文档内问答、可跳转的引用；自有 PDF 需要模型，证据不足时明确提示 |
| 复习     | 按时间容量安排学习计划、任务勾选、闪卡与间隔复习                               |
| 自测     | 选择题、判断题、简答题，以及带出处的答题反馈                                   |
| 控制     | 中英文切换、浅色/深色主题、文档管理、服务端模型配置                            |

页面包括产品首页、学习仪表盘、文档库、PDF 学习工作区、复习计划、设置、隐私说明和开源说明。内置样例可以演示阅读、问答、计划、闪卡和测验的完整流程；它使用固定内容，不代表真实模型的生成效果。

## 快速开始

需要 **Node.js 22.13+、Python 3.11+**；以下克隆命令还需要 Git。首次运行需要联网安装依赖。默认使用随启动脚本运行的本地数据库，不必另外安装 PostgreSQL 或 Docker。

没有 Git，也可以在仓库页面点击 **Code → Download ZIP**，解压后在项目根目录打开终端，跳过下面的 `git clone` 和 `cd` 两行。首次安装请保留 `.env.example` 的默认 Demo 配置。

以下安装步骤用于全新目录；已有资料的用户请先看[更新说明](#已经在使用旧版)。

### Windows PowerShell

```powershell
git clone https://github.com/ZZZ234234234/study-pilot-ai.git
cd study-pilot-ai
Copy-Item .env.example .env
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e "apps/api[dev]"
npm ci
.\.venv\Scripts\python.exe scripts/dev.py
```

如果 PowerShell 提示不能运行 `npm.ps1`，将命令中的 `npm` 换成 `npm.cmd`，例如 `npm.cmd ci`，无需为此修改系统执行策略。

### macOS / Linux

```bash
git clone https://github.com/ZZZ234234234/study-pilot-ai.git
cd study-pilot-ai
cp .env.example .env
python3 -m venv .venv
.venv/bin/python -m pip install -e "apps/api[dev]"
npm ci
.venv/bin/python scripts/dev.py
```

已安装 Make 时，也可使用 `make install` 和 `make dev`。

### 启动后访问

- 学习界面：<http://localhost:3000>
- 后端交互文档：<http://127.0.0.1:8000/docs>

等待终端显示服务启动成功，再打开学习界面。**保持这个终端运行**；按 `Ctrl+C` 停止服务。下次使用时只需在项目目录重新运行最后一条 Python 启动命令，不必重新复制配置或安装依赖。

`scripts/dev.py` 会启动仅供本地开发使用的 **PGlite + pgvector**、执行数据库迁移，并运行 API、后台处理进程和前端。开发数据库监听 `127.0.0.1:54329`，不要对公网开放。数据保存在 `data/`，重启后保留。

> `npm run dev` 只启动前端，不会启动 API 和数据库。完整项目请使用上面的 Python 启动脚本或 `make dev`。`localhost` 指当前这台电脑，不能把这个地址发给别人作为在线体验链接；本地开发服务也不应直接暴露到公网。

## 第一次使用

1. 打开学习界面，点击 **体验内置样例 / 添加样例**，等待资料处理完成。
2. 进入 PDF 学习工作区，阅读原文、查看知识点；试着提问“什么是反向传播？”，并点击回答中的引用核对来源。
3. 设置复习目标和可用时间，创建学习计划，再体验闪卡和测验。
4. 到 **设置 → 界面语言** 切换中文或 English；语言设置不需要模型密钥。
5. 上传自己的 PDF，先体验阅读和搜索。如果需要为它整理知识点、问答或生成练习，再按[模型配置说明](#demo-与真实模型)操作。

默认接受 **20 MB 以内、最多 300 页**的未加密 PDF，可在服务端配置中调整。资料需要有可提取的文本；纯扫描件请先进行 OCR，当前项目不包含 OCR。

工作区通过浏览器 Cookie 识别，而不是可找回的登录账号。请固定使用同一个浏览器和地址，不要在 `localhost` 与 `127.0.0.1` 之间来回切换。清除 Cookie、更换浏览器或会话过期后，可能无法访问原工作区；这不表示磁盘上的资料自动删除。

## 中英文切换

**界面默认简体中文，在「设置 → 界面语言」中可切换 English，也可随时切回中文。** 导航、按钮、日期、状态、操作提示和常见错误跟随语言切换；中文输入法选字时按回车不会误发问题。

语言选择保存在当前浏览器，刷新后继续使用；若浏览器禁止本地存储，当前访问仍可切换，但下次打开可能恢复中文。不依赖浏览器或系统语言，也不需要配置 AI。切换不刷新页面、不重新处理文档，也不清空学习记录。偏好逻辑和双语静态渲染已通过测试，实际浏览器交互仍待完整回归。

文档原文、引用和已有学习记录不会被自动翻译；这项设置选择的是**界面语言**，不是全文翻译。品牌名称、模型名称、配置变量及必要的技术术语保留原样。

## 更新与数据保留

### 已经在使用旧版？

如果最初通过 `git clone` 下载，先在运行窗口按 `Ctrl+C` 停止服务，备份自己的 `.env` 和整个 `data/` 文件夹，然后在项目目录执行 `git pull --ff-only`。依赖变更时，重新运行 `npm ci` 和对应系统的 Python 依赖安装命令，再按原方式启动项目。若有本地代码修改导致更新被拒绝，先保留修改，不要使用强制覆盖命令。

如果最初下载的是 ZIP，请将新版解压到新文件夹，不要直接覆盖旧目录。保留旧目录的 `.env`、`data/` 和浏览器资料；按上面的安装步骤准备新版，在服务停止时迁移自己的配置与数据，确认新版正常后再考虑处理旧目录。自定义 `DATA_DIR`、数据库地址或存储路径的部署需继续使用原配置。本次中文化没有修改数据库结构，也不会清空已有资料。

更新源代码不会自动更新已经运行的进程。开发方式需要重启；使用生产构建时还需要重新运行 `npm run build`。Windows PowerShell 若拦截 npm 脚本，可用 `npm.cmd` 代替 `npm`。

## Demo 与真实模型

项目不附带共享 API 密钥或免费模型额度。你可以先用 Demo 了解流程，再自行选择是否配置真实模型；模型费用和本机运行资源由使用者承担。

默认 `AI_PROVIDER=demo`：

- 内置八页神经网络资料是项目原创的**英文样例**，随 MIT 许可证提供。
- 样例知识点是人工整理的固定英文内容；问答是确定性的原文摘录，不是大模型生成。常见中文概念（例如“卷积”“反向传播”“验证集”）有固定的英文关键词映射，方便中文提问；这不是通用翻译或语义理解，引用仍保留英文原文。
- 自己上传的 PDF 可以解析、阅读和搜索；未配置模型时，不会假装为其生成 AI 知识点和答案。

上传页提示“原文已就绪，AI 功能还差一步”时，表示 PDF 已可阅读，但当前模式不能为上传资料调用真实 AI。进入 **模型设置**，按中文说明配置服务端模型、重启 API 和 Worker，再点击文档页的 **重新处理文档**。设置页中的配置示例不会自动写入服务端，也不会代替购买或配置模型服务。

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

真实模型的提示词要求新生成的知识点和测验使用简体中文，问答跟随提问语言；引用必须保持原文，不能将译文冒充出处。这是生成要求，实际输出仍需与所选模型联调核验；已有英文内容不会因更新界面而重写。

## 技术与目录

| 层                  | 技术                                             | 目录                     |
| ------------------- | ------------------------------------------------ | ------------------------ |
| 界面与同源 API 转发 | Next.js、React、TypeScript、Tailwind CSS、PDF.js | `apps/web`               |
| 业务 API 与任务处理 | FastAPI、SQLAlchemy、Pydantic、pypdf             | `apps/api`               |
| 数据与检索          | PostgreSQL / 本地 PGlite、pgvector、Alembic      | `apps/api/migrations`    |
| 本地运行与原创样例  | Python、Node.js、ReportLab                       | `scripts`、`docs/sample` |

详细设计见[项目架构](docs/architecture.md)。

## 当前验证状态

截至 **2026-09-02**，当前代码快照在项目工作环境中完成以下检查：

| 验证范围                   | 结果                                                 |
| -------------------------- | ---------------------------------------------------- |
| 前端单元测试与双语静态渲染 | 36 项通过                                            |
| 后端单元测试               | 21 项通过                                            |
| 接口端到端测试             | 16 项通过，使用生产前端构建和独立临时服务            |
| 代码与构建                 | TypeScript、Lint、格式检查和前端生产构建通过         |
| 本地工作流                 | 样例处理、问答引用、计划、闪卡、测验和工作区隔离通过 |
| PDF 渲染兼容性             | 原创样例 8 页在 Node canvas 下通过，非浏览器验收     |

**合计 73 项自动测试通过，不包含浏览器 UI 测试。** 浏览器端的实际点击、刷新保留、移动端布局，以及真实聊天/嵌入模型调用，仍需进一步验证。Windows/macOS 的全新安装和生产部署也尚未完成环境验收；上方启动命令不代表这些平台已经全部实测。完整范围与限制见[验证记录](docs/verification.md)。

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

## 常见问题

### 需要买域名或服务器吗？

不需要。本项目以本地使用和自行部署为主，下载源码并在自己的电脑上运行即可。GitHub 用于分发代码和说明，不会自动运行这里的前后端服务。只有希望提供公共在线访问时，才需要另行规划托管、存储和访问控制；域名是可选的访问地址，不是本地使用的前提。

### 为什么页面打开了，但上传或学习功能不可用？

先确认启动的是完整项目，而不只是 `npm run dev`。API、数据库和后台处理进程都需要运行。查看启动终端中的错误，并确认 `.env` 没有把本地数据库地址或端口改成不可用的配置。

### 为什么上传成功后还提示配置 AI？

默认 Demo 只为内置样例提供固定学习内容。自己的 PDF 可以阅读和搜索，但 AI 知识点、问答和练习需要真实模型。修改 `.env` 后重启完整项目，再到文档页点击 **重新处理文档**；只在设置页查看配置示例不会自动完成服务端配置。

### 切成中文后，为什么样例还是英文？

中英文切换只改变界面。内置 PDF 及其固定知识点是英文资料，原文和引用不会自动翻译。新生成内容的语言要求见[模型配置说明](#demo-与真实模型)。

### 文件和密钥会上传到哪里？

默认本地配置把文档和学习数据保存在 `data/`，密钥放在本机 `.env`；不要把它们提交到 GitHub。启用远程模型后，处理所需的文档片段和问题会发往你指定的模型服务。本地运行不等于开启远程 AI 后仍完全离线，使用敏感资料前请阅读[安全边界](SECURITY.md)。

## 可选：自行部署

**这一节不是本地运行的必需步骤。** 当前优先提供本地运行流程，尚未提供经过验证的 Docker Compose 或一键生产部署。线上运行需要独立的 API、Worker、带 pgvector 的 PostgreSQL、持久化文件存储和 HTTPS 反向代理；仅使用 GitHub Pages 或只把前端放到 Vercel，都不能运行完整项目。

生产配置会要求 `APP_ENV=production`、长度至少 32 的 `SESSION_SECRET`、`COOKIE_SECURE=true`、明确的 `DATABASE_URL` 和实际域名的 `ALLOWED_ORIGINS`。这些检查不等同于完整的安全加固。

当前采用匿名浏览器 Cookie 工作区，不提供账号找回、多设备同步或多人组织权限。不要直接对公网开放无限制上传；不要用于敏感资料，除非你已经评估存储、模型服务、配额、备份和访问控制。

## 参与开发

欢迎提交复现明确的 Issue 和范围清晰的 Pull Request。开发约定见 [CONTRIBUTING.md](CONTRIBUTING.md)，未完成事项见 [Roadmap](docs/roadmap.md)。不在仓库中上传个人资料、第三方教材全文、API 密钥或验证器信息。

代码、项目原创演示 PDF 和原创 SVG 采用 [MIT](LICENSE)。第三方依赖保留其各自许可证。
