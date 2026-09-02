"use client";
import { useLocale } from "@/components/locale-provider";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  GitBranch,
  ListTree,
  LockKeyhole,
  ScanText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Logo, ThemeToggle } from "@/components/ui";
import { DemoButton } from "@/components/demo-button";
import { ProductPreview } from "@/components/product-preview";
import { GITHUB_URL } from "@/lib/config";
const github = GITHUB_URL;
export default function Landing() {
  const { t } = useLocale();
  return (
    <div className="landing">
      <header className="landing-nav">
        <Logo />
        <nav aria-label={t("网站导航")}>
          <a href="#features">{t("功能介绍")}</a>
          <a href="#how-it-works">{t("如何使用")}</a>
          <Link href="/open-source">{t("开源说明")}</Link>
        </nav>
        <div>
          <ThemeToggle />
          <Link href="/app" className="button small primary">
            {t("开始学习")}
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </header>
      <main id="main-content">
        <section className="hero">
          <div className="hero-eyebrow">
            <span />
            {t("开源，让知识更自由。")}
          </div>
          <h1>
            {t("把资料读懂，")}
            <br />
            <span>{t("把知识留下。")}</span>
          </h1>
          <p>
            {t("阅读，不止于翻过最后一页。")}
            <br />
            {t(
              "从梳理知识到循序复习，在一个安静的空间里，把重要的内容真正学会。",
            )}
          </p>
          <div className="hero-actions">
            <Link href="/app" className="button primary">
              {t("开始学习")}
              <ArrowRight size={18} />
            </Link>
            <a href={github} className="button secondary">
              <GitBranch size={17} />
              {t("查看 GitHub 源码")}
              <ArrowUpRight size={16} />
            </a>
          </div>
          <div className="hero-footnote">
            <span>{t("阅读。")}</span>
            {t("理解。复习。提问。")}
            <span className="hero-dot">·</span>
            {t("体验内置样例，无需 AI 密钥。")}
          </div>
          <div className="hero-preview">
            <div className="preview-floating-note">
              <span>{t("少一点来回翻找")}</span>
              <strong>{t("多一点真正理解。")}</strong>
              <svg
                width="65"
                height="35"
                viewBox="0 0 65 35"
                aria-hidden="true"
              >
                <path
                  d="M2 2Q50 0 57 27M49 20l8 10 6-12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
            <ProductPreview />
          </div>
        </section>
        <section className="principles-strip">
          <span>{t("让每一次好奇，都有迹可循。")}</span>
          <div>
            <BookOpen size={17} />
            {t("原文可查")}
          </div>
          <div>
            <ListTree size={17} />
            {t("知识成体系")}
          </div>
          <div>
            <ShieldCheck size={17} />
            {t("数据由你掌握")}
          </div>
        </section>
        <section className="landing-section" id="features">
          <div className="section-intro">
            <p className="eyebrow">{t("01 / 更从容地学习")}</p>
            <h2>
              {t("不只是一个聊天窗口。")}
              <br />
              {t("而是一套学习路径。")}
            </h2>
            <p>{t("阅读只是开始。让知识有条理，也让每一次复习都有方向。")}</p>
          </div>
          <div className="feature-grid">
            <article className="feature-large">
              <div className="feature-icon">
                <ListTree />
              </div>
              <h3>{t("把零散内容，连成知识地图。")}</h3>
              <p>
                {t(
                  "按章节梳理概念，标记重点与难度。每个知识点，都能回到原文核对。",
                )}
              </p>
              <div className="feature-tree">
                <span>{t("神经网络")}</span>
                <div>
                  <span>{t("训练神经网络")}</span>
                  <div>
                    <b>{t("损失函数与梯度下降")}</b>
                    <b>
                      {t("反向传播")}
                      <small>{t("第 3 页")}</small>
                    </b>
                  </div>
                </div>
              </div>
              <span className="feature-index">{t("01 / 梳理知识点")}</span>
            </article>
            <article>
              <div className="feature-icon">
                <ScanText />
              </div>
              <h3>{t("回答有出处，理解有依据。")}</h3>
              <p>
                {t(
                  "带着问题阅读，沿着引用找到对应页。资料里没有依据时，助手会明确告诉你。",
                )}
              </p>
              <div className="source-demo">
                <span>
                  {t(
                    "“权重共享让同一组特征检测器在不同位置发挥作用。”（样例原文译意）",
                  )}
                </span>
                <small>
                  {t("神经网络入门")}
                  <b>{t("↗ 第 4 页")}</b>
                </small>
              </div>
              <span className="feature-index">
                {t("02 / 带原文引用的问答")}
              </span>
            </article>
            <article>
              <div className="feature-icon">
                <Sparkles />
              </div>
              <h3>{t("不只学过，更能记住。")}</h3>
              <p>
                {t(
                  "用可执行的计划、知识闪卡和间隔复习，把学习拆成每天能完成的一小步。",
                )}
              </p>
              <div className="mini-week">
                {[
                  t("一"),
                  t("二"),
                  t("三"),
                  t("四"),
                  t("五"),
                  t("六"),
                  t("日"),
                ].map((d, i) => (
                  <div key={i}>
                    <span>{d}</span>
                    <b className={i < 4 ? "done" : ""}>
                      {i < 3 ? "✓" : i === 3 ? "4" : i + 1}
                    </b>
                  </div>
                ))}
              </div>
              <span className="feature-index">{t("03 / 规划与复习")}</span>
            </article>
          </div>
        </section>
        <section className="workflow-section" id="how-it-works">
          <div>
            <p className="eyebrow">{t("02 / 从资料到理解")}</p>
            <h2>
              {t("从一份资料，")}
              <br />
              {t("走向清晰的学习路径。")}
            </h2>
          </div>
          <div className="workflow-steps">
            {[
              [
                "01",
                t("上传"),
                t("上传 PDF，保留原始页面，让后续理解始终有据可查。"),
              ],
              [
                "02",
                t("理解"),
                t("顺着知识地图梳理章节、概念和它们之间的联系。"),
              ],
              [
                "03",
                t("复习"),
                t("按自己的节奏安排练习，在合适的时候再回顾一次。"),
              ],
              [
                "04",
                t("提问"),
                t("提出疑问，从原文中寻找答案和支持它的依据。"),
              ],
            ].map(([n, t, d]) => (
              <div key={n}>
                <span>{n}</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="landing-section privacy-section">
          <div className="privacy-visual">
            <LockKeyhole size={48} strokeWidth={1} />
            <span>
              {t("你的知识。")}
              <br />
              <strong>{t("你的数据边界。")}</strong>
            </span>
            <div>
              <i />
              {t("支持自行部署")}
              <i />
              {t("可连接本地模型")}
            </div>
          </div>
          <div>
            <p className="eyebrow">{t("03 / 清楚知道数据去向")}</p>
            <h2>
              {t("自己的学习资料，")}
              <br />
              {t("数据去向也该清清楚楚。")}
            </h2>
            <p>
              {t(
                "你可以自行部署，连接 OpenAI 兼容服务，或通过 Ollama 使用本地模型。密钥只保存在服务端；删除文档时，相关学习记录也会一并删除。",
              )}
            </p>
            <Link href="/privacy" className="text-button">
              {t("了解数据如何处理")}
              <ArrowUpRight size={17} />
            </Link>
          </div>
        </section>
        <section className="open-source-section">
          <p className="eyebrow">{t("开源，也属于你")}</p>
          <h2>
            {t("打开源码，")}
            <br />
            {t("搭建自己的学习空间。")}
          </h2>
          <p>
            Next.js · FastAPI · PostgreSQL · pgvector
            <br />
            {t("采用 MIT 许可证，不绑定模型，不虚构使用数据。")}
          </p>
          <div>
            <a className="button secondary" href={github}>
              <GitBranch size={18} />
              {t("查看项目源码")}
              <ArrowUpRight size={16} />
            </a>
            <DemoButton>{t("体验内置样例")}</DemoButton>
          </div>
        </section>
        <section className="landing-cta">
          <span>{t("让读过的内容，真正成为你的知识。")}</span>
          <Link href="/app" className="button primary">
            {t("开始学习")}
            <ArrowRight size={18} />
          </Link>
        </section>
      </main>
      <footer className="landing-footer">
        <Logo />
        <span>{t("少一点收藏，多一点理解。")}</span>
        <div>
          <Link href="/privacy">{t("隐私与数据")}</Link>
          <Link href="/open-source">{t("使用文档")}</Link>
          <span>© 2026 StudyPilot AI</span>
        </div>
      </footer>
    </div>
  );
}
