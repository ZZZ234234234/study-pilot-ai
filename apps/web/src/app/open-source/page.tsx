"use client";
import { useLocale } from "@/components/locale-provider";
import Link from "next/link";
import { GitBranch, ArrowUpRight, ArrowLeft } from "lucide-react";
import { Logo, ThemeToggle } from "@/components/ui";
import { GITHUB_URL } from "@/lib/config";
export default function OpenSourcePage() {
  const { t } = useLocale();
  const url = GITHUB_URL;
  return (
    <>
      <header className="landing-nav">
        <Logo />
        <ThemeToggle />
      </header>
      <main id="main-content" className="prose-page">
        <Link href="/" className="back-link">
          <ArrowLeft size={16} />
          {t("首页")}
        </Link>
        <p className="eyebrow">{t("开源项目 / MIT 许可证")}</p>
        <h1>
          {t("源码清晰，")}
          <br />
          {t("也留有继续创造的空间。")}
        </h1>
        <p className="prose-lead">
          {t(
            "StudyPilot AI 是一个开源全栈学习助手，采用 Next.js、FastAPI、PostgreSQL 和 pgvector，可接入你选择的兼容模型服务。",
          )}
        </p>
        {url ? (
          <a className="button primary" href={url}>
            <GitBranch size={18} />
            {t("查看代码仓库")}
            <ArrowUpRight size={17} />
          </a>
        ) : (
          <div className="form-note">
            {t(
              "当前部署尚未配置公开仓库链接。源码已包含在项目中；发布仓库后，可设置 NEXT_PUBLIC_GITHUB_URL。",
            )}
          </div>
        )}
        <section>
          <h2>{t("在自己的电脑上运行")}</h2>
          <pre className="doc-code">{`make install\nmake dev\n# Open http://localhost:3000`}</pre>
          <p>
            {t(
              "快速启动使用仅供开发的 PGlite 和 pgvector。原生 PostgreSQL 部署与 Docker 打包尚待验证。演示模式不会伪装成真实模型。",
            )}
          </p>
        </section>
        <section>
          <h2>{t("连接你选择的模型服务")}</h2>
          <p>
            {t(
              "在服务端设置 AI_PROVIDER、AI_BASE_URL、CHAT_MODEL、EMBEDDING_MODEL，以及保密的 AI_API_KEY。使用本地模型时，设置 AI_PROVIDER=ollama 和 OLLAMA_BASE_URL。修改后重启 API 与后台任务进程；更换嵌入模型后，还需重新处理已有 PDF。",
            )}
          </p>
        </section>
        <section>
          <h2>{t("了解项目结构")}</h2>
          <ul>
            <li>{t("apps/web：支持电脑与手机布局的学习界面")}</li>
            <li>{t("apps/api：PDF 处理、文档权限、检索问答与复习安排")}</li>
            <li>{t("docs：架构说明、验证记录与原创样例")}</li>
            <li>{t("scripts：本地启动、样例生成与检查脚本")}</li>
          </ul>
        </section>
        <section>
          <h2>{t("当前版本能做什么，还缺什么")}</h2>
          <p>
            {t(
              "这是本地优先的开源应用。Windows v1.1.0 通过发布工作流后提供安装包，但真实付费模型质量、全部设备与长期稳定性仍需持续验证。当前不包含扫描件 OCR、可找回账号、跨文档问答或学习小组。引用便于核对原文，但不保证模型解释一定正确；简答题采用可解释的关键词匹配评分。",
            )}
          </p>
        </section>
        <Link className="button secondary" href="/app">
          {t("进入学习空间")}
          <ArrowUpRight size={17} />
        </Link>
      </main>
    </>
  );
}
