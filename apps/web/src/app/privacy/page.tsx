"use client";
import { useLocale } from "@/components/locale-provider";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Logo, ThemeToggle } from "@/components/ui";
export default function PrivacyPage() {
  const { t } = useLocale();
  return (
    <>
      <header className="landing-nav">
        <Logo />
        <ThemeToggle />
      </header>
      <main id="main-content" className="prose-page">
        <Link href="/app" className="back-link">
          <ArrowLeft size={16} />
          {t("学习空间")}
        </Link>
        <p className="eyebrow">{t("隐私说明 / 把规则说清楚")}</p>
        <h1>
          {t("你的知识，")}
          <br />
          {t("你的数据边界。")}
        </h1>
        <p className="prose-lead">
          {t(
            "StudyPilot 支持自行部署。部署者决定文件存放在哪里，以及由哪个模型服务接收相关文本。",
          )}
        </p>
        <div className="privacy-callout">
          <ShieldCheck size={25} />
          <p>{t("不接入广告追踪和统计 SDK，不把 API 密钥发送到浏览器。")}</p>
        </div>
        <section>
          <h2>{t("会保存哪些数据？")}</h2>
          <p>
            {t(
              "PDF 以自动生成的编号保存到服务端 DATA_DIR/uploads 目录。数据库保存提取的页面、文本片段、向量、知识点、问答、引用、计划、闪卡和练习记录。正式部署时，数据库与上传目录都需要持久化保存。",
            )}
          </p>
        </section>
        <section>
          <h2>{t("谁可以访问这些数据？")}</h2>
          <p>
            {t(
              "系统通过签名的 HttpOnly Cookie 识别个人学习空间，并检查文档归属。部署管理员可以访问底层数据库与文件。当前版本不是加密保险箱，也不支持账号找回和跨设备登录；清除 Cookie 后，将无法再访问原学习空间。",
            )}
          </p>
        </section>
        <section>
          <h2>{t("什么时候会把文本发送给模型服务？")}</h2>
          <p>
            {t(
              "演示模式不调用外部 AI。启用真实模型后，文本片段会发送给嵌入服务，问题与检索到的片段会发送给对话模型；提取知识点时，会分批处理全文片段。Ollama 可以在本地运行，让模型输入留在自己的设备或服务器内。使用第三方服务时，还应了解其数据政策。",
            )}
          </p>
        </section>
        <section>
          <h2>{t("删除 PDF 后，相关记录会怎样？")}</h2>
          <p>
            {t(
              "删除操作会移除原始 PDF，以及关联的页面、片段、向量、知识点、问答、引用、计划、闪卡和测验记录。部署者的备份可能保留旧副本，直到备份保留期结束。此操作无法撤销。",
            )}
          </p>
        </section>
        <section>
          <h2>{t("部署者需要配置什么？")}</h2>
          <p>
            {t(
              "请配置 HTTPS、足够强的 SESSION_SECRET、安全 Cookie、明确的 ALLOWED_ORIGINS、私有数据库访问、入口权限控制、加密存储、使用额度和备份策略。PDF 解析虽有大小与页数限制，但不是经过加固的恶意文件沙箱。当前版本不适合直接作为无限制公开的多租户服务。",
            )}
          </p>
        </section>
        <section>
          <h2>{t("AI 的回答可靠吗？")}</h2>
          <p>
            {t(
              "PDF 内容仅作为参考资料，不作为指令执行。检索限定在当前文档内，引用来源也会经过校验。这些措施能够降低风险，但不能保证模型理解正确。重要结论仍需对照原文核实。",
            )}
          </p>
        </section>
        <Link href="/app" className="button primary">
          {t("返回学习空间")}
        </Link>
      </main>
    </>
  );
}
