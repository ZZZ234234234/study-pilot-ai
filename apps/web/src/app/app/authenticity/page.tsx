"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Copy,
  Fingerprint,
  GitBranch,
  Mail,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "@/components/locale-provider";
import { Badge, PageHeading } from "@/components/ui";
import {
  ATTESTATION_COMMAND,
  BUILD_COMMIT,
  BUILD_VERSION,
  CHECKSUM_COMMAND,
  INSTALLER_NAME,
  OFFICIAL_REPOSITORY,
  RELEASES_URL,
  isOfficialWorkflowBuild,
} from "@/lib/build-info";

function shortCommit(value: string) {
  return value ? value.slice(0, 12) : "local-source";
}

export default function AuthenticityPage() {
  const { t } = useLocale();

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t("核验命令已复制。"));
    } catch {
      toast.error(t("暂时无法访问剪贴板，请手动复制命令。"));
    }
  }

  return (
    <>
      <PageHeading
        eyebrow={t("OFFICIAL BUILD / RIGHTS")}
        title={t("确认来源，也尊重创作。")}
        description={t("在这里核对官方版本、安装包来源和开源使用边界。")}
      >
        <Badge tone={isOfficialWorkflowBuild ? "green" : "amber"}>
          {isOfficialWorkflowBuild ? t("GitHub 正式构建") : t("本地源码构建")}
        </Badge>
      </PageHeading>

      <section className="panel authenticity-hero">
        <span className="authenticity-seal" aria-hidden="true">
          <ShieldCheck size={35} strokeWidth={1.5} />
        </span>
        <div className="authenticity-intro">
          <p className="eyebrow">{t("官方发布身份")}</p>
          <h2>StudyPilot AI</h2>
          <p>{t("由嘉兴大学通信专业学生“爱吃孜然芥末”独立制作。")}</p>
          <small>{t("该身份说明不代表嘉兴大学官方开发、授权或背书。")}</small>
        </div>
        <dl className="authenticity-meta">
          <div>
            <dt>{t("版本")}</dt>
            <dd>v{BUILD_VERSION}</dd>
          </div>
          <div>
            <dt>{t("构建标识")}</dt>
            <dd title={BUILD_COMMIT || t("本地源码构建")}>
              {shortCommit(BUILD_COMMIT)}
            </dd>
          </div>
          <div>
            <dt>{t("官方仓库")}</dt>
            <dd>ZZZ234234234</dd>
          </div>
        </dl>
      </section>

      <div className="authenticity-grid">
        <section className="panel authenticity-panel">
          <div className="authenticity-panel-heading">
            <Fingerprint size={23} />
            <div>
              <p className="eyebrow">{t("三重核验")}</p>
              <h2>{t("确认安装包来自官方发布。")}</h2>
            </div>
          </div>
          <ol className="verification-steps">
            <li>
              <span>01</span>
              <div>
                <strong>{t("只从官方仓库下载")}</strong>
                <p>
                  {t(
                    "正式安装包只在下方 GitHub Releases 页面发布，源码 ZIP 不是安装包。",
                  )}
                </p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>{t("核对 SHA-256")}</strong>
                <p>
                  {t(
                    "计算安装包指纹，并与同一发布页中的 SHA256SUMS.txt 对照。",
                  )}
                </p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <strong>{t("验证 GitHub 构建证明")}</strong>
                <p>
                  {t(
                    "构建证明把安装包与官方仓库、提交记录和发布工作流绑定；验证失败时不要安装。",
                  )}
                </p>
              </div>
            </li>
          </ol>
          <div className="authenticity-actions">
            <a
              className="button primary"
              href={RELEASES_URL}
              target="_blank"
              rel="noreferrer"
            >
              {t("打开官方发布页")}
              <ArrowUpRight size={17} />
            </a>
            <a
              className="button secondary"
              href={OFFICIAL_REPOSITORY}
              target="_blank"
              rel="noreferrer"
            >
              <GitBranch size={17} />
              {t("查看官方仓库")}
            </a>
          </div>
        </section>

        <aside className="panel authenticity-panel verification-commands">
          <p className="eyebrow">{t("WINDOWS 核验命令")}</p>
          <h2>{t("复制后在安装包目录运行。")}</h2>
          <p className="muted">
            {t("当前正式安装包文件名：{0}", INSTALLER_NAME)}
          </p>
          {[
            [t("文件指纹"), CHECKSUM_COMMAND],
            [t("官方构建证明"), ATTESTATION_COMMAND],
          ].map(([label, command]) => (
            <div className="verification-command" key={command}>
              <span>{label}</span>
              <code>{command}</code>
              <button
                type="button"
                className="icon-button"
                aria-label={t("复制：{0}", label)}
                onClick={() => copy(command)}
              >
                <Copy size={16} />
              </button>
            </div>
          ))}
          <div className="verification-note">
            <Check size={17} />
            <p>
              {t(
                "页面中的版本信息方便定位构建，最终真伪以 GitHub 构建证明和文件指纹核验结果为准。",
              )}
            </p>
          </div>
        </aside>
      </div>

      <section className="panel rights-panel">
        <div className="authenticity-panel-heading">
          <Scale size={24} />
          <div>
            <p className="eyebrow">{t("开源许可与维权说明")}</p>
            <h2>{t("开放代码，不等于可以冒充官方。")}</h2>
          </div>
        </div>
        <div className="rights-grid">
          <div>
            <strong>{t("MIT 允许的使用")}</strong>
            <p>
              {t(
                "任何人可以在保留原版权声明和 MIT 许可文本的前提下使用、修改、分发或销售本项目代码。",
              )}
            </p>
          </div>
          <div>
            <strong>{t("不得伪造的身份")}</strong>
            <p>
              {t(
                "未经书面许可，不得使用 StudyPilot AI 名称、Logo、作者署名或“官方版本”标识，使公众误认为第三方版本由原作者发布、授权或背书。",
              )}
            </p>
          </div>
        </div>
        <div className="rights-action">
          <div>
            <strong>{t("发现疑似仿冒、删署名或伪造官方安装包？")}</strong>
            <p>
              {t(
                "请保留页面链接、账号名称、截图、文件及发现时间。作者将视情况通过平台投诉、侵权通知或其他合法途径维护权益。",
              )}
            </p>
          </div>
          <a href="mailto:2014546082@qq.com" className="button secondary">
            <Mail size={17} />
            2014546082@qq.com
          </a>
        </div>
        <p className="rights-footnote">
          {t(
            "完整条款以仓库中的 LICENSE 与 TRADEMARKS.md 为准。本说明用于界定项目许可和官方身份，不构成针对个案的法律意见。",
          )}
        </p>
      </section>

      <Link href="/app" className="text-button authenticity-back">
        {t("返回学习空间")}
        <ArrowUpRight size={15} />
      </Link>
    </>
  );
}
