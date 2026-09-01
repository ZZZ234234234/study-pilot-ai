"use client";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  LoaderCircle,
  Moon,
  Sun,
  AlertCircle,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";
import { cn, errorMessage } from "@/lib/api";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="logo" aria-label="StudyPilot home">
      <span className="logo-mark">
        <svg viewBox="0 0 28 28" aria-hidden="true">
          <path d="M5 6h7l4 4H9v5h10v7h-7l-4-4h7v-5H5z" fill="currentColor" />
        </svg>
      </span>
      {!compact && (
        <span>
          StudyPilot<span className="logo-ai">AI</span>
        </span>
      )}
    </Link>
  );
}
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      className="icon-button theme-toggle"
      aria-label="Toggle color theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun size={18} className="sun" />
      <Moon size={18} className="moon" />
    </button>
  );
}
export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <span className="loading-inline" role="status">
      <LoaderCircle size={17} className="spin" />
      {label}
    </span>
  );
}
export function ErrorState({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  return (
    <div className="error-state" role="alert">
      <AlertCircle size={23} />
      <div>
        <strong>We couldn’t complete that.</strong>
        <p>{errorMessage(error)}</p>
        {retry && (
          <button className="text-button" onClick={retry}>
            Try again <ArrowUpRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <BookOpen size={30} strokeWidth={1.4} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children}
    </div>
  );
}
export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "green" | "amber" | "neutral";
}) {
  return <span className={cn("badge", `badge-${tone}`)}>{children}</span>;
}
export function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="skeleton-group" aria-label="Loading content" role="status">
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{ width: `${100 - i * 10}%` }}
        />
      ))}
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-header">
        <h2>{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
