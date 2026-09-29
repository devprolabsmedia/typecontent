# @typecontent/blocks

**Status: planned package — source in `src/core/blocks/registry.ts`. Not on npm.**

Purpose: block registry, built-in blocks (headings, lists, quote, code, image, divider) and the callout custom block.

API (implemented): `registerBlock`, `getBlock`, `listBlocks`.

```ts
registerBlock({ type: "embed", name: "Embed", keywords: ["video"], template: "::embed::" });
```

Depends on: markdown (types).
