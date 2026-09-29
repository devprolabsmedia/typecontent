import type { Content, Metadata } from "@/types/typecontent";

/**
 * Realistic demo documents, one per content type, so the playground is
 * immediately useful. The editor never reads this file directly.
 */

interface DemoDoc {
  title: string;
  markdown: string;
  metaDescription: string;
  focusKeyword: string;
  metadata: Metadata;
}

const blog: DemoDoc = {
  title: "How to Build a SaaS with TypeScript",
  metaDescription:
    "A practical walkthrough of the architecture, tooling and content layer behind a modern TypeScript SaaS — from the first route to production.",
  focusKeyword: "typescript saas",
  metadata: {
    status: "draft",
    author: "Alex Rivera",
    category: "Engineering",
    tags: ["TypeScript", "SaaS", "Cloudflare"],
    publishDate: "2026-09-25",
    featuredImage: "",
    excerpt:
      "Everything we learned shipping a TypeScript SaaS: boundaries that hold, a content layer you own, and a deploy story that stays boring.",
  },
  markdown: `Most SaaS products die of architecture, not of demand. The team ships fast for
six weeks, then every new feature starts touching five files that nobody wants
to open. This is the setup we keep coming back to — boring in the right places,
strict where it pays off.

## Start with the boundaries, not the framework

Before picking a router or a database, write down the boundaries. A boundary is
a place where one part of the system stops trusting another.

- **UI** renders state and collects intent. Nothing else.
- **Core** holds domain rules as plain TypeScript functions.
- **Adapters** talk to the outside world: database, mail, payments, storage.

When those three stay separate, swapping infrastructure is a Tuesday, not a
quarter. See the [architecture notes](/docs/architecture) for the full map.

## Model your content as data, not as markup

Rich text is where products quietly accumulate debt. Store Markdown or an AST —
something you can query, diff and migrate — and treat HTML as an output format.

\`\`\`ts
export interface Content {
  id: string;
  contentTypeId: string;
  title: string;
  markdown: string;
  metadata: Record<string, unknown>;
}
\`\`\`

One content shape plus a content *type* beats six bespoke tables. The type
decides which metadata exists, which features are available and how the thing
gets published.

> If you are writing a second editor, you are writing the same bugs twice.

## Keep the runtime portable

Anything in \`core/\` should run in a browser, in Node and on the edge. That
means no filesystem, no \`process\` access, and no Node-only dependencies.
Practically: use \`fetch\`, \`crypto.randomUUID()\` and the Web Streams API.

1. Pure domain logic in \`core/\`
2. Runtime access behind adapter interfaces
3. Framework code only at the edges

The payoff shows up the day you deploy to [Cloudflare Workers](https://developers.cloudflare.com/workers/)
and nothing needs rewriting.

## Ship SEO with the content, not after it

SEO is a content-quality problem with a deterministic checklist: one \`H1\`,
sane heading levels, a title that fits, a real meta description, alt text,
internal links. Compute it while the author types — no AI call required — and
it stops being a launch-week fire drill.

## Conclusion

Choose the strict boundary over the clever abstraction, own your content model,
and keep the runtime portable. Next up: read the [content types guide](/docs/content-types)
and copy the editor into your own project.
`,
};

const page: DemoDoc = {
  title: "About TypeContent",
  metaDescription:
    "TypeContent is an open-source content editor for SaaS builders: one editor, every content type, copied straight into your codebase.",
  focusKeyword: "content editor",
  metadata: { slug: "about", featuredImage: "" },
  markdown: `TypeContent started as an internal component. Every product we built needed a
blog, then docs, then a changelog — and each one arrived with its own editor,
its own metadata handling and its own half-finished SEO panel.

## What it is

A single **content editor** plus a content-type registry. The writing surface
never changes; the selected type decides the metadata, the features and the
publishing rules.

## What it is not

- Not a hosted CMS
- Not a multi-tenant dashboard
- Not tied to any database

You copy the components into your application and own them from that point on.
Read the [docs](/docs) or browse the [content types](/content-types).
`,
};

const docs: DemoDoc = {
  title: "Getting Started with TypeContent",
  metaDescription:
    "Install TypeContent, register a content type and render your first document with the shared editor in under five minutes.",
  focusKeyword: "getting started",
  metadata: { version: "v1", navigation: "Auto", tableOfContents: true },
  markdown: `TypeContent ships as source you copy into your own React application. There is
no account, no runtime service and no vendor lock-in.

## Install

\`\`\`bash
npm install @typecontent/editor
\`\`\`

Or copy \`src/components/typecontent\` and \`src/core\` directly into your
project — that is the recommended path while the API is stabilising.

## Render the editor

\`\`\`tsx
import { ContentEditor } from "@/components/typecontent/editor/ContentEditor";

export function BlogEditorPage() {
  return <ContentEditor contentType="blog" mode="split" />;
}
\`\`\`

## Register a content type

Content types are plain objects. Add one to the registry and the editor adapts:

\`\`\`ts
export const recipe = {
  id: "recipe",
  name: "Recipe",
  features: { seo: true, tags: true, duration: true },
  metadataGroups: [/* ... */],
};
\`\`\`

## Persist content

Implement the \`ContentAdapter\` interface against whatever storage you use —
D1, Postgres, Supabase or a REST API.

1. Implement \`create\`, \`get\`, \`update\`, \`list\`
2. Add \`publish\` / \`unpublish\`
3. Pass the adapter in at the app boundary

Next: the [content types reference](/content-types).
`,
};

