import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { AppShell } from "@/components/shell/app-shell";
import { AppSettingsSync } from "@/components/shell/app-settings-sync";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Nidhi.id - Budgeting Made Simple",
  description: "Simple workspace layout with a Notion-like sidebar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
      {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document */}
      <script dangerouslySetInnerHTML={{ __html: `try{var s=localStorage.getItem('nidhi-app-settings-v1');var t=s?JSON.parse(s).theme:'light';var mq=window.matchMedia('(prefers-color-scheme: dark)');if(t==='dark'||(t==='system'&&mq.matches)){document.documentElement.classList.add('dark');}}catch(e){}` }} />
      <body>
        <AppSettingsSync />
        <TooltipProvider>
          <div id="app-root">
            <AppShell>{children}</AppShell>
            <Toaster position="top-right" />
          </div>
        </TooltipProvider>
      </body>
    </html>
  );
}
