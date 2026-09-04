"use client";
import { useLocale } from "@/components/locale-provider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import useSWR from "swr";
import {
  LayoutDashboard,
  Library,
  CalendarDays,
  Settings2,
  ChevronRight,
  Menu,
  X,
  ShieldCheck,
  ArrowUpRight,
  Leaf,
  Files,
  PanelLeftClose,
  PanelLeftOpen,
  Cable,
} from "lucide-react";
import { Logo, ThemeToggle, Badge } from "./ui";
import type { Settings } from "@/lib/types";
import { cn } from "@/lib/api";
import {
  useReadingPreference,
  useReadingViewport,
} from "@/lib/reading-preferences";
import { useFocusLayer } from "./use-focus-layer";
const navigationStates = ["closed", "open"] as const;
const nav = [
  { href: "/app", label: "学习概览", icon: LayoutDashboard },
  { href: "/app/library", label: "我的资料", icon: Library },
  { href: "/app/study-plan", label: "复习计划", icon: CalendarDays },
  { href: "/app/tools", label: "学习工具箱", icon: Files },
];
export function AppShell({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [navigation, setNavigation] = useReadingPreference(
    "studypilot:navigation",
    navigationStates,
    "closed",
  );
  const compact = useReadingViewport().width <= 1080;
  const expanded = compact ? open : navigation === "open";
  const sidebar = useRef<HTMLElement>(null);
  const navigationToggle = useRef<HTMLButtonElement>(null);
  const closeDrawer = useCallback(() => setOpen(false), []);
  useFocusLayer(compact && open, sidebar, closeDrawer);
  const { data } = useSWR<Settings>("/settings");
  return (
    <div
      className={cn(
        "app-shell",
        !expanded && "nav-collapsed",
        compact && "nav-overlay",
        path.includes("/documents/") && "reading-shell",
      )}
    >
      {compact && open && (
        <button
          className="nav-scrim"
          data-layer-backdrop
          tabIndex={-1}
          aria-hidden="true"
          aria-label={t("关闭导航")}
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        ref={sidebar}
        id="workspace-navigation"
        tabIndex={-1}
        inert={!expanded}
        role={compact ? "dialog" : undefined}
        aria-modal={compact && open ? true : undefined}
        aria-label={t("主要导航")}
        className={cn("sidebar", expanded && "is-open")}
      >
        <div className="sidebar-brand">
          <Logo />
          <button
            className="icon-button"
            data-layer-focus
            aria-label={compact ? t("关闭菜单") : t("收起导航")}
            title={t("收起导航")}
            onClick={() => {
              setOpen(false);
              if (!compact) {
                setNavigation("closed");
                navigationToggle.current?.focus();
              }
            }}
          >
            <X size={20} />
          </button>
        </div>
        <section className="creator-proof" aria-label={t("作者与官方版本")}>
          <div className="creator-proof-heading">
            <ShieldCheck size={15} />
            <span>{t("作者与官方版本")}</span>
          </div>
          <p>{t("嘉兴大学 · 通信专业")}</p>
          <strong>{t("爱吃孜然芥末 制作完成")}</strong>
          <a href="mailto:2014546082@qq.com">
            {t("有任何使用问题请联系")}
            <span>2014546082@qq.com</span>
          </a>
          <Link
            href="/app/authenticity"
            onClick={() => setOpen(false)}
            className="creator-proof-link"
          >
            {t("真伪核验与维权说明")}
            <ChevronRight size={14} />
          </Link>
        </section>
        <div className="workspace-label">
          <span className="workspace-avatar">P</span>
          <div>
            {t("个人学习空间")}
            <small>{t("让知识慢慢变清晰")}</small>
          </div>
        </div>
        <p className="nav-label">{t("学习空间")}</p>
        <nav aria-label={t("主要导航")}>
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "nav-link",
                (href === "/app" ? path === href : path.startsWith(href)) &&
                  "active",
              )}
            >
              <Icon size={19} />
              {t(label)}
            </Link>
          ))}
        </nav>
        <div className="sidebar-note">
          <Leaf size={23} />
          <strong>
            {t("每天一点进步，")}
            <br />
            {t("知识逐渐成形。")}
          </strong>
          <p>
            {t("把知识变成自己的。")}
            <br />
            {t("从一个好问题开始。")}
          </p>
          <Link href="/app/library" onClick={() => setOpen(false)}>
            {t("打开我的资料")}
            <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="sidebar-bottom">
          <Link
            href="/app/models"
            className={cn("nav-link", path === "/app/models" && "active")}
            onClick={() => setOpen(false)}
          >
            <Cable size={18} />
            {t("API 接入")}
          </Link>
          <Link
            href="/app/settings"
            className={cn("nav-link", path === "/app/settings" && "active")}
            onClick={() => setOpen(false)}
          >
            <Settings2 size={18} />
            {t("设置")}
          </Link>
          <Link href="/privacy" className="nav-link">
            <ShieldCheck size={18} />
            {t("隐私与数据")}
          </Link>
          <div className="profile">
            <span className="profile-dot" />
            <div>
              {t("尊重你的数据边界")}
              <small>{t("开源，自由搭建。")}</small>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </aside>
      <div className="app-main">
        <header className="app-topbar">
          <div className="breadcrumb">
            <button
              ref={navigationToggle}
              className="icon-button navigation-toggle"
              aria-label={
                compact
                  ? t("打开菜单")
                  : expanded
                    ? t("收起导航")
                    : t("展开导航")
              }
              aria-controls="workspace-navigation"
              aria-expanded={expanded}
              title={expanded ? t("收起导航") : t("展开导航")}
              onClick={() =>
                compact
                  ? setOpen(true)
                  : setNavigation(expanded ? "closed" : "open")
              }
            >
              {compact ? (
                <Menu size={22} />
              ) : expanded ? (
                <PanelLeftClose size={20} />
              ) : (
                <PanelLeftOpen size={20} />
              )}
            </button>
            <span>{t("学习空间")}</span>
            <ChevronRight size={13} />
            <strong>
              {path.includes("documents")
                ? t("文档学习空间")
                : path.includes("library")
                  ? t("我的资料")
                  : path.includes("study-plan")
                    ? t("复习计划")
                    : path.includes("tools")
                      ? t("学习工具箱")
                      : path.includes("models")
                        ? t("API 接入")
                        : path.includes("authenticity")
                          ? t("真伪核验与维权")
                          : path.includes("settings")
                            ? t("设置")
                            : t("学习概览")}
            </strong>
          </div>
          <div className="topbar-right">
            <span className="desktop-only">{t("学得更清楚一点")}</span>
            <Badge
              tone={
                data?.chat_available || data?.mode === "live"
                  ? "green"
                  : "amber"
              }
            >
              {data?.chat_available
                ? t("AI 已配置")
                : data?.mode === "live"
                  ? t("已连接 AI")
                  : t("演示模式")}
            </Badge>
          </div>
        </header>
        <main
          id="main-content"
          className={cn(
            "app-content",
            path.includes("/documents/") && "document-content",
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
