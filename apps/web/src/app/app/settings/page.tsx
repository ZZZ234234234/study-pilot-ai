"use client";
import { useLocale } from "@/components/locale-provider";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import {
  Check,
  Copy,
  KeyRound,
  Server,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { toast } from "sonner";
import {
  Badge,
  ErrorState,
  PageHeading,
  Skeleton,
  Spinner,
} from "@/components/ui";
import { errorMessage, post } from "@/lib/api";
import type { Settings } from "@/lib/types";
import { LanguageSettings } from "@/components/language-settings";
function Configuration({ settings }: { settings: Settings }) {
  const { t } = useLocale();
  const [provider, setProvider] = useState(settings.provider);
  const [base, setBase] = useState(settings.base_url);
  const [chat, setChat] = useState(settings.chat_model);
  const [embedding, setEmbedding] = useState(settings.embedding_model);
  const [busy, setBusy] = useState(false);
  const snippet = `AI_PROVIDER=${provider}\n${provider === "ollama" ? "OLLAMA_BASE_URL" : "AI_BASE_URL"}=${base}\nCHAT_MODEL=${chat}\nEMBEDDING_MODEL=${embedding}\n# ${t("在服务端私密设置 AI_API_KEY，不要提交到 Git。")}\n# ${t("重启 API 和后台任务进程，然后重新处理已有文档。")}`;
  async function test() {
    setBusy(true);
    try {
      const result = await post<{
        message: string;
      }>("/settings/test");
      toast.success(t(result.message));
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  function choose(value: Settings["provider"]) {
    setProvider(value);
    if (value === "ollama") {
      setBase("http://localhost:11434/v1");
      setChat("llama3.2");
      setEmbedding("nomic-embed-text");
    } else if (value === "openai") {
      setBase("https://api.openai.com/v1");
      setChat("gpt-4o-mini");
      setEmbedding("text-embedding-3-small");
    }
  }
  return (
    <>
      <div className="settings-status">
        <span className="settings-icon">
          <Server size={24} />
        </span>
        <div>
          <h2>{t("当前模型连接")}</h2>
          <p>
            {settings.provider === "demo"
              ? t("演示模式 · 不调用外部 AI")
              : `${settings.provider === "ollama" ? t("Ollama 本地模型") : t("OpenAI 兼容服务")} · ${settings.chat_model}`}
          </p>
        </div>
        <Badge tone={settings.mode === "live" ? "green" : "amber"}>
          {settings.mode === "live" ? t("真实模型配置") : t("演示模式")}
        </Badge>
        <button
          className="button secondary small"
          disabled={busy}
          onClick={test}
        >
          {busy ? <Spinner /> : t("测试当前连接")}
        </button>
      </div>
      <div className="settings-grid">
        <section className="panel settings-form">
          <p className="eyebrow">{t("模型服务配置")}</p>
          <h2>{t("选择适合自己的模型。")}</h2>
          <p className="muted">
            {t(
              "在这里生成服务端配置。页面上的选择不会直接切换正在使用的模型，需将配置应用到服务端并重启。",
            )}
          </p>
          <div className="provider-options">
            {(["demo", "openai", "ollama"] as const).map((p) => (
              <button
                key={p}
                onClick={() => choose(p)}
                className={provider === p ? "selected" : ""}
              >
                {p === "openai"
                  ? t("OpenAI 兼容服务")
                  : p === "ollama"
                    ? t("Ollama · 本地模型")
                    : t("演示模式")}
                {provider === p && <Check size={14} />}
              </button>
            ))}
          </div>
          <p className="form-note">
            {t(
              "“嵌入模型”负责查找相关原文，“对话模型”负责生成回答，两者都需要正确配置。这里只生成配置片段，不会保存密钥或直接切换服务。",
            )}
          </p>
          <label className="field">
            {t("服务接口地址（Base URL）")}
            <input
              value={base}
              onChange={(e) => setBase(e.target.value)}
              type="url"
            />
          </label>
          <div className="form-grid">
            <label className="field">
              {t("对话模型名称")}
              <input value={chat} onChange={(e) => setChat(e.target.value)} />
            </label>
            <label className="field">
              {t("嵌入模型名称")}
              <input
                value={embedding}
                onChange={(e) => setEmbedding(e.target.value)}
              />
            </label>
          </div>
          <div className="key-note">
            <KeyRound size={20} />
            <p>
              <strong>{t("密钥，只保存在服务端。")}</strong>
              <br />
              {t(
                "当前由部署者管理密钥。请在服务端环境中设置 AI_API_KEY，不要写入 NEXT_PUBLIC 变量，也不要提交到 Git 仓库。",
              )}
            </p>
          </div>
          <div className="configuration-code">
            <div>
              <Terminal size={15} />
              {t(".env 配置片段")}
              <button
                className="icon-button"
                aria-label={t("复制服务端配置")}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(snippet);
                    toast.success(
                      t(
                        "配置已复制。请应用到服务端，并重启 API 和后台任务进程。",
                      ),
                    );
                  } catch {
                    toast.error(
                      t("暂时无法访问剪贴板，请选中配置内容后手动复制。"),
                    );
                  }
                }}
              >
                <Copy size={16} />
              </button>
            </div>
            <pre>{snippet}</pre>
          </div>
        </section>
        <aside>
          <section className="panel settings-explainer">
            <ShieldCheck size={29} />
            <h3>{t("让数据边界更清楚。")}</h3>
            <p>
              {t(
                "只有服务端可以调用模型。浏览器使用者无法直接修改服务地址、查看密钥，或把文档重定向到其他服务。",
              )}
            </p>
            <ul>
              <li>{t("兼容 OpenAI 的对话与嵌入接口")}</li>
              <li>{t("对话模型需要支持 JSON 输出")}</li>
              <li>{t("Ollama 可在本地运行模型")}</li>
              <li>{t("更换嵌入模型后需重新处理文档")}</li>
            </ul>
            <Link href="/privacy" className="text-button">
              {t("查看数据处理说明 ↗")}
            </Link>
          </section>
          <p className="settings-footnote">
            {t(
              "学习空间绑定当前浏览器的 HttpOnly Cookie，并非可找回的账号。账号登录与跨设备同步尚未提供。",
            )}
          </p>
        </aside>
      </div>
    </>
  );
}
export default function SettingsPage() {
  const { t } = useLocale();
  const { data, error, mutate } = useSWR<Settings>("/settings");
  return (
    <>
      <PageHeading
        eyebrow={t("配置清楚，使用安心")}
        title={t("设置你的学习空间。")}
        description={t("自由选择模型服务，让密钥留在服务端。")}
      />
      <LanguageSettings />
      <Link className="settings-api-link" href="/app/models">
        <KeyRound size={22} />
        <div>
          <strong>{t("API 接入")}</strong>
          <p>{t("主流云端与本地模型：在界面保存密钥与型号，即时生效。")}</p>
        </div>
        <span>↗</span>
      </Link>
      <details className="advanced-provider-settings">
        <summary>{t("高级：原有索引与本地模型配置")}</summary>
        {error ? (
          <ErrorState error={error} retry={() => mutate()} />
        ) : data ? (
          <Configuration settings={data} />
        ) : (
          <Skeleton lines={4} />
        )}
      </details>
    </>
  );
}
