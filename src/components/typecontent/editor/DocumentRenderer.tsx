import { useMemo } from "react";

import { parseMarkdown, renderInline, slugify, type MarkdownBlock } from "@/lib/markdown/markdown";
import { cn } from "@/lib/utils";

/**
 * Reusable preview renderer. Consumes the same parsed document the editor
 * produces — preview is always derived from the same content state.
 *
 * Inline HTML comes from renderInline, which escapes raw HTML first, so no
 * unsanitized markup reaches the DOM.
 */

function CalloutView({ variant, text }: { variant: string; text: string }) {
  return (
    <aside data-callout={variant} className={cn("tc-callout", `tc-callout-${variant}`)}>
      <span className="tc-callout-label">{variant}</span>
      <p dangerouslySetInnerHTML={{ __html: renderInline(text) }} />
    </aside>
  );
}

function BlockView({ block }: { block: MarkdownBlock }) {
  switch (block.kind) {
    case "heading": {
      const Tag = `h${block.level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
      return (
        <Tag
          id={slugify(block.text)}
          dangerouslySetInnerHTML={{ __html: renderInline(block.text) }}
        />
      );
    }
    case "paragraph":
      return <p dangerouslySetInnerHTML={{ __html: renderInline(block.text) }} />;
    case "code":
      return (
        <pre data-lang={block.lang}>
          <code>{block.code}</code>
        </pre>
      );
    case "quote":
      return (
        <blockquote dangerouslySetInnerHTML={{ __html: renderInline(block.lines.join("\n")) }} />
      );
    case "list": {
      const items = block.items.map((item, i) => (
        <li key={i} dangerouslySetInnerHTML={{ __html: renderInline(item) }} />
      ));
      return block.ordered ? <ol>{items}</ol> : <ul>{items}</ul>;
    }
    case "image":
      return (
        <p>
          <img src={block.src} alt={block.alt} />
        </p>
      );
    case "hr":
      return <hr />;
    case "callout":
      return <CalloutView variant={block.variant} text={block.text} />;
    default:
      return null;
  }
}

export function DocumentRenderer({ markdown }: { markdown: string }) {
  const blocks = useMemo(() => parseMarkdown(markdown), [markdown]);
  return (
    <article className="tc-article">
      {blocks.map((block, i) => (
        <BlockView key={i} block={block} />
      ))}
    </article>
  );
}
