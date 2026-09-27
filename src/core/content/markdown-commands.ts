/**
 * Pure text transforms for the toolbar. No DOM, no React — given a selection
 * they return the next value and where the caret should land.
 */

export interface TextSelection {
  value: string;
  start: number;
  end: number;
}

export interface TextResult {
  value: string;
  start: number;
  end: number;
}

export type MarkdownCommandId =
  | "bold"
  | "italic"
  | "underline"
  | "strike"
  | "h1"
  | "h2"
  | "h3"
  | "link"
  | "image"
  | "quote"
  | "bullet"
  | "ordered"
  | "code"
  | "codeblock"
  | "divider";

function wrap(sel: TextSelection, before: string, after = before, placeholder = ""): TextResult {
  const selected = sel.value.slice(sel.start, sel.end) || placeholder;
  const alreadyWrapped =
    sel.value.slice(sel.start - before.length, sel.start) === before &&
    sel.value.slice(sel.end, sel.end + after.length) === after;

  if (alreadyWrapped) {
    const value =
      sel.value.slice(0, sel.start - before.length) +
      selected +
      sel.value.slice(sel.end + after.length);
    return {
      value,
      start: sel.start - before.length,
      end: sel.start - before.length + selected.length,
    };
  }

  const value =
    sel.value.slice(0, sel.start) + before + selected + after + sel.value.slice(sel.end);
  return {
    value,
    start: sel.start + before.length,
    end: sel.start + before.length + selected.length,
  };
}

function lineBounds(value: string, start: number, end: number) {
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const nextBreak = value.indexOf("\n", end);
  const lineEnd = nextBreak === -1 ? value.length : nextBreak;
  return { lineStart, lineEnd };
}

function prefixLines(
  sel: TextSelection,
  makePrefix: (index: number) => string,
  stripRe: RegExp,
): TextResult {
  const { lineStart, lineEnd } = lineBounds(sel.value, sel.start, sel.end);
  const lines = sel.value.slice(lineStart, lineEnd).split("\n");
  const allPrefixed = lines.every((line) => stripRe.test(line));

  const next = lines
    .map((line, index) =>
      allPrefixed ? line.replace(stripRe, "") : makePrefix(index) + line.replace(stripRe, ""),
    )
    .join("\n");

  const value = sel.value.slice(0, lineStart) + next + sel.value.slice(lineEnd);
  return { value, start: lineStart, end: lineStart + next.length };
}

function insertBlock(sel: TextSelection, block: string): TextResult {
  const before = sel.value.slice(0, sel.start);
  const after = sel.value.slice(sel.end);
  const lead = before && !before.endsWith("\n\n") ? (before.endsWith("\n") ? "\n" : "\n\n") : "";
  const trail = after.startsWith("\n") ? "" : "\n";
  const value = before + lead + block + trail + after;
  const caret = before.length + lead.length + block.length;
  return { value, start: caret, end: caret };
}

export function applyMarkdownCommand(id: MarkdownCommandId, sel: TextSelection): TextResult {
  switch (id) {
    case "bold":
      return wrap(sel, "**", "**", "bold text");
    case "italic":
      return wrap(sel, "*", "*", "italic text");
    case "underline":
      return wrap(sel, "<u>", "</u>", "underlined text");
    case "strike":
      return wrap(sel, "~~", "~~", "struck text");
    case "code":
      return wrap(sel, "`", "`", "code");
    case "h1":
      return prefixLines(sel, () => "# ", /^#{1,6}\s+/);
    case "h2":
      return prefixLines(sel, () => "## ", /^#{1,6}\s+/);
    case "h3":
      return prefixLines(sel, () => "### ", /^#{1,6}\s+/);
    case "quote":
      return prefixLines(sel, () => "> ", /^>\s?/);
    case "bullet":
      return prefixLines(sel, () => "- ", /^\s*[-*+]\s+/);
    case "ordered":
      return prefixLines(sel, (index) => `${index + 1}. `, /^\s*\d+[.)]\s+/);
    case "link": {
      const selected = sel.value.slice(sel.start, sel.end) || "link text";
      const value =
        sel.value.slice(0, sel.start) + `[${selected}](https://)` + sel.value.slice(sel.end);
      const caret = sel.start + selected.length + 3;
      return { value, start: caret, end: caret + 8 };
    }
    case "image": {
      const selected = sel.value.slice(sel.start, sel.end) || "Descriptive alt text";
      const value =
        sel.value.slice(0, sel.start) + `![${selected}](https://)` + sel.value.slice(sel.end);
      const caret = sel.start + selected.length + 4;
      return { value, start: caret, end: caret + 8 };
    }
    case "codeblock": {
      const selected = sel.value.slice(sel.start, sel.end) || "// code";
      return insertBlock(sel, "```ts\n" + selected + "\n```");
    }
    case "divider":
      return insertBlock(sel, "---");
    default:
      return { value: sel.value, start: sel.start, end: sel.end };
  }
}
