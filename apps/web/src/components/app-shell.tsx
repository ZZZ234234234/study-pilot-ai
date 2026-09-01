"use client";
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
} from "lucide-react";
import { Logo, ThemeToggle, Badge } from "./ui";
import type { Settings } from "@/lib/types";
import { cn } from "@/lib/api";

const nav = [
  { href: "/app", label: "Overview", icon: LayoutDashboard },
  { href: "/app/library", label: "My library", icon: Library },
  { href: "/app/study-plan", label: "Study plan", icon: CalendarDays },
];
export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const { data } = useSWR<Settings>("/settings");
  return (
    <div className="app-shell">
      {open && (
        <button
          className="nav-scrim"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={cn("sidebar", open && "is-open")}>
        <div className="sidebar-brand">
          <Logo />
          <button
            className="icon-button mobile-only"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        <div className="workspace-label">
          <span className="workspace-avatar">P</span>
          <div>
            Personal workspace<small>Your space to understand</small>
          </div>
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav aria-label="Main navigation">
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
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-note">
          <Leaf size={23} />
          <strong>
            A little progress,
            <br />
            every day.
          </strong>
          <p>
            Make knowledge yours.
            <br />
            One good question at a time.
          </p>
          <Link href="/app/library" onClick={() => setOpen(false)}>
            Open your library <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="sidebar-bottom">
          <Link
            href="/app/settings"
            className={cn("nav-link", path === "/app/settings" && "active")}
            onClick={() => setOpen(false)}
          >
            <Settings2 size={18} />
            Settings
          </Link>
          <Link href="/privacy" className="nav-link">
            <ShieldCheck size={18} />
            Privacy & data
          </Link>
          <div className="profile">
            <span className="profile-dot" />
            <div>
              Local-first mindset<small>Open source. Yours to build.</small>
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
              aria-label="Open menu"
              onClick={() => setOpen(true)}
            >
              <Menu size={22} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>
              {path.includes("documents")
                ? "Document workspace"
                : path.includes("library")
                  ? "My library"
                  : path.includes("study-plan")
                    ? "Study plan"
                    : path.includes("settings")
                      ? "Settings"
                      : "Overview"}
            </strong>
          </div>
          <div className="topbar-right">
            <span className="desktop-only">A clearer way to learn</span>
            <Badge tone={data?.mode === "live" ? "green" : "amber"}>
              {data?.mode === "live" ? "AI connected" : "Demo mode"}
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
