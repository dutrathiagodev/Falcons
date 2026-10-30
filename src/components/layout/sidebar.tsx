"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "./sidebar-context";
import {
  BarChart3,
  CalendarRange,
  ChevronLeft,
  LayoutDashboard,
  LogOut,
  Menu,
  Users,
  Volleyball,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/api-client";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    hint: "Visao geral",
  },
  {
    href: "/players",
    label: "Atletas",
    icon: Users,
    hint: "Elenco e cadastro",
  },
  {
    href: "/lineup",
    label: "Escalacao",
    icon: Volleyball,
    hint: "Rotacoes e titulares",
  },
  {
    href: "/statistics",
    label: "Estatisticas",
    icon: BarChart3,
    hint: "Desempenho e leitura",
  },
  {
    href: "/games",
    label: "Jogos",
    icon: CalendarRange,
    hint: "Agenda e resultados",
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, toggleSidebar } = useSidebar();

  async function handleLogout() {
    await apiRequest("/api/auth/logout", "POST").catch(() => {});
    router.replace("/login");
    router.refresh();
  }

  if (pathname === "/login") return null;

  return (
    <>
      <button
        className="mobile-menu-button"
        onClick={toggleSidebar}
        aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
      >
        {isOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
      </button>

      <div
        className={cn("sidebar-overlay", isOpen && "is-visible")}
        onClick={toggleSidebar}
      />

      <aside className={cn("app-sidebar", isOpen ? "is-open" : "is-collapsed")}>
        <div className="sidebar-shell">
          <div className="sidebar-brand">
            <div className="sidebar-brand-mark">
              <Image
                src="/falcons-volley-logo.png"
                alt="Logo Falcons Volei"
                width={36}
                height={36}
                className="sidebar-brand-logo"
                priority
              />
            </div>
            <div className="sidebar-brand-copy">
              <strong>Falcons Volei</strong>
              <span>Atletica FAP</span>
            </div>
          </div>

          <div className="sidebar-section-label">Navegacao</div>

          <nav className="sidebar-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn("sidebar-link", isActive && "is-active")}
                  onClick={() => {
                    if (window.innerWidth < 1024 && isOpen) {
                      toggleSidebar();
                    }
                  }}
                >
                  <span className="sidebar-link-icon">
                    <Icon size={18} />
                  </span>
                  <span className="sidebar-link-text">
                    <strong>{item.label}</strong>
                    <small>{item.hint}</small>
                  </span>
                </Link>
              );
            })}
          </nav>

          <button className="btn btn-secondary" type="button" onClick={handleLogout}>
            <LogOut size={16} />
            Sair
          </button>

          <div className="sidebar-foot-card">
            <span className="sidebar-foot-chip">Temporada 2026</span>
            <h3>Operacao esportiva</h3>
            <p>
              Controle elenco, acompanhe desempenho e mantenha a leitura da
              temporada em um unico painel.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
