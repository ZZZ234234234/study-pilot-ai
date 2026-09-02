"use client";
import { useLocale } from "@/components/locale-provider";
import useSWR from "swr";
import { useState } from "react";
import { ArrowUpRight, ChevronDown, ListTree, Search } from "lucide-react";
import { Badge, EmptyState, ErrorState, Skeleton } from "./ui";
import type { KnowledgePoint } from "@/lib/types";
import { importanceLabel, difficultyLabel } from "@/lib/locale";
export function KnowledgePanel({
  id,
  onPage,
}: {
  id: string;
  onPage: (page: number) => void;
}) {
  const { t } = useLocale();
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
          {t("让知识逐渐成体系")}
        </div>
        <h2>{t("重点，慢慢清晰起来。")}</h2>
        <p>{t("{0} 个知识点，每一个都能回到原文。", data.length)}</p>
      </div>
      <label className="search-input compact">
        <Search size={16} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("查找一个概念…")}
          aria-label={t("搜索知识点")}
        />
      </label>
      {!data.length ? (
        <EmptyState
          title={t("再进一步，生成知识地图。")}
          description={t(
            "先配置 AI 模型，再重新处理这份 PDF，即可提取知识点。现在已经可以阅读和搜索原文。",
          )}
        />
      ) : !filtered.length ? (
        <p className="calm-empty">
          {t("没有找到匹配的概念，换个关键词试试。")}
        </p>
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
                        {t(importanceLabel[point.importance])}
                      </Badge>
                      <Badge>
                        {t("难度：")}
                        {t(difficultyLabel[point.difficulty])}
                      </Badge>
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
                      {t("阅读原文 · 第 {0} 页", point.page_number)}
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
