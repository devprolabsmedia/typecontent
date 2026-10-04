/**
 * Deterministic Writing issue engine. Separate from the Writing score checks:
 * these are concrete, range-located issues a writer can Apply or Ignore.
 * Conservative by design — a false positive is worse than a missed issue.
 * No AI, no network, no React. Ranges point into the raw Markdown source so
 * Apply integrates with the editor's undo history.
 */

export type WritingIssueCategory = "correctness" | "clarity" | "style";
export type WritingIssueSeverity = "error" | "warning" | "suggestion";

export interface WritingIssue {
  /** Deterministic fingerprint: kind + range + original. */
  id: string;
  category: WritingIssueCategory;
  severity: WritingIssueSeverity;
  message: string;
  explanation?: string;
  range: { start: number; end: number };
  original: string;
  suggestions: string[];
  canAutoApply: boolean;
}

export const writingIssueCategoryLabels: Record<WritingIssueCategory, string> = {
  correctness: "Correctness",
  clarity: "Clarity",
  style: "Style",
};

/** Technical vocabulary that must never be flagged as a spelling error. */
const TECH_TERMS = new Set(
  `typescript javascript cloudflare supabase api sdk cli markdown react node nodejs
   vite nextjs next.js tailwind css html json yaml graphql postgres postgresql sqlite
   redis docker kubernetes github gitlab vercel netlify workers serverless frontend
   backend fullstack devtools codebase repo monorepo cms saas paas iaas oauth jwt url
   uri http https localhost env npm pnpm bun yarn tsx jsx dom ssr ssg csr crud rest
   websocket webhooks regex async await eslint prettier vitest playwright zod prisma
   drizzle supabase edge function typecontent`
    .split(/\s+/),
);

/** High-confidence typo corrections only. */
const KNOWN_TYPOS: Record<string, string> = {
  usefull: "useful",
  teh: "the",
  hte: "the",
  recieve: "receive",
  recieved: "received",
  seperate: "separate",
  seperated: "separated",
  occured: "occurred",
  occurence: "occurrence",
  definately: "definitely",
  definetly: "definitely",
  accomodate: "accommodate",
  neccessary: "necessary",
  necesary: "necessary",
  untill: "until",
  wich: "which",
  adress: "address",
  enviroment: "environment",
  goverment: "government",
  independant: "independent",
  mantain: "maintain",
  maintenence: "maintenance",
  persue: "pursue",
  publically: "publicly",
  sucessful: "successful",
  succesful: "successful",
  tomorow: "tomorrow",
  begining: "beginning",
  writting: "writing",
  comming: "coming",
  exapmle: "example",
  fucntion: "function",
  fuction: "function",
  retrun: "return",
  taht: "that",
  wiht: "with",
  yout: "your",
};

/** Known-correct brand/product capitalizations. */
const KNOWN_CAPITALIZATIONS: Record<string, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  github: "GitHub",
  gitlab: "GitLab",
  markdown: "Markdown",
  youtube: "YouTube",
  nodejs: "Node.js",
  nextjs: "Next.js",
};

/** Filler phrases with a deterministic shorter replacement. */
const REDUNDANT_PHRASES: Record<string, string> = {
  "in order to": "to",
  "due to the fact that": "because",
  "at this point in time": "now",
  "a large number of": "many",
  "in the event that": "if",
};

const INTENSIFIERS = ["very", "really", "extremely", "incredibly", "absolutely"];

