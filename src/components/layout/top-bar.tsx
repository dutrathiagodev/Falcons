"use client";

import type { ReactNode } from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";

interface TopBarProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionIcon?: ReactNode;
  badge?: string;
  onAction?: () => void;
  extra?: ReactNode;
}

export default function TopBar({
  title,
  description,
  actionLabel,
  actionIcon,
  badge,
  onAction,
  extra,
}: TopBarProps) {
  return (
    <header className="page-hero">
      <div className="page-hero-copy">
        <div className="page-hero-kicker">
          <Sparkles size={14} />
          <span>{badge || "Central de operacoes"}</span>
        </div>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>

      <div className="page-hero-actions">
        {extra}
        {actionLabel && onAction ? (
          <button className="btn btn-primary" onClick={onAction}>
            {actionIcon}
            <span>{actionLabel}</span>
            <ArrowUpRight size={16} />
          </button>
        ) : null}
      </div>
    </header>
  );
}
