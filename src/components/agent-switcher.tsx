"use client";

import Link from "next/link";
import { useState } from "react";

const PAGE_SIZE = 12;

type Agent = {
  id: string;
  name: string;
  portraitUrl?: string;
};

export function AgentSwitcher({
  agents,
  activeId,
}: {
  agents: Agent[];
  activeId: string;
}) {
  // Always show active agent on its page
  const activeIndex = agents.findIndex((a) => a.id === activeId);
  const activePage = activeIndex >= 0 ? Math.floor(activeIndex / PAGE_SIZE) : 0;
  const [page, setPage] = useState(activePage);

  const totalPages = Math.ceil(agents.length / PAGE_SIZE);
  const pageAgents = agents.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (agents.length <= 1) return null;

  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-widest text-muted">
          Switch agent
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-muted transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-30"
            >
              <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
                <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span className="text-[10px] tabular-nums text-muted/60">
              {page + 1}/{totalPages}
            </span>
            <button
              type="button"
              disabled={page === totalPages - 1}
              onClick={() => setPage(page + 1)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-muted transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-30"
            >
              <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {pageAgents.map((agent) => {
          const isActive = agent.id === activeId;
          return (
            <Link
              key={agent.id}
              href={`/matches/new?agentId=${agent.id}`}
              title={agent.name}
              className={`group relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 transition-all duration-300 ${
                isActive
                  ? "border-rose shadow-[0_0_12px_rgba(212,105,138,0.4)] scale-110"
                  : "border-line hover:border-accent/50 hover:shadow-[0_0_10px_rgba(232,155,114,0.2)]"
              }`}
            >
              {agent.portraitUrl ? (
                <img
                  src={agent.portraitUrl}
                  alt={agent.name}
                  className="h-full w-full object-cover object-top"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-surface-raised">
                  <span className="font-display text-sm text-rose/40">
                    {agent.name.slice(0, 1)}
                  </span>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
