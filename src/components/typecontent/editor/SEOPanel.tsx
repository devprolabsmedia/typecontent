import { CheckCircle2, ChevronDown, Info, TriangleAlert, XCircle } from "lucide-react";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { SEOResult, SEOStatus } from "@/types/typecontent";

const icon: Record<SEOStatus, ReactNode> = {
  pass: <CheckCircle2 className="size-4 text-success" />,
  warning: <TriangleAlert className="size-4 text-warning" />,
  fail: <XCircle className="size-4 text-destructive" />,
  info: <Info className="size-4 text-muted-foreground" />,
};

interface Props {
  seo: SEOResult;
  enabled: boolean;
  metaDescription: string;
  onMetaDescription: (v: string) => void;
  focusKeyword: string;
  onFocusKeyword: (v: string) => void;
}

export function SEOPanel({ seo, enabled, metaDescription, onMetaDescription, focusKeyword, onFocusKeyword }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const tone = seo.score >= 80 ? "text-success" : seo.score >= 50 ? "text-warning" : "text-destructive";
  const s = seo.stats;

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="label-xs">SEO score</div>
          {enabled ? (
            <div className={cn("font-mono text-4xl font-semibold", tone)}>{seo.score}</div>
          ) : (
            <div className="text-sm text-muted-foreground">Disabled for this content type</div>
          )}
        </div>
        <div className="text-right font-mono text-xs text-muted-foreground">
          <div>{s.words} words</div>
          <div>{s.readingMinutes} min read</div>
        </div>
      </div>

      {enabled && (
        <>
          <label className="block space-y-1">
            <span className="label-xs">Focus keyword</span>
            <input
              value={focusKeyword}
              onChange={(e) => onFocusKeyword(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:border-ring"
            />
          </label>
          <label className="block space-y-1">
            <span className="label-xs flex justify-between">
              Meta description <span className="font-mono">{metaDescription.length}</span>
            </span>
            <textarea
              value={metaDescription}
              onChange={(e) => onMetaDescription(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:border-ring"
            />
          </label>
          <ul className="divide-y divide-border rounded-md border border-border">
            {seo.checks.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setOpen(open === c.id ? null : c.id)}
                  className="flex w-full items-center gap-2 px-2.5 py-2 text-left text-sm hover:bg-accent/50"
                >
                  {icon[c.status]}
                  <span className="flex-1">{c.label}</span>
                  <ChevronDown className={cn("size-3.5 text-muted-foreground transition", open === c.id && "rotate-180")} />
                </button>
                {open === c.id && <p className="px-8 pb-2.5 text-xs text-muted-foreground">{c.detail}</p>}
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="grid grid-cols-2 gap-2 font-mono text-xs">
        {[
          ["Headings", s.headings.length],
          ["Images", s.images],
          ["Internal links", s.internalLinks],
          ["External links", s.externalLinks],
          ["Code blocks", s.codeBlocks],
          ["Characters", s.characters],
        ].map(([k, v]) => (
          <div key={k} className="rounded-md border border-border px-2 py-1.5">
            <div className="text-muted-foreground">{k}</div>
            <div className="text-foreground">{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
