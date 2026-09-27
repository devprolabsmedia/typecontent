import { Link } from "@tanstack/react-router";
import { Github } from "lucide-react";

import { SITE } from "@/core/content/site";

const nav = [
  { to: "/", label: "Playground" },
  { to: "/content-types", label: "Content Types" },
  { to: "/docs", label: "Docs" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4 md:gap-6">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-6 place-items-center rounded bg-primary font-mono text-xs text-primary-foreground">
            T
          </span>
          {SITE.name}
          <span className="hidden rounded border border-border px-1.5 sm:inline font-mono text-[10px] text-muted-foreground">
            {SITE.version}
          </span>
        </Link>
        <nav aria-label="Main" className="flex min-w-0 items-center gap-0.5 overflow-x-auto text-sm">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: true }}
              className="shrink-0 whitespace-nowrap rounded-md px-2 py-1.5 text-muted sm:px-3-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <a
          href={SITE.githubUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="TypeContent on GitHub"
          className="ml-auto inline-flex shrink-0 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <Github className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">GitHub</span>
        </a>
      </div>
    </header>
  );
}
