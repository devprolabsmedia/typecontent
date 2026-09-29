# @typecontent/core

**Status: planned package — source lives in `src/types/typecontent.ts` and `src/core/content/memory-adapter.ts`. Not on npm.**

Purpose: editor-independent content model and contracts.

Contains: `Content`, `ContentTypeDefinition`, `MetadataFieldDef`, `SEOResult`, `ContentAdapter` (create/get/update/delete/list/publish/unpublish) and an in-memory adapter.

```ts
import type { ContentAdapter } from "@typecontent/core";
const adapter: ContentAdapter = createMemoryAdapter();
```

Depends on: nothing.
