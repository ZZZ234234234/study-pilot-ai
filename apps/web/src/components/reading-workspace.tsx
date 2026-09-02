"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import {
  BookOpen,
  Expand,
  Minimize2,
  Move,
  PanelRight,
  PictureInPicture2,
  RotateCcw,
  Scaling,
  X,
} from "lucide-react";
import { useLocale } from "./locale-provider";
import { PdfReader } from "./pdf-reader";
import { useFocusLayer } from "./use-focus-layer";
import { cn } from "@/lib/api";
import {
  adjustWindow,
  boundWindow,
  initialWindow,
  splitPercent,
  type WindowRect,
} from "@/lib/reader-layout";
import {
  useReadingPreference,
  useReadingViewport,
} from "@/lib/reading-preferences";

const modes = ["docked", "floating", "hidden"] as const;
type Gesture = {
  kind: "move" | "resize" | "split";
  pointer: number;
  x: number;
  y: number;
  rect: WindowRect;
  split: number;
  width: number;
};

export function ReadingWorkspace({
  id,
  page,
  count,
  onPage,
  sourceRequest,
  children,
}: {
  id: string;
  page: number;
  count: number;
  onPage: (value: number) => void;
  sourceRequest: number;
  children: ReactNode;
}) {
  const { t } = useLocale();
  const viewport = useReadingViewport();
  const root = useRef<HTMLElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const windowHeader = useRef<HTMLButtonElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const [width, setWidth] = useState(1200);
  const [split, setSplit] = useState(70);
  const [mode, setMode] = useReadingPreference(
    "studypilot:assistant-layout",
    modes,
    "docked",
  );
  const lastMode = useRef<"docked" | "floating">("docked");
  const [mobileOpenedAt, setMobileOpenedAt] = useState<number | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [rect, setRect] = useState<WindowRect | null>(null);
  const narrow = viewport.width <= 900 || width < 760;
  const visible = narrow ? mobileOpenedAt === sourceRequest : mode !== "hidden";
  const floating = narrow || fullscreen || mode === "floating";
  const position = rect ? boundWindow(rect, viewport) : initialWindow(viewport);
  const ratio = splitPercent(split, width);
  const exitFullscreen = useCallback(() => setFullscreen(false), []);
  useFocusLayer(fullscreen, root, exitFullscreen);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Source citations should reveal the page on a phone, not leave it under the assistant.
  const lastSource = useRef(sourceRequest);
  useEffect(() => {
    if (lastSource.current !== sourceRequest) {
      lastSource.current = sourceRequest;
      root.current?.querySelector<HTMLElement>(".pdf-canvas-area")?.focus();
    }
  }, [sourceRequest, narrow]);

  function hideAssistant() {
    if (narrow) setMobileOpenedAt(null);
    else {
      lastMode.current = mode === "floating" ? "floating" : "docked";
      setMode("hidden");
    }
    launcher.current?.focus();
  }
  function openAssistant() {
    if (narrow) setMobileOpenedAt(sourceRequest);
    else if (mode === "hidden") setMode(lastMode.current);
    // Focus after React removes `hidden`; keep all content mounted throughout.
    requestAnimationFrame(() => windowHeader.current?.focus());
  }
  function begin(
    event: PointerEvent<HTMLButtonElement>,
    kind: Gesture["kind"],
  ) {
    if (!event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = {
      kind,
      pointer: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      rect: position,
      split: ratio,
      width,
    };
  }
  function move(event: PointerEvent<HTMLButtonElement>) {
    const active = gesture.current;
    if (!active || active.pointer !== event.pointerId) return;
    const dx = event.clientX - active.x;
    const dy = event.clientY - active.y;
    if (active.kind === "split")
      setSplit(
        splitPercent(
          active.split + (dx / Math.max(1, active.width)) * 100,
          active.width,
        ),
      );
    else
      setRect(
        adjustWindow(active.rect, dx, dy, active.kind === "resize", viewport),
      );
  }
  function end(event: PointerEvent<HTMLButtonElement>) {
    if (gesture.current?.pointer !== event.pointerId) return;
    gesture.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function arrows(event: KeyboardEvent<HTMLButtonElement>, resize: boolean) {
    const step = event.shiftKey ? 64 : 16;
    const delta: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    if (!delta[event.key]) return;
    event.preventDefault();
    setRect(adjustWindow(position, ...delta[event.key], resize, viewport));
  }
  const pointerHandlers = {
    onPointerMove: move,
    onPointerUp: end,
    onPointerCancel: end,
    onLostPointerCapture: () => {
      gesture.current = null;
    },
  };
  return (
    <section
      ref={root}
      tabIndex={-1}
      role={fullscreen ? "dialog" : "region"}
      aria-modal={fullscreen ? true : undefined}
      aria-label={fullscreen ? t("全屏阅读") : t("资料阅读工作区")}
      className={cn("reading-workspace", fullscreen && "is-fullscreen")}
    >
      <div className="reading-controls">
        <span className="reading-context">
          <BookOpen size={16} />
          {fullscreen ? t("全屏阅读") : t("原始 PDF")}
        </span>
        <div>
          <button
            type="button"
            className="button secondary small"
            onClick={() => setFullscreen((value) => !value)}
            data-layer-focus={fullscreen ? true : undefined}
          >
            {fullscreen ? <Minimize2 size={16} /> : <Expand size={16} />}
            {fullscreen ? t("退出全屏") : t("全屏阅读")}
          </button>
          <button
            type="button"
            ref={launcher}
            className="button secondary small"
            aria-expanded={visible}
            aria-controls="document-assistant"
            onClick={visible ? hideAssistant : openAssistant}
          >
            <PanelRight size={16} />
            {visible ? t("隐藏助手") : t("打开学习助手")}
          </button>
        </div>
      </div>
      <div
        className={cn(
          "split-workspace",
          (!visible || floating) && "reader-expanded",
        )}
        style={{ "--reader-width": `${ratio}%` } as CSSProperties}
      >
        <div className="reader-side">
          <PdfReader
            id={id}
            page={page}
            count={count}
            onPage={onPage}
            fullscreen={fullscreen}
            onExpand={() => setFullscreen(true)}
          />
        </div>
        {visible && !floating && (
          <button
            type="button"
            className="split-handle"
            role="separator"
            aria-label={t("阅读区域宽度")}
            aria-orientation="vertical"
            aria-valuemin={Math.round(splitPercent(0, width))}
            aria-valuemax={Math.round(splitPercent(100, width))}
            aria-valuenow={Math.round(ratio)}
            title={t("拖动分隔线调整阅读宽度")}
            onPointerDown={(event) => begin(event, "split")}
            {...pointerHandlers}
            onKeyDown={(event) => {
              if (
                ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
              ) {
                event.preventDefault();
                setSplit(
                  splitPercent(
                    event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? 100
                        : ratio + (event.key === "ArrowLeft" ? -2 : 2),
                    width,
                  ),
                );
              }
            }}
          />
        )}
        <aside
          id="document-assistant"
          hidden={!visible}
          aria-label={t("学习助手")}
          className={cn("assistant-side", floating && "assistant-floating")}
          style={
            floating
              ? {
                  left: position.x,
                  top: position.y,
                  width: position.width,
                  height: position.height,
                }
              : undefined
          }
        >
          <div className="assistant-window-bar">
            <button
              ref={windowHeader}
              type="button"
              className={cn("assistant-grip", floating && "is-draggable")}
              aria-label={floating ? t("移动助手窗口") : t("学习助手")}
              title={floating ? t("拖动标题栏移动，方向键微调") : t("学习助手")}
              onPointerDown={
                floating ? (event) => begin(event, "move") : undefined
              }
              onKeyDown={floating ? (event) => arrows(event, false) : undefined}
              {...pointerHandlers}
            >
              {floating ? <Move size={16} /> : <PanelRight size={16} />}
              <span>{t("学习助手")}</span>
            </button>
            <div className="assistant-window-actions">
              {floating && (
                <button
                  type="button"
                  className="icon-button"
                  aria-label={t("重置窗口位置")}
                  title={t("重置窗口位置")}
                  onClick={() => setRect(initialWindow(viewport))}
                >
                  <RotateCcw size={16} />
                </button>
              )}
              {!narrow && !fullscreen && (
                <button
                  type="button"
                  className="icon-button"
                  aria-label={floating ? t("停靠右侧") : t("设为悬浮窗")}
                  title={floating ? t("停靠右侧") : t("设为悬浮窗")}
                  onClick={() => setMode(floating ? "docked" : "floating")}
                >
                  {floating ? (
                    <PanelRight size={17} />
                  ) : (
                    <PictureInPicture2 size={17} />
                  )}
                </button>
              )}
              <button
                type="button"
                className="icon-button"
                aria-label={t("隐藏学习助手")}
                title={t("隐藏学习助手")}
                onClick={hideAssistant}
              >
                <X size={18} />
              </button>
            </div>
          </div>
          {children}
          {floating && (
            <div className="assistant-window-bottom">
              <span>{t("拖动标题栏移动 · 右下角调整大小")}</span>
              <button
                type="button"
                className="assistant-resize"
                aria-label={t("调整助手窗口大小")}
                title={t("拖动调整大小，方向键微调")}
                onPointerDown={(event) => begin(event, "resize")}
                onKeyDown={(event) => arrows(event, true)}
                {...pointerHandlers}
              >
                <Scaling size={18} />
              </button>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
