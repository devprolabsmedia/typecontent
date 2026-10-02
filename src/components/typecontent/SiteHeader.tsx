import { Link } from "@tanstack/react-router";
import { Github } from "lucide-react";

import tcLogoUrl from "@/assets/tc-logo.png";
import { SITE } from "@/core/content/site";

const nav = [
  { to: "/", label: "Playground" },
  { to: "/content-types", label: "Content Types" },
  { to: "/docs", label: "Docs" },
] as const;

/** Threads brand mark — lucide has no brand icons for Threads. */
function ThreadsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.936 11.254c-.105-.05-.212-.098-.32-.144-.189-3.231-1.977-5.08-4.998-5.099h-.04c-1.806 0-3.308.77-4.233 2.171l1.658 1.14c.69-1.048 1.773-1.271 2.575-1.271h.027c.994.006 1.744.296 2.23.86.354.407.592.97.712 1.675a12.38 12.38 0 0 0-2.82-.132c-2.836.163-4.659 1.816-4.535 4.113.063 1.161.64 2.159 1.625 2.81.835.552 1.911.822 3.03.759 1.476-.081 2.634-.644 3.44-1.675.614-.781 1.002-1.794 1.174-3.068.705.426 1.227.985 1.517 1.66.49 1.147.519 3.033-1.018 4.569-1.35 1.349-2.972 1.933-5.429 1.951-2.737-.02-4.806-.898-6.15-2.61C4.093 14.742 3.46 12.63 3.436 10c.024-2.63.657-4.742 1.881-6.278 1.344-1.712 3.413-2.59 6.15-2.61 2.756.02 4.869.902 6.277 2.623.687.839 1.204 1.894 1.546 3.122l1.944-.52c-.415-1.524-1.073-2.845-1.966-3.94C17.635.374 15.026-.73 11.474-.753 7.943-.73 5.269.375 3.544 2.575 2.063 4.457 1.295 7.002 1.269 10.01v.01c.026 2.999.794 5.543 2.275 7.425 1.725 2.2 4.4 3.305 7.93 3.328h.012c3.017-.021 5.135-.786 6.914-2.563 2.285-2.284 2.216-5.148 1.463-6.916-.542-1.269-1.575-2.302-2.927-3.04Zm-4.96 5.092c-1.237.07-2.523-.486-2.587-1.679-.048-.884.63-1.87 2.666-1.987.233-.013.462-.02.687-.02.738 0 1.427.072 2.055.21-.234 2.915-1.601 3.409-2.821 3.476Z" />
    </svg>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4 md:gap-6">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <img
            src={tcLogoUrl}
            alt=""
            className="size-6 rounded object-contain"
            aria-hidden="true"
          />
          {SITE.name}
          <span className="hidden rounded border border-border px-1.5 sm:inline font-mono text-[10px] text-muted-foreground">
            {SITE.version}
          </span>
        </Link>
        <nav
          aria-label="Main"
          className="flex min-w-0 items-center gap-0.5 overflow-x-auto text-sm"
        >
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: true }}
              className="shrink-0 whitespace-nowrap rounded-md px-2 py-1.5 text-muted-foreground sm:px-3 transition-colors hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <a
          href={SITE.threadsUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="TypeContent on Threads"
          className="ml-auto inline-flex shrink-0 items-center p-2 text-muted-foreground hover:text-foreground"
        >
          <ThreadsIcon className="size-4" />
        </a>
        <a
          href={SITE.githubUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="TypeContent on GitHub"
          className="inline-flex shrink-0 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <Github className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">GitHub</span>
        </a>
      </div>
    </header>
  );
}
