# @typecontent/editor

**Status: planned package — source in `src/components/typecontent/editor/`. Not on npm.**

Purpose: the one `ContentEditor` React component: toolbar, edit/split/preview, slash commands, SEO and metadata panels.

Props (implemented): `contentType` (id or definition), `value`, `onChange`, `showTypeSwitcher`, `showCopyToProject`.

```tsx
<ContentEditor contentType={blog} value={content} onChange={setContent} showTypeSwitcher={false} />
```

Client-only, no Node APIs, no Next.js imports. Depends on: core, markdown, blocks, seo, content-types; react, lucide-react, clsx, tailwind-merge.
