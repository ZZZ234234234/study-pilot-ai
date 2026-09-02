import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "StudyPilot AI｜把资料读懂，把知识留下",
    template: "%s · StudyPilot AI",
  },
  description:
    "开源 AI 学习助手：阅读 PDF、梳理知识点、制定复习计划，用带原文引用的问答帮助你真正理解资料。",
  openGraph: {
    title: "StudyPilot AI",
    description: "读懂资料，梳理知识，循序复习。",
    type: "website",
    locale: "zh_CN",
  },
  icons: { icon: "/logo.svg" },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
