import { CheckCircle2, ChevronDown, Info, TriangleAlert, XCircle } from "lucide-react";
import { useState, type ReactNode } from "react";

import { writingCategoryLabels, type WritingResult } from "@/core/analyzers/writing";
import {
  writingIssueCategoryLabels,
  type WritingIssue,
  type WritingIssueCategory,
} from "@/core/analyzers/writing-issues";
import { cn } from "@/lib/utils";
import type { SEOStatus } from "@/types/typecontent";

const icon: Record<SEOStatus, ReactNode> = {
  pass: <CheckCircle2 className="size-4 text-success" aria-hidden />,
  warning: <TriangleAlert className="size-4 text-warning" aria-hidden />,
  error: <XCircle className="size-4 text-destructive" aria-hidden />,
  info: <Info className="size-4 text-muted-foreground" aria-hidden />,
};

const issueIcon = {
  error: <XCircle className="size-4 shrink-0 text-destructive" aria-hidden />,
  warning: <TriangleAlert className="size-4 shrink-0 text-warning" aria-hidden />,
  suggestion: <Info className="size-4 shrink-0 text-muted-foreground" aria-hidden />,
} as const;

const statusLabel = { good: "Good", ok: "Fair", attention: "Needs attention" } as const;
const statusTone = {
  good: "text-success",
  ok: "text-warning",
  attention: "text-destructive",
} as const;

const scoreTone = (n: number) =>
  n >= 80 ? "text-success" : n >= 50 ? "text-warning" : "text-destructive";

function IssueItem({
  issue,
  onApply,
  onIgnore,
}: {
  issue: WritingIssue;
  onApply: (issue: WritingIssue, suggestion: string) => void;
  onIgnore: (issue: WritingIssue) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <li className="border-b border-border last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-2.5 py-2 text-left text-sm hover:bg-accent/50"
      >
        {issueIcon[issue.severity]}
        <span className="flex-1">{issue.message}</span>
        <ChevronDown
          aria-hidden
          className={cn("size-3.5 text-muted-foreground transition", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="space-y-2 px-8 pb-3 text-xs text-muted-foreground">
          <p className="text-foreground">{issue.message}</p>
          {issue.explanation && <p>{issue.explanation}</p>}
          <p>
            <span className="text-muted-foreground">Original: </span>
            <mark className="rounded bg-destructive/15 px-1 text-foreground">
              {issue.original.length > 120 ? `${issue.original.slice(0, 120)}…` : issue.original}
            </mark>
          </p>
          {issue.suggestions.length > 0 && (
            <p>
              <span className="text-muted-foreground">Suggestion: </span>
              <span className="rounded bg-success/15 px-1 text-foreground">
                {issue.suggestions[0]}
              </span>
            </p>
          )}
          <div className="flex gap-2 pt-1">
            {issue.canAutoApply && issue.suggestions[0] !== undefined && (
              <button
                onClick={() => onApply(issue, issue.suggestions[0]!)}
                className="rounded-md border border-border px-2.5 py-1 text-xs text-foreground hover:bg-accent"
              >
                Apply
              </button>
            )}
            <button
              onClick={() => onIgnore(issue)}
              className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Ignore
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

/** Renders a WritingResult plus actionable issues. No analysis logic lives here. */
export function WritingPanel({
  writing,
  issues,
  issueScores,
  onApplyIssue,
  onIgnoreIssue,
}: {
  writing: WritingResult;
  issues: WritingIssue[];
  issueScores: Record<WritingIssueCategory, number>;
  onApplyIssue: (issue: WritingIssue, suggestion: string) => void;
  onIgnoreIssue: (issue: WritingIssue) => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const s = writing.stats;
  const tone = scoreTone(writing.score);

  return (
    <div className="space-y-4">
      <div>
        <div className="label-xs">Writing quality</div>
        <div className={cn("font-mono text-4xl font-semibold", tone)}>
          {writing.score}
          <span className="text-base text-muted-foreground"> / 100</span>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-2 font-mono text-xs">
        {(Object.keys(writingIssueCategoryLabels) as WritingIssueCategory[]).map((cat) => (
          <div key={cat} className="rounded-md border border-border px-2 py-1.5">
            <dt className="text-muted-foreground">{writingIssueCategoryLabels[cat]}</dt>
            <dd className={scoreTone(issueScores[cat])}>{issueScores[cat]}</dd>
          </div>
        ))}
      </dl>

      <section aria-label="Writing issues">
        <div className="label-xs mb-1.5">Issues · {issues.length}</div>
        {issues.length === 0 ? (
          <p className="rounded-md border border-border px-2.5 py-2 text-xs text-muted-foreground">
            No issues found. Checks are conservative by design.
          </p>
        ) : (
          <ul className="rounded-md border border-border">
            {(Object.keys(writingIssueCategoryLabels) as WritingIssueCategory[]).map((cat) => {
              const list = issues.filter((i) => i.category === cat);
              if (!list.length) return null;
              return (
                <li key={cat}>
                  <div className="label-xs bg-secondary/40 px-2.5 py-1.5">
                    {writingIssueCategoryLabels[cat]}
                  </div>
                  <ul>
                    {list.map((i) => (
                      <IssueItem
                        key={i.id}
                        issue={i}
                        onApply={onApplyIssue}
                        onIgnore={onIgnoreIssue}
                      />
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}
      </section>

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
