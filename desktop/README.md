# StudyPilot AI Windows 桌面版

当前为 **1.0.0 候选构建配置**，不是已完成验证的正式安装包。Windows 构建、实际安装与启动检查通过后，才可发布 GitHub `v1.0.0` Release。

## 设计

- Electron 窗口内运行现有界面，不需要用户安装 Node 或 Python。
- 打包 Next.js standalone、PyInstaller Python 后端及 PDF worker、本地 PGlite 数据库。
- NSIS 安装器创建桌面快捷方式，支持选择安装目录。
- 学习资料放在 Electron 用户数据目录的 `data` 下，不写入安装目录；卸载默认保留资料。
- 默认中文，在现有设置中切换英文；DeepSeek、智谱通过现有模型设置接入。
- AI 使用自己的 API Key，需要联网且可能产生服务商费用。数据库内的 API Key 尚未进行系统凭据加密，不应把数据目录分享给他人。
- 桌面版与原浏览器版是不同的本地工作空间，不会自动导入旧浏览器资料。
- 数据库和服务仅监听本机回环地址，不能将端口转发到公网；此模式不用于多用户服务器。

## Windows 构建

构建机需要 Node 24、Python 3.12。完整步骤见 `.github/workflows/desktop.yml`。该工作流只生成候选安装包，不自动把未验收构建标记为正式发布。

`desktop/prepare.mjs` 只复制发布资源，排除开发数据和配置文件。先构建网页和冻结后端，再执行 `npm ci --prefix desktop`、`npm run pack --prefix desktop`。

输出：`desktop/release/StudyPilot-AI-1.0.0-Windows-x64-Setup.exe`。

## 正式发布验收

在没有 Node/Python 的 Windows 电脑检查安装、首次启动、重复启动、上传 PDF、重启后数据保留、DeepSeek/智谱配置与问答、翻译、文件导出、退出后后台进程释放、覆盖安装及卸载。需要特别检查中文用户名及带空格路径。

目前没有代码签名证书；未签名安装包可能触发 Windows 安全提示。不要关闭系统安全防护。通过测试后应附 SHA-256 校验值与已知限制，再上传到 GitHub Releases，而不是把二进制安装包提交到源码目录。
