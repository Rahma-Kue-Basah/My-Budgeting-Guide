import type { Metadata } from "next";
import "./globals.css";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { AppSettingsSync } from "@/components/shell/app-settings-sync";
import { ThemeProvider } from "@/components/shell/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({ subsets: ["latin"], variable: "--font-heading" });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans" });

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
    <html lang="en" suppressHydrationWarning className={cn("font-sans", inter.variable, plusJakarta.variable)}>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <AppSettingsSync />
            <TooltipProvider>
              <div id="app-root">
                {children}
                <Toaster position="top-right" />
              </div>
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
