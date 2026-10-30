import type { Metadata } from "next";
import { DM_Sans, Oswald } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import Sidebar from "@/components/layout/sidebar";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { cn } from "@/lib/utils";

const oswald = Oswald({
  variable: "--font-heading",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Falcons Volei | Gestao da Atletica",
  description:
    "Plataforma para gerenciar elenco, estatisticas, jogos e escalacoes da Atletica Falcons.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={cn(oswald.variable, dmSans.variable)}>
      <body>
        <SidebarProvider>
          <Sidebar />
          <div className="app-shell">
            <div className="app-gradient" />
            <main className="app-main">{children}</main>
          </div>
          <SpeedInsights />
        </SidebarProvider>
      </body>
    </html>
  );
}
