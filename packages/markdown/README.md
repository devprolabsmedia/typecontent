# @typecontent/markdown

**Status: planned package — source in `src/lib/markdown/markdown.ts`, `src/core/content/markdown-commands.ts`. Not on npm.**

Purpose: dependency-free Markdown parsing, serialization and editing commands.

API (implemented): `parseMarkdown`, `serializeMarkdown`, `renderMarkdown`, `renderInline`, `markdownToPlainText`, `slugify`, `applyMarkdownCommand`.

```ts
const blocks = parseMarkdown("## Intro");
```

Depends on: nothing.
