# @typecontent/content-types

**Status: planned package — source in `src/core/content-types/registry.ts`. Not on npm.**

Purpose: built-in Blog, Page, Docs, Knowledge Base, Changelog, Course, plus custom types.

API (implemented): `blog`, `page`, `docs`, `knowledgeBase`, `changelog`, `course`, `defineContentType`, `registerContentType`, `getContentType`, `listContentTypes`.

```ts
const caseStudy = defineContentType({
  id: "case-study",
  name: "Case Study",
  features: { seo: true },
});
```

Depends on: core.
