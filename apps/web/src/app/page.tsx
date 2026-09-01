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
  return (
    <div className="landing">
      <header className="landing-nav">
        <Logo />
        <nav aria-label="Website">
          <a href="#features">The workspace</a>
          <a href="#how-it-works">How it works</a>
          <Link href="/open-source">Open source</Link>
        </nav>
        <div>
          <ThemeToggle />
          <Link href="/app" className="button small primary">
            Start learning <ArrowUpRight size={16} />
          </Link>
        </div>
      </header>
      <main id="main-content">
        <section className="hero">
          <div className="hero-eyebrow">
            <span />
            OPEN SOURCE. OPEN POSSIBILITIES.
          </div>
          <h1>
            Turn PDFs into
            <br />
            <span>structured knowledge.</span>
          </h1>
          <p>
            Your reading has a next chapter.
            <br />A thoughtful workspace to understand, remember, and connect
            the ideas that matter.
          </p>
          <div className="hero-actions">
            <Link href="/app" className="button primary">
              Start Learning <ArrowRight size={18} />
            </Link>
            <a href={github} className="button secondary">
              <GitBranch size={17} />
              View on GitHub <ArrowUpRight size={16} />
            </a>
          </div>
          <div className="hero-footnote">
            <span>Upload.</span> Understand. Review. Ask.
            <span className="hero-dot">·</span>No AI key needed to explore.
          </div>
          <div className="hero-preview">
            <div className="preview-floating-note">
              <span>LESS SCROLLING</span>
              <strong>More understanding.</strong>
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
          <span>Built for the way curious minds work.</span>
          <div>
            <BookOpen size={17} />
            Your sources
          </div>
          <div>
            <ListTree size={17} />
            Your structure
          </div>
          <div>
            <ShieldCheck size={17} />
            Your control
          </div>
        </section>
        <section className="landing-section" id="features">
          <div className="section-intro">
            <p className="eyebrow">01 / A CALMER WAY TO LEARN</p>
            <h2>
              Not another chat window.
              <br />
              Your entire learning loop.
            </h2>
            <p>
              Reading is only the beginning. Give every idea a place to go—and a
              reason to come back.
            </p>
          </div>
          <div className="feature-grid">
            <article className="feature-large">
              <div className="feature-icon">
                <ListTree />
              </div>
              <h3>See the bigger picture.</h3>
              <p>
                Turn dense pages into a navigable knowledge tree. Chapters,
                concepts, importance, and difficulty—connected to the source.
              </p>
              <div className="feature-tree">
                <span>Neural networks</span>
                <div>
                  <span>Training the network</span>
                  <div>
                    <b>Loss & gradient descent</b>
                    <b>
                      Backpropagation <small>p. 3</small>
                    </b>
                  </div>
                </div>
              </div>
              <span className="feature-index">01 / KNOWLEDGE EXTRACTION</span>
            </article>
            <article>
              <div className="feature-icon">
                <ScanText />
              </div>
              <h3>Answers with receipts.</h3>
              <p>
                Ask a question. Follow the citation back to the exact PDF page.
                No evidence? The assistant says so.
              </p>
              <div className="source-demo">
                <span>
                  “Weight sharing lets the same feature detector operate at
                  different positions.”
                </span>
                <small>
                  NEURAL NETWORKS <b>↗ p. 4</b>
                </small>
              </div>
              <span className="feature-index">02 / SOURCE-GROUNDED Q&A</span>
            </article>
            <article>
              <div className="feature-icon">
                <Sparkles />
              </div>
              <h3>Remember for longer.</h3>
              <p>
                A realistic study plan, focused flashcards, and spaced reviews.
                Small sessions. Lasting understanding.
              </p>
              <div className="mini-week">
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                  <div key={i}>
                    <span>{d}</span>
                    <b className={i < 4 ? "done" : ""}>
                      {i < 3 ? "✓" : i === 3 ? "4" : i + 1}
                    </b>
                  </div>
                ))}
              </div>
              <span className="feature-index">03 / YOUR REVIEW DASHBOARD</span>
            </article>
          </div>
        </section>
        <section className="workflow-section" id="how-it-works">
          <div>
            <p className="eyebrow">02 / FROM FILE TO FLUENCY</p>
            <h2>
              One document.
              <br />A clearer path forward.
            </h2>
          </div>
          <div className="workflow-steps">
            {[
              [
                "01",
                "Upload",
                "Bring your PDF. We keep its pages, structure, and sources intact.",
              ],
              [
                "02",
                "Understand",
                "Explore a knowledge map distilled from your material.",
              ],
              [
                "03",
                "Review",
                "Make space for a little practice, at the right time.",
              ],
              [
                "04",
                "Ask",
                "Follow your curiosity. Find answers grounded in the original.",
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
              YOUR KNOWLEDGE.
              <br />
              <strong>YOUR BOUNDARIES.</strong>
            </span>
            <div>
              <i />
              Self-hosted <i />
              Local AI compatible
            </div>
          </div>
          <div>
            <p className="eyebrow">03 / PRIVATE BY DESIGN</p>
            <h2>
              Your notes shouldn’t
              <br />
              come with fine print.
            </h2>
            <p>
              Self-host your workspace. Choose an OpenAI-compatible provider or
              keep model inference local with Ollama. API keys stay on the
              server. Deleting a document removes its learning data, too.
            </p>
            <Link href="/privacy" className="text-button">
              Understand your data <ArrowUpRight size={17} />
            </Link>
          </div>
        </section>
        <section className="open-source-section">
          <p className="eyebrow">MADE TO BE YOURS</p>
          <h2>
            Open the source.
            <br />
            Build your own next chapter.
          </h2>
          <p>
            Next.js · FastAPI · PostgreSQL · pgvector
            <br />
            MIT licensed. No locked-in model. No invented metrics.
          </p>
          <div>
            <a className="button secondary" href={github}>
              <GitBranch size={18} />
              Explore the source <ArrowUpRight size={16} />
            </a>
            <DemoButton>Try the original sample</DemoButton>
          </div>
        </section>
        <section className="landing-cta">
          <span>Make something of what you read.</span>
          <Link href="/app" className="button primary">
            Let’s start learning <ArrowRight size={18} />
          </Link>
        </section>
      </main>
      <footer className="landing-footer">
        <Logo />
        <span>Less collecting. More connecting.</span>
        <div>
          <Link href="/privacy">Privacy & data</Link>
          <Link href="/open-source">Documentation</Link>
          <span>© 2026 StudyPilot AI</span>
        </div>
      </footer>
    </div>
  );
}
