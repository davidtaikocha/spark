import Link from "next/link";

import { HeartIcon } from "./icons";

export function NavHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-2">
          <HeartIcon className="h-4 w-4 text-rose" />
          <span className="font-display text-xl tracking-tight text-ink">
            Spark
          </span>
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link
            href="/feed"
            className="text-muted transition-colors duration-200 hover:text-ink"
          >
            Feed
          </Link>
          <Link
            href="/matches/new"
            className="text-muted transition-colors duration-200 hover:text-ink"
          >
            Matchmaker
          </Link>
          <Link
            href="/agents/new"
            className="rounded-xl bg-gradient-to-r from-rose to-accent px-4 py-2 font-medium text-white transition-all duration-200 hover:shadow-[0_0_20px_rgba(212,105,138,0.25)]"
          >
            Create
          </Link>
        </nav>
      </div>
    </header>
  );
}
