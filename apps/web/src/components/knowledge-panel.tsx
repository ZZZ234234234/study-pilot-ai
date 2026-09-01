"use client";
import useSWR from "swr";
import { useState } from "react";
import { ArrowUpRight, ChevronDown, ListTree, Search } from "lucide-react";
import { Badge, EmptyState, ErrorState, Skeleton } from "./ui";
import type { KnowledgePoint } from "@/lib/types";

export function KnowledgePanel({
  id,
  onPage,
}: {
  id: string;
  onPage: (page: number) => void;
}) {
  const { data, error, mutate } = useSWR<KnowledgePoint[]>(
    `/documents/${id}/knowledge`,
  );
  const [q, setQ] = useState("");
  if (error) return <ErrorState error={error} retry={() => mutate()} />;
  if (!data) return <Skeleton />;
  const filtered = data.filter((point) =>
    `${point.title} ${point.keywords.join(" ")}`
      .toLowerCase()
      .includes(q.toLowerCase()),
  );
  const chapters = Object.groupBy(filtered, (p) => p.chapter);
  return (
    <div className="knowledge-panel">
      <div className="assistant-heading">
        <div className="eyebrow">
          <ListTree size={14} />
          THE BIGGER PICTURE
        </div>
        <h2>A map of what matters.</h2>
        <p>{data.length} ideas, connected to the original pages.</p>
      </div>
      <label className="search-input compact">
        <Search size={16} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Find a concept…"
          aria-label="Search knowledge points"
        />
      </label>
      {!data.length ? (
        <EmptyState
          title="Knowledge is one step away."
          description="Configure an AI provider and reprocess this PDF to extract its knowledge. The original text is already searchable."
        />
      ) : !filtered.length ? (
        <p className="calm-empty">No matching concepts. Try another keyword.</p>
      ) : (
        <div className="knowledge-tree">
          {Object.entries(chapters).map(([chapter, points]) => (
            <section key={chapter} className="knowledge-chapter">
              <div className="knowledge-chapter-heading">
                <span className="chapter-dot" />
                <h3>{chapter}</h3>
                <span>{points?.length}</span>
              </div>
              {points?.map((point, i) => (
                <details
                  className="knowledge-point"
                  key={point.id}
                  open={q ? true : undefined}
                >
                  <summary>
                    <span className="point-index">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <strong>{point.title}</strong>
                    <ChevronDown size={16} />
                  </summary>
                  <div className="point-details">
                    <div className="point-badges">
                      <Badge
                        tone={point.importance === "high" ? "green" : "neutral"}
                      >
                        {point.importance} importance
                      </Badge>
                      <Badge>{point.difficulty} difficulty</Badge>
                    </div>
                    <p>{point.explanation}</p>
                    <div className="keyword-list">
                      {point.keywords.map((k) => (
                        <span key={k}>{k}</span>
                      ))}
                    </div>
                    <blockquote>{point.source_excerpt}</blockquote>
                    <button
                      className="source-link"
                      onClick={() => onPage(point.page_number)}
                    >
                      Read source · Page {point.page_number}
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                </details>
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
