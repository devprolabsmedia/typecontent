import { CheckCircle2, ChevronDown, Info, TriangleAlert, XCircle } from "lucide-react";
import { useState, type ReactNode } from "react";

import { writingCategoryLabels, type WritingResult } from "@/core/analyzers/writing";
import { cn } from "@/lib/utils";
import type { SEOStatus } from "@/types/typecontent";

const icon: Record<SEOStatus, ReactNode> = {
  pass: <CheckCircle2 className="size-4 text-success" aria-hidden />,
  warning: <TriangleAlert className="size-4 text-warning" aria-hidden />,
  error: <XCircle className="size-4 text-destructive" aria-hidden />,
  info: <Info className="size-4 text-muted-foreground" aria-hidden />,
};

const statusLabel = { good: "Good", ok: "Fair", attention: "Needs attention" } as const;
const statusTone = {
  good: "text-success",
  ok: "text-warning",
  attention: "text-destructive",
} as const;

/** Renders a WritingResult. No analysis logic lives here. */
export function WritingPanel({ writing }: { writing: WritingResult }) {
  const [open, setOpen] = useState<string | null>(null);
  const s = writing.stats;
  const tone =
    writing.score >= 80
      ? "text-success"
      : writing.score >= 50
        ? "text-warning"
        : "text-destructive";

  return (
    <div className="space-y-4">
      <div>
        <div className="label-xs">Writing quality</div>
        <div className={cn("font-mono text-4xl font-semibold", tone)}>
          {writing.score}
          <span className="text-base text-muted-foreground"> / 100</span>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-2 font-mono text-xs">
        {writing.categories.map((c) => (
          <div key={c.id} className="rounded-md border border-border px-2 py-1.5">
            <dt className="text-muted-foreground">{c.label}</dt>
            <dd className={statusTone[c.status]}>{statusLabel[c.status]}</dd>
          </div>
        ))}
      </dl>

      <dl className="grid grid-cols-2 gap-2 font-mono text-xs">
        {[
          ["Average sentence", `${s.avgSentenceWords} words`],
          ["Long sentences", s.longSentences],
          ["Average paragraph", `${s.avgParagraphSentences} sentences`],
          ["Passive voice", `~${s.passivePercent}%`],
        ].map(([k, v]) => (
          <div key={k} className="rounded-md border border-border px-2 py-1.5">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="text-foreground">{v}</dd>
          </div>
        ))}
      </dl>

      <ul className="divide-y divide-border rounded-md border border-border">
        {(Object.keys(writingCategoryLabels) as (keyof typeof writingCategoryLabels)[]).flatMap(
          (cat) => {
            const checks = writing.checks.filter((c) => c.category === cat);
            if (!checks.length) return [];
            return [
              <li key={`h-${cat}`} className="label-xs bg-secondary/40 px-2.5 py-1.5">
                {writingCategoryLabels[cat]}
              </li>,
              ...checks.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => setOpen(open === c.id ? null : c.id)}
                    aria-expanded={open === c.id}
                    className="flex w-full items-center gap-2 px-2.5 py-2 text-left text-sm hover:bg-accent/50"
                  >
                    {icon[c.status]}
                    <span className="flex-1">{c.label}</span>
                    <ChevronDown
                      aria-hidden
                      className={cn(
                        "size-3.5 text-muted-foreground transition",
                        open === c.id && "rotate-180",
                      )}
                    />
                  </button>
                  {open === c.id && (
                    <div className="space-y-1 px-8 pb-2.5 text-xs text-muted-foreground">
                      <p className="text-foreground">{c.message}</p>
                      {c.details && <p>{c.details}</p>}
                    </div>
                  )}
                </li>
              )),
            ];
          },
        )}
      </ul>
      <p className="text-[11px] text-muted-foreground">
        Writing quality — simple, local heuristics. Separate from the SEO score; never rewrites your
        text.
      </p>
    </div>
  );
}
