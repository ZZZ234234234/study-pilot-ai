"use client";
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

function Configuration({ settings }: { settings: Settings }) {
  const [provider, setProvider] = useState(settings.provider);
  const [base, setBase] = useState(settings.base_url);
  const [chat, setChat] = useState(settings.chat_model);
  const [embedding, setEmbedding] = useState(settings.embedding_model);
  const [busy, setBusy] = useState(false);
  const snippet = `AI_PROVIDER=${provider}\n${provider === "ollama" ? "OLLAMA_BASE_URL" : "AI_BASE_URL"}=${base}\nCHAT_MODEL=${chat}\nEMBEDDING_MODEL=${embedding}\n# Set AI_API_KEY privately in the API server environment.\n# Restart API + worker, then reprocess existing documents.`;
  async function test() {
    setBusy(true);
    try {
      const result = await post<{ message: string }>("/settings/test");
      toast.success(result.message);
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
          <h2>Your current connection</h2>
          <p>
            {settings.provider === "demo"
              ? "Demo adapter · no external AI requests"
              : `${settings.provider} · ${settings.chat_model}`}
          </p>
        </div>
        <Badge tone={settings.mode === "live" ? "green" : "amber"}>
          {settings.mode === "live" ? "Live configuration" : "Demo mode"}
        </Badge>
        <button
          className="button secondary small"
          disabled={busy}
          onClick={test}
        >
          {busy ? <Spinner /> : "Test current connection"}
        </button>
      </div>
      <div className="settings-grid">
        <section className="panel settings-form">
          <p className="eyebrow">PROVIDER CONFIGURATION</p>
          <h2>Your model. Your choice.</h2>
          <p className="muted">
            Build a configuration snippet for your server. Nothing on this page
            silently changes the active provider.
          </p>
          <div className="provider-options">
            {(["demo", "openai", "ollama"] as const).map((p) => (
              <button
                key={p}
                onClick={() => choose(p)}
                className={provider === p ? "selected" : ""}
              >
                {p === "openai"
                  ? "OpenAI compatible"
                  : p === "ollama"
                    ? "Ollama · local"
                    : "Demo"}
                {provider === p && <Check size={14} />}
              </button>
            ))}
          </div>
          <label className="field">
            Base URL
            <input
              value={base}
              onChange={(e) => setBase(e.target.value)}
              type="url"
            />
          </label>
          <div className="form-grid">
            <label className="field">
              Chat model
              <input value={chat} onChange={(e) => setChat(e.target.value)} />
            </label>
            <label className="field">
              Embedding model
              <input
                value={embedding}
                onChange={(e) => setEmbedding(e.target.value)}
              />
            </label>
          </div>
          <div className="key-note">
            <KeyRound size={20} />
            <p>
              <strong>Keys belong on the server.</strong>
              <br />
              This deployment uses administrator-managed credentials. Set
              AI_API_KEY in your server environment, never in NEXT_PUBLIC
              variables or Git.
            </p>
          </div>
          <div className="configuration-code">
            <div>
              <Terminal size={15} />
              .env configuration
              <button
                className="icon-button"
                aria-label="Copy server configuration"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(snippet);
                    toast.success(
                      "Configuration copied. Apply it to the API server, then restart.",
                    );
                  } catch {
                    toast.error(
                      "Clipboard unavailable. Select and copy the snippet manually.",
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
            <h3>A useful boundary.</h3>
            <p>
              Only the server can contact the model. Browser users cannot change
              provider endpoints, view API keys, or redirect your documents to
              another service.
            </p>
            <ul>
              <li>OpenAI-compatible Chat Completions + embeddings</li>
              <li>JSON-capable chat models required</li>
              <li>Ollama can keep inference local</li>
              <li>Changing embeddings requires reprocessing</li>
            </ul>
            <Link href="/privacy" className="text-button">
              Read the data policy ↗
            </Link>
          </section>
          <p className="settings-footnote">
            Workspaces are tied to an HttpOnly browser cookie, not a recoverable
            account. Account login and cross-device sync are on the roadmap.
          </p>
        </aside>
      </div>
    </>
  );
}
export default function SettingsPage() {
  const { data, error, mutate } = useSWR<Settings>("/settings");
  return (
    <>
      <PageHeading
        eyebrow="BUILT AROUND YOUR BOUNDARIES"
        title="Make this workspace yours."
        description="A portable AI setup, with credentials kept where they belong."
      />
      {error ? (
        <ErrorState error={error} retry={() => mutate()} />
      ) : data ? (
        <Configuration settings={data} />
      ) : (
        <Skeleton lines={4} />
      )}
    </>
  );
}
