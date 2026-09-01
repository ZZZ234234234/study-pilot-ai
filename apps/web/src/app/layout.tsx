import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "StudyPilot AI — Turn PDFs into structured knowledge",
    template: "%s · StudyPilot AI",
  },
  description:
    "An open-source AI study workspace. Extract knowledge from PDFs, build a review plan, and ask questions grounded in the original pages.",
  openGraph: {
    title: "StudyPilot AI",
    description: "Upload. Understand. Review. Ask.",
    type: "website",
  },
  icons: { icon: "/logo.svg" },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
