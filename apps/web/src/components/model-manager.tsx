"use client";
import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import {
  Cable,
  Check,
  Plus,
  ShieldCheck,
  ArrowUpRight,
  Pencil,
  Trash2,
} from "lucide-react";
import { api, errorMessage, patch, post } from "@/lib/api";
import type { AIProfile, AIProfiles } from "@/lib/types";
import { useLocale } from "./locale-provider";
import { ErrorState, Modal, Skeleton, Spinner } from "./ui";

type Draft = {
  name: string;
  provider: AIProfile["provider"];
  base_url: string;
  model: string;
  api_key: string;
};
const blank: Draft = {
  name: "",
  provider: "deepseek",
  base_url: "https://api.deepseek.com/v1",
  model: "",
  api_key: "",
};

export function ModelManager() {
  const { t } = useLocale();
  const { data, error, mutate } = useSWR<AIProfiles>("/ai/profiles");
  const { mutate: refresh } = useSWRConfig();
  const [editing, setEditing] = useState<AIProfile | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(blank);
  const [models, setModels] = useState<string[]>([]);
  const [source, setSource] = useState("reference");
  const [busy, setBusy] = useState("");
  const [failure, setFailure] = useState("");
  const [notice, setNotice] = useState("");
  const [testConsent, setTestConsent] = useState(false);
  const [remove, setRemove] = useState<AIProfile | null>(null);
  const existing = editing && editing !== "new" ? editing : null;

  function open(profile: AIProfile | "new") {
    setEditing(profile);
    setDraft(
      profile === "new"
        ? blank
        : {
            name: profile.name,
            provider: profile.provider,
            base_url: profile.base_url,
            model: profile.model,
            api_key: "",
          },
    );
    setModels(
      data?.providers.find(
        (p) => p.id === (profile === "new" ? "deepseek" : profile.provider),
      )?.models ?? [],
    );
    setSource("reference");
    setFailure("");
    setNotice("");
    setTestConsent(false);
  }
  function change<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setNotice("");
  }
  async function sync() {
    await Promise.all([mutate(), refresh("/settings")]);
  }
  async function run(action: "save" | "test" | "models") {
    if (busy) return;
    setBusy(action);
    setFailure("");
    setNotice("");
    const body = {
      ...draft,
      name: draft.name.trim(),
      model: draft.model.trim(),
    };
    try {
      if (action === "save") {
        if (existing) await patch(`/ai/profiles/${existing.id}`, body);
        else await post("/ai/profiles", body);
        setDraft(blank);
        setEditing(null);
        await sync();
        setNotice(t("已保存，问答与翻译中可立即选择。"));
      } else {
        // A model name is unnecessary to list models; the server schema still requires a safe ID.
        const result = await post<{ models: string[]; source: string }>(
          `/ai/profiles/${action}`,
          {
            ...body,
            name: body.name || t("我的模型"),
            model: body.model || "model-list",
            profile_id: existing?.id,
          },
        );
        if (action === "models") {
          setModels(result.models);
          setSource(result.source);
        } else
          setNotice(t("连接测试通过：{0}。保存后才会更新配置。", body.model));
      }
    } catch (e) {
      setFailure(errorMessage(e));
    } finally {
      setBusy("");
    }
  }
  async function actOnProfile(
    action: "default" | "delete",
    profile: AIProfile,
  ) {
    setBusy(profile.id);
    setFailure("");
    setNotice("");
    try {
      if (action === "default")
        await post(`/ai/profiles/${profile.id}/default`);
      else {
        await api(`/ai/profiles/${profile.id}`, { method: "DELETE" });
        setRemove(null);
      }
      await sync();
    } catch (e) {
      setFailure(errorMessage(e));
    } finally {
      setBusy("");
    }
  }
  if (error) return <ErrorState error={error} retry={() => mutate()} />;
  if (!data) return <Skeleton lines={4} />;
  return (
    <div className="connections-layout">
      <section className="connections-main">
        <div className="connections-heading">
          <div>
            <p className="eyebrow">{t("连接，由你选择")}</p>
            <h2>{t("我的模型连接")}</h2>
          </div>
          <button
            className="button primary small"
            disabled={!!busy || data.profiles.length >= 12}
            onClick={() => open("new")}
          >
            <Plus size={16} />
            {t("添加模型")}
          </button>
        </div>
        {!editing && notice && (
          <p className="connection-success" role="status">
            <Check size={16} />
            {notice}
          </p>
        )}
        {!editing && failure && (
          <p className="form-error" role="alert">
            {failure}
          </p>
        )}
        {!data.profiles.length ? (
          <div className="connections-empty">
            <Cable size={28} />
            <h3>{t("把熟悉的 AI，带进你的阅读空间。")}</h3>
            <p>
              {t("先选择服务商，再填入密钥与型号。无需编辑文件，无需重启。")}
            </p>
            <span>DeepSeek / {t("智谱")}</span>
          </div>
        ) : (
          <div className="connection-list">
            {data.profiles.map((p) => (
              <article className="connection-row" key={p.id}>
                <div className="connection-monogram">
                  {p.provider === "deepseek" ? "D" : "Z"}
                </div>
                <div className="connection-identity">
                  <h3>
                    {p.name}
                    {data.default_id === p.id && <span>{t("默认")}</span>}
                  </h3>
                  <p>
                    {p.provider === "deepseek" ? "DeepSeek" : t("智谱")} ·{" "}
                    {p.model}
                  </p>
                  <small>{t("密钥已保存 · 使用前请测试")}</small>
                </div>
                <div className="connection-actions">
                  {data.default_id !== p.id && (
                    <button
                      className="text-button"
                      disabled={!!busy}
                      onClick={() => actOnProfile("default", p)}
                    >
                      {t("设为默认")}
                    </button>
                  )}
                  <button
                    className="icon-button"
                    aria-label={t("编辑 {0}", p.name)}
                    disabled={!!busy}
                    onClick={() => open(p)}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={t("删除 {0}", p.name)}
                    disabled={!!busy}
                    onClick={() => setRemove(p)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
        <p className="form-note">
          {t(
            "每个连接对应一个准确型号；同一服务商可添加多个。最多保存 12 个。",
          )}
        </p>
      </section>
      <aside className="connections-guide">
        <ShieldCheck size={25} />
        <h3>{t("密钥留在后端，选择留给你。")}</h3>
        <p>
          {t(
            "密钥保存到当前学习空间的后端数据库，不会回传浏览器或写入 Git。数据库尚未加密，请保护电脑、data 目录和备份，不要把它们公开。",
          )}
        </p>
        <p>
          {t(
            "第一版仅允许 DeepSeek、智谱的官方通用 API 地址，不支持中转站或 Coding Plan 专用接口。",
          )}
        </p>
        <p>
          {t(
            "新连接用于文档问答和翻译。知识地图、闪卡与测验仍使用原有服务端配置。",
          )}
        </p>
        <p>
          {t(
            "学习空间绑定浏览器 Cookie，不是登录账号。清除 Cookie 后无法找回原空间。",
          )}
        </p>
        <a
          href="https://platform.deepseek.com/api_keys"
          target="_blank"
          rel="noreferrer"
        >
          {t("DeepSeek 开放平台")}
          <ArrowUpRight size={14} />
        </a>
        <a
          href="https://bigmodel.cn/usercenter/proj-mgmt/apikeys"
          target="_blank"
          rel="noreferrer"
        >
          {t("智谱开放平台")}
          <ArrowUpRight size={14} />
        </a>
      </aside>
      {editing && (
        <Modal
          title={existing ? t("编辑模型连接") : t("添加模型连接")}
          onClose={() => {
            if (!busy) {
              setEditing(null);
              setDraft(blank);
              setFailure("");
              setNotice("");
            }
          }}
        >
          <form
            className="connection-form"
            onSubmit={(e) => {
              e.preventDefault();
              void run("save");
            }}
          >
            <fieldset disabled={!!busy}>
              <label className="field">
                {t("服务商")}
                <select
                  value={draft.provider}
                  onChange={(e) => {
                    const provider = e.target.value as Draft["provider"];
                    const config = data.providers.find(
                      (p) => p.id === provider,
                    )!;
                    setDraft({
                      ...draft,
                      provider,
                      base_url: config.base_url,
                      model: "",
                      api_key: "",
                    });
                    setModels(config.models);
                    setSource("reference");
                    setNotice("");
                  }}
                >
                  <option value="deepseek">DeepSeek</option>
                  <option value="zhipu">{t("智谱")}</option>
                </select>
              </label>
              <label className="field">
                {t("连接备注名")}
                <input
                  required
                  maxLength={60}
                  value={draft.name}
                  placeholder={t("例如：论文阅读助手")}
                  onChange={(e) => change("name", e.target.value)}
                />
              </label>
              <label className="field">
                {t("服务接口地址（Base URL）")}
                <input
                  type="url"
                  required
                  value={draft.base_url}
                  onChange={(e) => change("base_url", e.target.value)}
                />
              </label>
              <label className="field">
                API Key
                <input
                  type="password"
                  autoComplete="new-password"
                  spellCheck={false}
                  maxLength={512}
                  value={draft.api_key}
                  required={!existing || existing.provider !== draft.provider}
                  placeholder={
                    existing?.provider === draft.provider
                      ? t("留空保留已保存的密钥")
                      : t("粘贴此服务商的 API 密钥")
                  }
                  onChange={(e) => change("api_key", e.target.value)}
                />
              </label>
              <label className="field">
                {t("准确模型 ID")}
                <input
                  required
                  list="provider-model-ids"
                  autoComplete="off"
                  maxLength={120}
                  value={draft.model}
                  placeholder={t("选择下方型号，或输入官方完整 ID")}
                  onChange={(e) => change("model", e.target.value)}
                />
                <datalist id="provider-model-ids">
                  {models.map((model) => (
                    <option value={model} key={model} />
                  ))}
                </datalist>
              </label>
              <div className="model-suggestions">
                {models.map((model) => (
                  <button
                    type="button"
                    key={model}
                    onClick={() => change("model", model)}
                  >
                    {model}
                  </button>
                ))}
              </div>
              {draft.provider === "deepseek" && (
                <button
                  type="button"
                  className="text-button"
                  onClick={() => run("models")}
                >
                  {t("读取官方模型列表")}
                </button>
              )}
              <p className="form-note">
                {source === "provider"
                  ? t("型号来自当前官方接口；具体调用权限仍需测试。")
                  : t(
                      "这些是官方文档参考型号，不代表你的账号已开通。可输入其他准确型号，不会自动猜测或替换。",
                    )}
              </p>
              <label className="connection-consent">
                <input
                  type="checkbox"
                  checked={testConsent}
                  onChange={(e) => setTestConsent(e.target.checked)}
                />
                <span>
                  {t(
                    "允许发送一条小型测试请求，可能产生少量 API 费用；不会发送论文。",
                  )}
                </span>
              </label>
            </fieldset>
            {failure && (
              <p className="form-error" role="alert">
                {failure}
              </p>
            )}
            {notice && (
              <p className="connection-success" role="status">
                {notice}
              </p>
            )}
            <div className="connection-form-actions">
              <button
                type="button"
                className="button secondary"
                disabled={!!busy || !testConsent || !draft.model.trim()}
                onClick={() => run("test")}
              >
                {busy === "test" ? <Spinner /> : t("测试这个型号")}
              </button>
              <button className="button primary" disabled={!!busy}>
                {busy === "save" ? <Spinner /> : t("保存连接")}
              </button>
            </div>
            {busy === "models" && <Spinner label={t("正在读取模型配置…")} />}
          </form>
        </Modal>
      )}
      {remove && (
        <Modal
          title={t("删除模型连接？")}
          onClose={() => {
            if (!busy) setRemove(null);
          }}
        >
          {failure && (
            <p className="form-error" role="alert">
              {failure}
            </p>
          )}
          <p>
            {t(
              "将移除 {0} 的密钥与配置，历史回答和模型标签仍保留。服务商账单与备份不会自动删除。",
              remove.name,
            )}
          </p>
          <button
            className="button primary"
            disabled={!!busy}
            onClick={() => actOnProfile("delete", remove)}
          >
            {t("确认删除")}
          </button>
        </Modal>
      )}
    </div>
  );
}
