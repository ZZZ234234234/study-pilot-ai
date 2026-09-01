import Link from "next/link";
import { GitBranch, ArrowUpRight, ArrowLeft } from "lucide-react";
import { Logo, ThemeToggle } from "@/components/ui";
import { GITHUB_URL } from "@/lib/config";
export const metadata = { title: "Open source" };
export default function OpenSourcePage() {
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
          Home
        </Link>
        <p className="eyebrow">OPEN SOURCE / MIT LICENSE</p>
        <h1>
          Made to be understood.
          <br />
          Built to be extended.
        </h1>
        <p className="prose-lead">
          StudyPilot AI is a full-stack learning workspace: Next.js, FastAPI,
          PostgreSQL, pgvector, and a provider adapter you can make your own.
        </p>
        {url ? (
          <a className="button primary" href={url}>
            <GitBranch size={18} />
            View repository <ArrowUpRight size={17} />
          </a>
        ) : (
          <div className="form-note">
            This deployment has not configured a public repository link yet. The
            source is included in the project checkout. Set
            NEXT_PUBLIC_GITHUB_URL after publishing your repository.
          </div>
        )}
        <section>
          <h2>Run it locally</h2>
          <pre className="doc-code">{`make install\nmake dev\n# Open http://localhost:3000`}</pre>
          <p>
            The quick-start uses development-only PGlite with pgvector. Native
            PostgreSQL deployment and Docker packaging are still on the roadmap.
            Demo mode never pretends to be a live model.
          </p>
        </section>
        <section>
          <h2>Bring your own provider</h2>
          <p>
            Set AI_PROVIDER, AI_BASE_URL, CHAT_MODEL, EMBEDDING_MODEL, and the
            private AI_API_KEY on the API server. For local inference, use
            AI_PROVIDER=ollama and OLLAMA_BASE_URL. Restart the API and worker,
            then reprocess existing PDFs when changing embeddings.
          </p>
        </section>
        <section>
          <h2>Explore the code</h2>
          <ul>
            <li>apps/web — the responsive learning interface</li>
            <li>
              apps/api — PDF processing, ownership checks, RAG, and study
              scheduling
            </li>
            <li>
              docs — architecture, verification notes, and original sample
              material
            </li>
            <li>
              scripts — local startup, sample generation, and quality checks
            </li>
          </ul>
        </section>
        <section>
          <h2>Honest first-release boundaries</h2>
          <p>
            This is an alpha development preview, not a production-audited
            service. Real-provider integration and complete browser regression
            testing remain outstanding. Scanned-PDF OCR, recoverable account
            login, multi-document conversations, and study groups are not
            included in v0.1. Source citations are navigable evidence, not a
            factuality guarantee. Short-answer quiz scoring uses transparent
            keyword matching.
          </p>
        </section>
        <Link className="button secondary" href="/app">
          Explore the workspace <ArrowUpRight size={17} />
        </Link>
      </main>
    </>
  );
}
