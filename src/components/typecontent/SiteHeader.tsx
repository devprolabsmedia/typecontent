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
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-6 px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-6 place-items-center rounded bg-primary font-mono text-xs text-primary-foreground">
            T
          </span>
          {SITE.name}
          <span className="rounded border border-border px-1.5 font-mono text-[10px] text-muted-foreground">
            {SITE.version}
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: true }}
              className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
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
          className="ml-auto inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <Github className="size-4" /> GitHub
        </a>
      </div>
    </header>
  );
}