/** Ranges of fenced code blocks and inline code, where prose rules don't apply. */
function codeRanges(markdown: string): { start: number; end: number }[] {
  const ranges: { start: number; end: number }[] = [];
  const fence = /```[\s\S]*?(?:```|$)/g;
  let m: RegExpExecArray | null;
  while ((m = fence.exec(markdown))) ranges.push({ start: m.index, end: m.index + m[0].length });
  const inline = /`[^`\n]*`/g;
  while ((m = inline.exec(markdown))) {
    const r = { start: m.index, end: m.index + m[0].length };
    if (!ranges.some((c) => r.start >= c.start && r.end <= c.end)) ranges.push(r);
  }
  return ranges;
}

const inCode = (ranges: { start: number; end: number }[], start: number, end: number) =>
  ranges.some((c) => start < c.end && end > c.start);

function issue(
  partial: Omit<WritingIssue, "id">,
): WritingIssue {
  return {
    ...partial,
    id: `${partial.category}:${partial.range.start}:${partial.range.end}:${partial.original}`,
  };
}

/**
 * Analyze raw Markdown source and return range-located issues.
 * Deterministic: same input always yields the same issues in the same order.
 */
export function analyzeWritingIssues(markdown: string): WritingIssue[] {
  if (!markdown.trim()) return [];
  const code = codeRanges(markdown);
  const issues: WritingIssue[] = [];

  // --- Correctness: known typos -------------------------------------------
  const wordRe = /\b[A-Za-z][A-Za-z']*\b/g;
  let m: RegExpExecArray | null;
  while ((m = wordRe.exec(markdown))) {
    const word = m[0];
    const start = m.index;
    const end = start + word.length;
    if (inCode(code, start, end)) continue;
    const lower = word.toLowerCase();
    if (TECH_TERMS.has(lower)) continue;
    const fix = KNOWN_TYPOS[lower];
    if (fix) {
      const replacement = word[0] === word[0]?.toUpperCase() ? fix[0]!.toUpperCase() + fix.slice(1) : fix;
      issues.push(
        issue({
          category: "correctness",
          severity: "error",
          message: `"${word}" may be misspelled.`,
          explanation: "This matches a common typo. Only apply if the correction fits your context.",
          range: { start, end },
          original: word,
          suggestions: [replacement],
          canAutoApply: true,
        }),
      );
      continue;
    }
    const cap = KNOWN_CAPITALIZATIONS[lower];
    if (cap && word !== cap) {
      issues.push(
        issue({
          category: "correctness",
          severity: "warning",
          message: `"${word}" is usually written "${cap}".`,
          range: { start, end },
          original: word,
          suggestions: [cap],
          canAutoApply: true,
        }),
      );
    }
  }

  // --- Correctness: duplicate words ----------------------------------------
  const dupRe = /\b([A-Za-z']+)(\s+)\1\b/gi;
  while ((m = dupRe.exec(markdown))) {
    const start = m.index;
    const end = start + m[0].length;
    if (inCode(code, start, end)) continue;
    const word = m[1]!;
    if (TECH_TERMS.has(word.toLowerCase())) continue;
    issues.push(
      issue({
        category: "correctness",
        severity: "error",
        message: `Duplicate word "${word}".`,
        explanation: "The same word appears twice in a row.",
        range: { start, end },
        original: m[0],
        suggestions: [word],
        canAutoApply: true,
      }),
    );
  }

  // --- Correctness: double spaces (mid-line only) ---------------------------
  const spaceRe = /(?<=\S) {2,}(?=\S)/g;
  while ((m = spaceRe.exec(markdown))) {
    const start = m.index;
    const end = start + m[0].length;
    if (inCode(code, start, end)) continue;
    issues.push(
      issue({
        category: "correctness",
        severity: "warning",
        message: "Unnecessary extra spaces.",
        range: { start, end },
        original: m[0],
        suggestions: [" "],
        canAutoApply: true,
      }),
    );
  }

  // --- Clarity: redundant phrases -------------------------------------------
  for (const [phrase, replacement] of Object.entries(REDUNDANT_PHRASES)) {
    const re = new RegExp(phrase.replace(/\s+/g, "\\s+"), "gi");
    while ((m = re.exec(markdown))) {
      const start = m.index;
      const end = start + m[0].length;
      if (inCode(code, start, end)) continue;
      issues.push(
        issue({
          category: "clarity",
          severity: "suggestion",
          message: `"${m[0]}" may be clearer as "${replacement}".`,
          explanation: "Shorter phrasing is usually easier to read.",
          range: { start, end },
          original: m[0],
          suggestions: [replacement],
          canAutoApply: true,
        }),
      );
    }
  }

  // --- Clarity: long sentences (no auto-apply) -------------------------------
  const sentenceRe = /[^.!?\n][^.!?]*[.!?]/g;
  while ((m = sentenceRe.exec(markdown))) {
    const start = m.index;
    const end = start + m[0].length;
    if (inCode(code, start, end)) continue;
    const words = m[0].trim().split(/\s+/).length;
    if (words > 35) {
      issues.push(
        issue({
          category: "clarity",
          severity: "warning",
          message: `Sentence is unusually long (${words} words).`,
          explanation: "Consider splitting it into two or more sentences.",
          range: { start, end },
          original: m[0].trim(),
          suggestions: [],
          canAutoApply: false,
        }),
      );
    }
  }

  // --- Style: intensifiers used repeatedly -----------------------------------
  const lowerAll = markdown.toLowerCase();
  for (const word of INTENSIFIERS) {
    const re = new RegExp(`\\b${word}\\b`, "g");
    const hits: number[] = [];
    while ((m = re.exec(lowerAll))) {
      if (!inCode(code, m.index, m.index + word.length)) hits.push(m.index);
    }
    if (hits.length >= 4) {
      issues.push(
        issue({
          category: "style",
          severity: "suggestion",
          message: `"${word}" appears ${hits.length} times.`,
          explanation:
            "Consider removing some intensifiers or using more specific wording.",
          range: { start: hits[0]!, end: hits[0]! + word.length },
          original: word,
          suggestions: [],
          canAutoApply: false,
        }),
      );
    }
  }

  return issues.sort((a, b) => a.range.start - b.range.start);
}

/** Apply a suggestion to the source. Returns null when the range no longer matches. */
export function applyWritingIssue(
  markdown: string,
  issue: WritingIssue,
  suggestion: string,
): string | null {
  const { start, end } = issue.range;
  if (markdown.slice(start, end) !== issue.original) return null;
  return markdown.slice(0, start) + suggestion + markdown.slice(end);
}

/** Per-category 0-100 scores derived from the issue list. */
export function writingIssueScores(
  issues: WritingIssue[],
): Record<WritingIssueCategory, number> {
  const penalty: Record<WritingIssueSeverity, number> = { error: 10, warning: 5, suggestion: 2 };
  const scores: Record<WritingIssueCategory, number> = {
    correctness: 100,
    clarity: 100,
    style: 100,
  };
  for (const i of issues) {
    scores[i.category] = Math.max(0, scores[i.category] - penalty[i.severity]);
  }
  return scores;
}
