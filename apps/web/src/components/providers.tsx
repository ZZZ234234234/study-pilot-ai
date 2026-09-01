"use client";
import { ThemeProvider } from "next-themes";
import { SWRConfig } from "swr";
import { Toaster } from "sonner";
import { api } from "@/lib/api";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <SWRConfig
        value={{ fetcher: api, revalidateOnFocus: false, errorRetryCount: 1 }}
      >
        {children}
        <Toaster position="bottom-right" richColors closeButton />
      </SWRConfig>
    </ThemeProvider>
  );
}
