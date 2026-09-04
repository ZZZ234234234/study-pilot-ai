"use client";
import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import {
  BrainCircuit,
  Cable,
  Check,
  CircleAlert,
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
type CapabilityReport = {
  ok: true;
  model: string;
  capabilities: {
    connection: boolean;
    structured_output: boolean;
    context_memory: boolean;
    in_context_learning: boolean;
  };
};
type ProviderConfig = AIProfiles["providers"][number];
const PROFILE_LIMIT = 30;
const providerGroups: { id: ProviderConfig["group"]; label: string }[] = [
  { id: "china", label: "中国大陆模型" },
  { id: "international", label: "国际模型" },
  { id: "gateway", label: "聚合平台" },
  { id: "local", label: "本地模型" },
];
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
  const [capabilityReport, setCapabilityReport] =
    useState<CapabilityReport | null>(null);
  const [testConsent, setTestConsent] = useState(false);
  const [remove, setRemove] = useState<AIProfile | null>(null);
  const existing = editing && editing !== "new" ? editing : null;
  const selectedProvider = data?.providers.find(
    (provider) => provider.id === draft.provider,
  );

  function open(profile: AIProfile | "new") {
    const config = data?.providers.find(
      (provider) =>
        provider.id === (profile === "new" ? "deepseek" : profile.provider),
    );
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
    setModels(config?.models ?? []);
    setSource(config?.model_source ?? "manual");
    setFailure("");
    setNotice("");
    setCapabilityReport(null);
    setTestConsent(false);
  }
  function change<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setNotice("");
    setCapabilityReport(null);
  }
  async function sync() {
    await Promise.all([mutate(), refresh("/settings")]);
  }
  async function run(action: "save" | "test" | "models") {
    if (busy) return;
    setBusy(action);
    setFailure("");
    setNotice("");
    if (action === "test") setCapabilityReport(null);
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
      } else if (action === "models") {
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
        setModels(result.models);
        setSource(result.source);
      } else {
        const result = await post<CapabilityReport>("/ai/profiles/test", {
          ...body,
          name: body.name || t("我的模型"),
          profile_id: existing?.id,
        });
        setCapabilityReport(result);
        setNotice(
          t("连接与能力检测完成：{0}。保存后才会更新配置。", result.model),
        );
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
            disabled={!!busy || data.profiles.length >= PROFILE_LIMIT}
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
            <span>{t("国内 · 国际 · 聚合平台 · 本地模型")}</span>
          </div>
        ) : (
          <div className="connection-list">
            {data.profiles.map((p) => (
              <ConnectionRow
                key={p.id}
                profile={p}
                provider={data.providers.find((item) => item.id === p.provider)}
                isDefault={data.default_id === p.id}
                busy={!!busy}
                onDefault={() => actOnProfile("default", p)}
                onEdit={() => open(p)}
                onRemove={() => setRemove(p)}
              />
            ))}
          </div>
        )}
        <p className="form-note">
          {t(
            "每个连接对应一个准确型号；同一服务商可添加多个。最多保存 30 个。",
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
            "已覆盖国内外主流模型、聚合平台与本地模型。云端服务只允许预置官方地址，不开放任意转发地址。",
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
        <div className="provider-coverage" aria-label={t("已支持的服务类型")}>
          {providerGroups.map((group) => (
            <span key={group.id}>
              {t(group.label)} ·{" "}
              {
                data.providers.filter((provider) => provider.group === group.id)
                  .length
              }
            </span>
          ))}
        </div>
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
                    setSource(config.model_source);
                    setNotice("");
                    setCapabilityReport(null);
                  }}
                >
                  {providerGroups.map((group) => (
                    <optgroup label={t(group.label)} key={group.id}>
                      {data.providers
                        .filter((provider) => provider.group === group.id)
                        .map((provider) => (
                          <option value={provider.id} key={provider.id}>
                            {t(provider.name)}
                          </option>
                        ))}
                    </optgroup>
                  ))}
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
                <select
                  required
                  value={draft.base_url}
                  onChange={(e) => change("base_url", e.target.value)}
                >
                  {selectedProvider?.endpoints.map((endpoint) => (
                    <option value={endpoint.url} key={endpoint.url}>
                      {t(endpoint.label)} · {endpoint.url}
                    </option>
                  ))}
                </select>
                <small className="field-help">
                  {t("为保护密钥，仅可选择已核验的官方或本机地址。")}
                </small>
              </label>
              <label className="field">
                API Key
                <input
                  type="password"
                  autoComplete="new-password"
                  spellCheck={false}
                  maxLength={512}
                  value={draft.api_key}
                  required={
                    !!selectedProvider?.key_required &&
                    (!existing || existing.provider !== draft.provider)
                  }
                  placeholder={
                    !selectedProvider?.key_required
                      ? t("本地服务通常无需 API Key")
                      : existing?.provider === draft.provider
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
              {selectedProvider?.model_list && (
                <button
                  type="button"
                  className="text-button"
                  onClick={() => run("models")}
                >
                  {t("读取可用模型列表")}
                </button>
              )}
              <p className="form-note">
                {source === "provider"
                  ? t(
                      "型号来自当前接口，可能包含非聊天模型；请选择支持对话与 JSON 输出的型号并执行测试。",
                    )
                  : source === "manual"
                    ? t("请从服务商控制台复制准确模型 ID 或推理接入点 ID。")
                    : t(
                        "这些是官方文档参考型号，不代表你的账号已开通。可输入其他准确型号，不会自动猜测或替换。",
                      )}
              </p>
              {selectedProvider && (
                <div className="provider-reference">
                  <div>
                    <span>{t("当前服务商")}</span>
                    <strong>{t(selectedProvider.name)}</strong>
                  </div>
                  <div className="provider-reference-links">
                    {selectedProvider.key_url && (
                      <a
                        href={selectedProvider.key_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t("获取 API Key")}
                        <ArrowUpRight size={13} />
                      </a>
                    )}
                    <a
                      href={selectedProvider.docs_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t("查看官方文档")}
                      <ArrowUpRight size={13} />
                    </a>
                  </div>
                </div>
              )}
              <label className="connection-consent">
                <input
                  type="checkbox"
                  checked={testConsent}
                  onChange={(e) => setTestConsent(e.target.checked)}
                />
                <span>
                  {t(
                    "允许发送一条小型能力检测请求，可能产生少量 API 费用；不会发送论文或历史对话。",
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
            {capabilityReport && (
              <section
                className="capability-report"
                aria-label={t("模型能力检测结果")}
              >
                <div className="capability-report-heading">
                  <BrainCircuit size={18} />
                  <div>
                    <strong>{t("本次实测结果")}</strong>
                    <span>{capabilityReport.model}</span>
                  </div>
                </div>
                <div className="capability-checks">
                  {[
                    [
                      t("接口连接与 JSON 输出"),
                      capabilityReport.capabilities.connection &&
                        capabilityReport.capabilities.structured_output,
                    ],
                    [
                      t("请求内上下文记忆"),
                      capabilityReport.capabilities.context_memory,
                    ],
                    [
                      t("临时示例学习（上下文内）"),
                      capabilityReport.capabilities.in_context_learning,
                    ],
                  ].map(([label, passed]) => (
                    <div className="capability-check" key={String(label)}>
                      {passed ? (
                        <Check aria-hidden="true" size={15} />
                      ) : (
                        <CircleAlert aria-hidden="true" size={15} />
                      )}
                      <span>{label}</span>
                      <strong className={passed ? "passed" : "limited"}>
                        {passed ? t("通过") : t("未通过")}
                      </strong>
                    </div>
                  ))}
                </div>
                <p>
                  {t(
                    "上下文记忆只在本次检测请求提供的前文范围内有效；临时示例学习不等于训练或永久学习。",
                  )}
                </p>
              </section>
            )}
            <div className="connection-form-actions">
              <button
                type="button"
                className="button secondary"
                disabled={!!busy || !testConsent || !draft.model.trim()}
                onClick={() => run("test")}
              >
                {busy === "test" ? <Spinner /> : t("检测连接与能力")}
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

function ConnectionRow({
  profile,
  provider,
  isDefault,
  busy,
  onDefault,
  onEdit,
  onRemove,
}: {
  profile: AIProfile;
  provider?: ProviderConfig;
  isDefault: boolean;
  busy: boolean;
  onDefault: () => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const { t } = useLocale();
  return (
    <article className="connection-row">
      <div
        className="connection-monogram"
        aria-hidden="true"
        data-long={(provider?.monogram.length ?? 0) > 2 || undefined}
      >
        {provider?.monogram ?? profile.provider.slice(0, 2).toUpperCase()}
      </div>
      <div className="connection-identity">
        <h3>
          {profile.name}
          {isDefault && <span>{t("默认")}</span>}
        </h3>
        <p>
          {provider ? t(provider.name) : profile.provider} · {profile.model}
        </p>
        <small>
          {provider?.key_required === false
            ? t("本地连接 · 使用前请测试")
            : t("密钥已保存 · 使用前请测试")}
        </small>
      </div>
      <div className="connection-actions">
        {!isDefault && (
          <button className="text-button" disabled={busy} onClick={onDefault}>
            {t("设为默认")}
          </button>
        )}
        <button
          className="icon-button"
          aria-label={t("编辑 {0}", profile.name)}
          disabled={busy}
          onClick={onEdit}
        >
          <Pencil size={16} />
        </button>
        <button
          className="icon-button"
          aria-label={t("删除 {0}", profile.name)}
          disabled={busy}
          onClick={onRemove}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </article>
  );
}
