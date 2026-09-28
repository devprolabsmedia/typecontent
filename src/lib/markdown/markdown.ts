/**
 * Minimal, dependency-free Markdown utilities.
 *
 * Markdown is the canonical content representation: the block scanner below
 * produces a light AST which is then rendered to HTML. Swapping in a full
 * AST library later only touches this module.
 */

export type MarkdownBlock =
  | { kind: "heading"; level: number; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "code"; lang: string; code: string }
  | { kind: "quote"; lines: string[] }
  | { kind: "list"; ordered: boolean; items: string[] }
  | { kind: "hr" }
  | { kind: "image"; alt: string; src: string }
  | { kind: "callout"; variant: string; text: string };

export type MarkdownBlockKind = MarkdownBlock["kind"];

const IMAGE_ONLY = /^!\[([^\]]*)\]\(([^)\s]+)\)$/;
const CALLOUT_OPEN = /^:::callout(?:\s+(\w+))?\s*$/;
const CALLOUT_CLOSE = /^:::\s*$/;

export function parseMarkdown(markdown: string): MarkdownBlock[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let i = 0;
  const at = (n: number): string => lines[n] ?? "";

  while (i < lines.length) {
    const line = at(i);

    if (!line.trim()) {
      i += 1;
      continue;
    }

    // Fenced code block
    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      const lang = fence[1] ?? "";
      const code: string[] = [];
      i += 1;
      while (i < lines.length && !/^```\s*$/.test(at(i))) {
        code.push(at(i));
        i += 1;
      }
      i += 1;
      blocks.push({ kind: "code", lang, code: code.join("\n") });
      continue;
    }

    // Callout custom block: :::callout [variant] ... :::
    const callout = line.match(CALLOUT_OPEN);
    if (callout) {
      const body: string[] = [];
      i += 1;
      while (i < lines.length && !CALLOUT_CLOSE.test(at(i))) {
        body.push(at(i));
        i += 1;
      }
      i += 1;
      blocks.push({ kind: "callout", variant: callout[1] ?? "info", text: body.join("\n").trim() });
      continue;
    }

    // Heading
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      blocks.push({
        kind: "heading",
        level: (heading[1] ?? "").length,
        text: (heading[2] ?? "").trim(),
      });
      i += 1;
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      blocks.push({ kind: "hr" });
      i += 1;
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      const quoted: string[] = [];
      while (i < lines.length && /^>\s?/.test(at(i))) {
        quoted.push(at(i).replace(/^>\s?/, ""));
        i += 1;
      }
      blocks.push({ kind: "quote", lines: quoted });
      continue;
    }

    // Lists
    if (/^\s*([-*+])\s+/.test(line) || /^\s*\d+[.)]\s+/.test(line)) {
      const ordered = /^\s*\d+[.)]\s+/.test(line);
      const items: string[] = [];
      while (
        i < lines.length &&
        (ordered ? /^\s*\d+[.)]\s+/.test(at(i)) : /^\s*([-*+])\s+/.test(at(i)))
      ) {
        items.push(at(i).replace(/^\s*(?:[-*+]|\d+[.)])\s+/, ""));
        i += 1;
      }
      blocks.push({ kind: "list", ordered, items });
      continue;
    }

    // Standalone image
    const img = line.trim().match(IMAGE_ONLY);
    if (img) {
      blocks.push({ kind: "image", alt: img[1] ?? "", src: img[2] ?? "" });
      i += 1;
      continue;
    }

    // Paragraph (consume until blank line / new block start)
    const para: string[] = [];
    while (
      i < lines.length &&
      at(i).trim() &&
      !/^(#{1,6})\s+/.test(at(i)) &&
      !/^```/.test(at(i)) &&
      !/^>\s?/.test(at(i)) &&
      !/^\s*([-*+])\s+/.test(at(i)) &&
      !/^\s*\d+[.)]\s+/.test(at(i)) &&
      !/^(-{3,}|\*{3,}|_{3,})\s*$/.test(at(i))
    ) {
      para.push(at(i));
      i += 1;
    }
    if (para.length) blocks.push({ kind: "paragraph", text: para.join("\n") });
  }

  return blocks;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Inline markdown -> HTML (code spans are protected from other rules). */
export function renderInline(input: string): string {
  const codes: string[] = [];
  let text = escapeHtml(input).replace(/`([^`]+)`/g, (_m, code: string) => {
    codes.push(code);
    return `\uE000${codes.length - 1}\uE000`;
  });

  text = text
    .replace(
      /!\[([^\]]*)\]\(([^)\s]+)\)/g,
      (_m, alt: string, src: string) => `<img src="${src}" alt="${alt}" />`,
    )
    .replace(
      /\[([^\]]+)\]\(([^)\s]+)\)/g,
      (_m, label: string, href: string) =>
        `<a href="${href}"${/^https?:\/\//.test(href) ? ' target="_blank" rel="noreferrer"' : ""}>${label}</a>`,
    )
    .replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    .replace(/_([^_\n]+)_/g, "<em>$1</em>")
    .replace(/~~([^~]+)~~/g, "<del>$1</del>")
    .replace(/&lt;u&gt;([\s\S]*?)&lt;\/u&gt;/g, "<u>$1</u>")
    .replace(/\n/g, "<br />");

  return text.replace(/\uE000(\d+)\uE000/g, (_m, index: string) => `<code>${codes[+index]}</code>`);
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function renderMarkdown(markdown: string): string {
  return parseMarkdown(markdown)
    .map((block) => {
      switch (block.kind) {
        case "heading":
          return `<h${block.level} id="${slugify(block.text)}">${renderInline(block.text)}</h${block.level}>`;
        case "paragraph":
          return `<p>${renderInline(block.text)}</p>`;
        case "code":
          return `<pre data-lang="${escapeHtml(block.lang)}"><code>${escapeHtml(block.code)}</code></pre>`;
        case "quote":
          return `<blockquote>${renderInline(block.lines.join("\n"))}</blockquote>`;
        case "list": {
          const tag = block.ordered ? "ol" : "ul";
          return `<${tag}>${block.items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</${tag}>`;
        }
        case "image":
          return `<p><img src="${block.src}" alt="${escapeHtml(block.alt)}" /></p>`;
        case "hr":
          return "<hr />";
        case "callout":
          return `<aside data-callout="${escapeHtml(block.variant)}"><p>${renderInline(block.text)}</p></aside>`;
        default:
          return "";
      }
    })
    .join("\n");
}

/** Serialize a parsed document back to portable Markdown. */
export function serializeMarkdown(blocks: MarkdownBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.kind) {
        case "heading":
          return `${"#".repeat(block.level)} ${block.text}`;
        case "paragraph":
          return block.text;
        case "code":
          return "```" + block.lang + "\n" + block.code + "\n```";
        case "quote":
          return block.lines.map((line) => `> ${line}`).join("\n");
        case "list":
          return block.items
            .map((item, i) => (block.ordered ? `${i + 1}. ${item}` : `- ${item}`))
            .join("\n");
        case "image":
          return `![${block.alt}](${block.src})`;
        case "hr":
          return "---";
        case "callout":
          return `:::callout ${block.variant}\n${block.text}\n:::`;
        default:
          return "";
      }
    })
    .join("\n\n");
}

/** Plain text, used by word counts and keyword checks. */
export function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_~>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
