# StudyPilot AI Windows 桌面版

桌面版版本号为 **1.1.0**。Windows 构建、实际安装与启动检查通过后，发布流程才会创建 GitHub `v1.1.0` Release；源码存在不代表安装包已经发布，请以 Releases 附件为准。

## 设计

- Electron 窗口内运行现有界面，不需要用户安装 Node 或 Python。
- 打包 Next.js standalone、PyInstaller Python 后端及 PDF worker、本地 PGlite 数据库。
- NSIS 安装器创建桌面快捷方式，支持选择安装目录。
- 学习资料放在 Electron 用户数据目录的 `data` 下，不写入安装目录；卸载默认保留资料。
- 默认中文，在现有设置中切换英文；19 类主流云端、聚合平台与本地模型通过现有 API 接入界面配置。
- AI 使用自己的 API Key，需要联网且可能产生服务商费用。数据库内的 API Key 尚未进行系统凭据加密，不应把数据目录分享给他人。
- 桌面版与原浏览器版是不同的本地工作空间，不会自动导入旧浏览器资料。
- 数据库和服务仅监听本机回环地址，不能将端口转发到公网；此模式不用于多用户服务器。

## Windows 构建

构建机需要 Node 24、Python 3.12。完整步骤见 `.github/workflows/desktop.yml`。普通提交只生成候选安装包；提交消息包含 `[release v1.1.0]` 时，只有全部检查通过才会创建正式 Release，不覆盖已有版本。

`desktop/prepare.mjs` 只复制发布资源，排除开发数据和配置文件。先构建网页和冻结后端，再执行 `npm ci --prefix desktop`、`npm run pack --prefix desktop`。

输出：`desktop/release/StudyPilot-AI-1.1.0-Windows-x64-Setup.exe`。

## 正式发布验收

在没有 Node/Python 的 Windows 电脑检查安装、首次启动、重复启动、上传 PDF、重启后数据保留、模型连接配置与问答、翻译、文件导出、退出后后台进程释放、覆盖安装及卸载。需要特别检查中文用户名及带空格路径。自动化不会使用真实服务商密钥；各服务的账号权限、收费与真实回答质量仍需用户自行小额验证。

目前没有代码签名证书；未签名安装包可能触发 Windows 安全提示。不要关闭系统安全防护。发布流程会附 SHA-256 校验值，并使用 GitHub Artifact Attestations 为安装包生成可验证的构建来源证明；二进制安装包不提交到源码目录。
