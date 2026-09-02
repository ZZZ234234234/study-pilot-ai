"use client";
import { useLocale } from "@/components/locale-provider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
} from "lucide-react";
import { Logo, ThemeToggle, Badge } from "./ui";
import type { Settings } from "@/lib/types";
import { cn } from "@/lib/api";
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
  const { data } = useSWR<Settings>("/settings");
  return (
    <div className="app-shell">
      {open && (
        <button
          className="nav-scrim"
          aria-label={t("关闭导航")}
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={cn("sidebar", open && "is-open")}>
        <div className="sidebar-brand">
          <Logo />
          <button
            className="icon-button mobile-only"
            aria-label={t("关闭菜单")}
            onClick={() => setOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
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
              className="icon-button mobile-only"
              aria-label={t("打开菜单")}
              onClick={() => setOpen(true)}
            >
              <Menu size={22} />
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
                      : path.includes("settings")
                        ? t("设置")
                        : t("学习概览")}
            </strong>
          </div>
          <div className="topbar-right">
            <span className="desktop-only">{t("学得更清楚一点")}</span>
            <Badge tone={data?.mode === "live" ? "green" : "amber"}>
              {data?.mode === "live" ? t("已连接 AI") : t("演示模式")}
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