const kb: DemoDoc = {
  title: "Why is my content not publishing?",
  metaDescription:
    "Troubleshooting checklist for content that stays in draft: validation errors, missing required metadata and adapter permissions.",
  focusKeyword: "publishing",
  metadata: {
    category: "Troubleshooting",
    tags: ["Publishing", "Validation"],
    relatedArticles: ["editor-shortcuts", "content-status"],
  },
  markdown: `If the publish action completes but nothing appears on your site, work through
the checks below in order.

## 1. Required metadata

Each content type declares required metadata. A blog post without a publish
date, for example, stays in \`draft\`. Open the metadata panel and look for
fields flagged as incomplete.

## 2. Validation errors

Publishing runs the same deterministic checks as the SEO panel. Failing checks
(a missing title, more than one \`H1\`) block publication.

## 3. Adapter permissions

\`publish()\` writes through your \`ContentAdapter\`. If your storage layer
rejects the write, the editor keeps the local draft.

> Still stuck? Check your adapter logs for a rejected write before filing an issue.

See also: [content status reference](/docs/status).
`,
};

const changelog: DemoDoc = {
  title: "TypeContent v0.1.0",
  metaDescription:
    "First public release of TypeContent: one editor, six content types, deterministic SEO analysis.",
  focusKeyword: "release",
  metadata: { version: "v0.1.0", releaseDate: "2026-09-25", tags: ["New", "Improvement"] },
  markdown: `First public release. The editor, the content-type registry and the SEO
analyzer are all in place.

## New

- Single \`ContentEditor\` shared by every content type
- Content-type registry with six built-in types
- Deterministic SEO analyzer — no AI calls, no network
- Edit, Preview and Split modes
- Metadata panel driven entirely by content-type configuration

## Improvements

- Markdown toolbar with grouped controls and keyboard shortcuts
- Undo and redo history scoped to the editor
- Adapter interface for D1, Supabase, Postgres and REST

## Notes

The package API is not stable yet. Copying the source into your project is the
recommended path for now.
`,
};

const course: DemoDoc = {
  title: "Building Your First SaaS",
  metaDescription:
    "A four-module course covering architecture, the content layer, billing and deployment for your first TypeScript SaaS.",
  focusKeyword: "saas course",
  metadata: {
    difficulty: "Intermediate",
    duration: 180,
    lessons: ["Architecture", "Content layer", "Billing", "Deploying to the edge"],
    instructor: "Alex Rivera",
  },
  markdown: `Four modules, roughly three hours, one working product at the end. You need
working TypeScript and React; everything else is covered here.

## Module 1 — Architecture

Draw the boundaries before writing code: UI, core, adapters. We build the
skeleton and a single route.

## Module 2 — The content layer

Model content as data and reuse one editor for blog, docs and changelog.
Includes the [content types guide](/content-types).

\`\`\`ts
const post = await adapter.create({
  contentTypeId: "blog",
  title: "Hello world",
  markdown: "# Hello world",
});
\`\`\`

## Module 3 — Billing and accounts

- Plans, trials and entitlement checks
- Webhook handling that survives retries
- Testing money without spending it

## Module 4 — Deploying to the edge

> Deploys should be boring. If a release needs a runbook, automate the runbook.

We finish on Cloudflare, with preview environments per branch.
`,
};

export const demoContent: Record<string, DemoDoc> = {
  blog,
  page,
  docs,
  "knowledge-base": kb,
  changelog,
  course,
};

export function getDemoDoc(contentTypeId: string): DemoDoc {
  return (
    demoContent[contentTypeId] ?? {
      title: "",
      markdown: "",
      metaDescription: "",
      focusKeyword: "",
      metadata: {},
    }
  );
}

export function demoContentAsContent(contentTypeId: string): Content {
  const doc = getDemoDoc(contentTypeId);
  const now = new Date("2026-09-25T09:00:00.000Z").toISOString();
  return {
    id: `demo-${contentTypeId}`,
    contentTypeId,
    title: doc.title,
    markdown: doc.markdown,
    status: "draft",
    metadata: doc.metadata,
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
  };
}
