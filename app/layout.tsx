import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { AppSettingsSync } from "@/components/app-settings-sync";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "MBG",
  description: "Simple workspace layout with a Notion-like sidebar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <body>
        <AppSettingsSync />
        <TooltipProvider>
          <AppShell>{children}</AppShell>
          <Toaster position="top-right" />
        </TooltipProvider>
      </body>
    </html>
  );
}
