import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Logo, ThemeToggle } from "@/components/ui";
export const metadata = { title: "Privacy & data" };
export default function PrivacyPage() {
  return (
    <>
      <header className="landing-nav">
        <Logo />
        <ThemeToggle />
      </header>
      <main id="main-content" className="prose-page">
        <Link href="/app" className="back-link">
          <ArrowLeft size={16} />
          Workspace
        </Link>
        <p className="eyebrow">PRIVACY / PLAIN LANGUAGE</p>
        <h1>
          Your knowledge.
          <br />
          Your boundaries.
        </h1>
        <p className="prose-lead">
          StudyPilot is self-hostable software. The deployment operator chooses
          where your files are stored and which AI provider receives text.
        </p>
        <div className="privacy-callout">
          <ShieldCheck size={25} />
          <p>
            No advertising trackers. No analytics SDK. No API keys in the
            browser.
          </p>
        </div>
        <section>
          <h2>What is stored?</h2>
          <p>
            PDF files are saved under the server’s DATA_DIR/uploads directory
            using generated IDs. PostgreSQL stores extracted pages, chunks,
            embeddings, knowledge points, chat messages, citations, plans,
            cards, review records, and quiz attempts. The database and upload
            directory both require persistent storage in production.
          </p>
        </section>
        <section>
          <h2>Who can see it?</h2>
          <p>
            A signed, HttpOnly cookie identifies your personal workspace. API
            requests check document ownership. The deployment administrator can
            access the underlying database and files. This release is not an
            encrypted vault, and it does not include an account recovery or
            cross-device sign-in system. Clearing the cookie loses access to
            that workspace.
          </p>
        </section>
        <section>
          <h2>When does text leave the server?</h2>
          <p>
            Demo mode makes no external AI calls. Live OpenAI-compatible mode
            sends text chunks to the embedding service; selected chunks and
            questions are sent to the chat model. Knowledge extraction processes
            all chunks in bounded batches. Ollama can run locally so model
            inputs remain inside your own infrastructure. Your chosen provider’s
            policies also apply.
          </p>
        </section>
        <section>
          <h2>What happens when I delete a PDF?</h2>
          <p>
            Deletion removes the original file and cascades through its pages,
            chunks, vectors, knowledge points, chats, citations, plans, cards,
            reviews, and quizzes. Operator backups may retain older copies until
            their retention period expires. There is no undo button.
          </p>
        </section>
        <section>
          <h2>What should deployment operators configure?</h2>
          <p>
            Use HTTPS, a strong SESSION_SECRET, secure cookies, an explicit
            ALLOWED_ORIGINS list, private database access, access controls at
            your hosting edge, encrypted storage, quotas, and backup retention.
            PDF parsing has size and page limits but is not a hardened malware
            sandbox. Do not treat this first release as a public,
            abuse-resistant multi-tenant SaaS.
          </p>
        </section>
        <section>
          <h2>What about the AI’s answers?</h2>
          <p>
            PDF content is treated as untrusted reference data, not
            instructions. Retrieval is scoped to one document, and cited source
            IDs are validated. These controls reduce risk; they cannot guarantee
            that a model’s interpretation is correct. Verify important claims
            against the original pages.
          </p>
        </section>
        <Link href="/app" className="button primary">
          Back to learning
        </Link>
      </main>
    </>
  );
}
