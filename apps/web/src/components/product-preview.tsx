import {
  ArrowUpRight,
  BookOpen,
  Check,
  Circle,
  Files,
  LayoutDashboard,
  ListTree,
  Sparkles,
} from "lucide-react";

export function ProductPreview() {
  return (
    <div
      className="product-preview"
      aria-label="Illustrative preview using our original neural networks sample"
    >
      <div className="preview-toolbar">
        <span className="preview-dots">
          <i />
          <i />
          <i />
        </span>
        <span>studypilot / workspace</span>
        <span className="preview-sample">ORIGINAL SAMPLE</span>
      </div>
      <div className="preview-body">
        <aside className="preview-sidebar">
          <span className="mini-logo">
            S<span>StudyPilot</span>
          </span>
          <div>
            <LayoutDashboard size={14} />
            Overview
          </div>
          <div className="selected">
            <Files size={14} />
            My library
          </div>
          <div>
            <ListTree size={14} />
            Study plan
          </div>
          <span className="preview-bottom">A little progress, every day.</span>
        </aside>
        <div className="preview-main">
          <div className="preview-breadcrumb">
            MY LIBRARY <span>/ NEURAL NETWORKS</span>
          </div>
          <h3>
            Introduction to
            <br />
            Neural Networks
            <span className="preview-document-icon">
              <BookOpen size={27} />
            </span>
          </h3>
          <div className="preview-meta">
            <span>8 pages</span>
            <span>16 knowledge points</span>
            <span className="preview-ready">
              <Check size={11} />
              Ready to learn
            </span>
          </div>
          <div className="preview-tabs">
            <span className="selected">Knowledge</span>
            <span>Ask AI</span>
            <span>Flashcards</span>
          </div>
          <div className="preview-topic">
            <span className="chapter-number">04</span>
            <div>
              <small>CHAPTER FOUR</small>
              <h4>Seeing with convolution</h4>
            </div>
            <ArrowUpRight size={17} />
          </div>
          <div className="preview-knowledge">
            <span className="knowledge-node" />
            <div>
              <h4>Why convolution is useful</h4>
              <p>
                Local connectivity. Shared weights.
                <br />
                One filter, many possibilities.
              </p>
              <span className="source-pill">↗ Source · Page 4</span>
            </div>
          </div>
          <div className="preview-knowledge lower">
            <Circle size={10} />
            <div>
              <h4>Stride, padding, and pooling</h4>
              <span className="mini-line" />
              <span className="mini-line short" />
            </div>
          </div>
        </div>
        <div className="preview-aside">
          <span className="assistant-label">
            <Sparkles size={14} />
            YOUR STUDY COMPANION
          </span>
          <div className="preview-question">
            Why does convolution
            <br />
            use fewer parameters?
          </div>
          <span className="answer-label">SOURCE-GROUNDED ANSWER</span>
          <p>
            The same small filter is reused across the image. This{" "}
            <strong>weight sharing</strong> reduces the number of parameters a
            network needs.
          </p>
          <div className="preview-citation">
            <BookOpen size={15} />
            <span>
              Neural Networks<small>Page 4 · Original source</small>
            </span>
            <ArrowUpRight size={14} />
          </div>
          <div className="preview-input">
            Ask a better question.<span>↵</span>
          </div>
        </div>
      </div>
    </div>
  );
}
