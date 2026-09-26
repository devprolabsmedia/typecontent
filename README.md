# TypeContent

> **One editor. Every content type.**

TypeContent is an open-source, developer-first content editor and content infrastructure for SaaS builders.

Build **Blog, Pages, Docs, Knowledge Base, Changelog, Courses**, and other content experiences with one reusable editor instead of maintaining a separate editor for every content type.

## Why TypeContent?

Most SaaS products eventually need content:

- Blog posts
- Documentation
- Knowledge bases
- Changelogs
- Course lessons
- Marketing pages
- Release notes
- Help articles

The problem is that each product often ends up building another custom editor, preview system, metadata panel, SEO checker, and content workflow.

TypeContent aims to make that unnecessary.

```text
Content Type
     ↓
Capabilities / Configuration
     ↓
┌─────────────────────┐
│   One ContentEditor │
└─────────────────────┘
     ↓
Markdown / AST
     ↓
Your SaaS
```

The editor stays the same.

The **behavior changes according to the content type**.

---

## ✨ Features

- 📝 Unified Markdown-first content editor
- 🧩 Multiple content types using one editor
- 👀 Edit / Preview / Split modes
- 🔍 Built-in deterministic SEO analysis
- 🏷️ Contextual metadata based on content type
- 🧱 Extensible content blocks
- 🔌 Adapter-ready architecture
- ⚡ TypeScript-first
- ☁️ Designed for Cloudflare Workers
- 📦 Designed to be copied or installed into your own project
- 🛠️ Built with reusable components
- 🌱 Open source

### Supported content types

The initial concept includes:

| Content Type | Example capabilities |
|---|---|
| Blog | SEO, tags, categories, author, featured image, publish date |
| Page | SEO, slug, featured image |
| Docs | SEO, TOC, navigation, versioning |
| Knowledge Base | SEO, categories, tags, related content |
| Changelog | version, release date, tags |
| Course | SEO, lessons, difficulty, duration |

These are not separate editors.

They are configurations consumed by the same `ContentEditor`.

---

## 🚀 Try TypeContent

The project is designed so the homepage is also the playground.

Open the demo, select a content type, start writing, switch between Edit / Preview / Split, and inspect the SEO guidance.

The goal is simple:

> **Try it first. Understand it immediately. Copy it when you need it.**

---

## 📋 Copy it into your project

TypeContent is designed around an **own-your-code** philosophy.

Instead of requiring your application to depend on a hosted CMS, the editor can eventually be copied directly into your project.

Planned usage:

```bash
npx typecontent init
```

Then add the pieces you need:

```bash
npx typecontent add editor
npx typecontent add seo
npx typecontent add preview
```

Or install the reusable packages:

```bash
npm install @typecontent/editor
```

> Package names and CLI commands are part of the planned distribution API and may change while the project is being developed.

---

## 🧠 The Core Idea

TypeContent separates **editing** from **content type behavior**.

Instead of:

```text
BlogEditor
DocsEditor
CourseEditor
ChangelogEditor
PageEditor
```

TypeContent uses:

```text
ContentType
     ↓
Capabilities
     ↓
ContentEditor
```

Example:

```ts
const blog = defineContentType({
  name: "blog",

  features: {
    seo: true,
    tags: true,
    categories: true,
    author: true,
    featuredImage: true,
    publishDate: true,
  },
});
```

A documentation type can use the same editor:

```ts
const docs = defineContentType({
  name: "docs",

  features: {
    seo: true,
    toc: true,
    navigation: true,
    versioning: true,
  },
});
```

The editor does not need to know that these are fundamentally different products.

It simply consumes the active content type configuration.

---

## ✍️ Editor

The editor is intended to support a production-quality Markdown/Rich Text workflow.

Initial formatting includes:

- Headings
- Bold
- Italic
- Underline
- Strikethrough
- Links
- Images
- Blockquotes
- Ordered lists
- Unordered lists
- Inline code
- Code blocks
- Horizontal rules
- Undo / Redo

The long-term goal is to support custom blocks such as:

```md
:::callout
Important information.
:::

:::code
const example = true;
:::

:::youtube
...
:::
```

Markdown/AST should remain an important part of the canonical content representation rather than making generated HTML the only source of truth.

---

## 🔍 SEO Analysis

SEO is designed as a reusable analyzer rather than something tightly coupled to the Blog UI.

Conceptually:

```ts
const result = analyzeSEO(content);
```

It can produce structured checks such as:

```ts
{
  score: 82,
  checks: [
    {
      id: "title-length",
      status: "pass"
    },
    {
      id: "meta-description",
      status: "pass"
    },
    {
      id: "heading-structure",
      status: "pass"
    },
    {
      id: "internal-links",
      status: "warning"
    }
  ]
}
```

Initial checks can include:

- Title presence
- Title length
- Meta description
- Meta description length
- H1 structure
- Heading hierarchy
- Content length
- Image alt text
- Internal links
- External links
- Focus keyword presence

The initial analyzer is intentionally **deterministic**.

No AI provider is required.

AI-assisted suggestions can be added later as an optional layer.

---

## 🔌 Adapter Architecture

TypeContent is designed to keep the editor independent from storage.

The core can expose an adapter contract such as:

```ts
interface ContentAdapter {
  create(input: CreateContentInput): Promise<Content>;
  get(id: string): Promise<Content | null>;
  update(id: string, input: UpdateContentInput): Promise<Content>;
  delete(id: string): Promise<void>;
  list(query?: ContentQuery): Promise<Content[]>;
  publish(id: string): Promise<Content>;
  unpublish(id: string): Promise<Content>;
}
```

This makes it possible to connect TypeContent to different environments without rewriting the editor.

Potential adapters include:

- Cloudflare D1
- Supabase
- PostgreSQL
- REST APIs
- Custom storage

The editor should not contain database-specific logic.

---

## ☁️ Cloudflare

Cloudflare is a first-class target for the architecture.

The project should remain compatible with:

```text
React
Next.js
Vite
Cloudflare Workers
Cloudflare Pages
```

Potential future Cloudflare infrastructure:

```text
Cloudflare Workers
        │
        ├── API
        ├── D1       → Content
        ├── R2       → Media
        ├── KV       → Cache / configuration
        └── Queues   → Background jobs
```

The current project does not require all of these services.

The architecture is simply designed so they can be introduced without coupling the editor to them.

---

## 🏗️ Project Architecture

The project is intended to evolve toward a structure similar to:

```text
typecontent/
├── apps/
│   ├── web/
│   └── docs/
│
├── packages/
│   ├── core/
│   ├── editor/
│   ├── markdown/
│   ├── seo/
│   ├── content-types/
│   ├── blocks/
│   └── cli/
│
├── examples/
│   ├── nextjs/
│   ├── vite/
│   ├── cloudflare/
│   └── remix/
│
└── templates/
    ├── blog/
    ├── docs/
    └── saas/
```

The exact structure may evolve as the project develops.

---

## 🛠️ Development

Clone the repository:

```bash
git clone https://github.com/YOUR_ORG/typecontent.git
cd typecontent
```

Install dependencies:

```bash
npm install
```

Start development:

```bash
npm run dev
```

Build:

```bash
npm run build
```

> Update these commands if the final repository uses a different package manager or monorepo setup.

---

## 🧭 Roadmap

### Phase 1 — Playground

- [x] Product concept
- [ ] Unified editor UI
- [ ] Edit / Preview / Split
- [ ] Content type selector
- [ ] Blog
- [ ] Page
- [ ] Docs
- [ ] Knowledge Base
- [ ] Changelog
- [ ] Course
- [ ] SEO analyzer
- [ ] Metadata panels
- [ ] Responsive editor

### Phase 2 — Editor Core

- [ ] Markdown AST
- [ ] Custom blocks
- [ ] Slash commands
- [ ] Keyboard shortcuts
- [ ] Drag & drop blocks
- [ ] Image handling
- [ ] Embeds
- [ ] Extensible toolbar

### Phase 3 — Developer Experience

- [ ] `typecontent` CLI
- [ ] Copy-to-project workflow
- [ ] Reusable package distribution
- [ ] Starter templates
- [ ] Next.js example
- [ ] Vite example
- [ ] Cloudflare example

### Phase 4 — Persistence

- [ ] Content adapter interface
- [ ] Local adapter
- [ ] Cloudflare D1 adapter
- [ ] Supabase adapter
- [ ] PostgreSQL adapter
- [ ] Draft / publish
- [ ] Revisions
- [ ] Versioning

### Phase 5 — Advanced Content

- [ ] Custom content types
- [ ] Custom fields
- [ ] Custom blocks
- [ ] Taxonomies
- [ ] Relations
- [ ] Media library
- [ ] Content workflows

---

## 🤝 Contributing

TypeContent is being built for SaaS builders and the open-source community.

Contributions are welcome.

Good places to contribute include:

- Editor UX
- Markdown support
- Content types
- SEO rules
- Custom blocks
- Adapters
- Cloudflare support
- Documentation
- Examples
- Accessibility
- Keyboard navigation
- Performance

If you want to propose a large architectural change, open an issue first so the approach can be discussed before implementation.

---

## 🎯 Design Principles

### One editor

Don't build a separate editor for every content type.

### Configuration over duplication

Content types should describe capabilities rather than duplicate components.

### Own your code

Developers should be able to copy and customize TypeContent instead of being locked into a hosted service.

### Framework-friendly

The core should not depend on a specific application framework.

### Adapter-first

Storage and infrastructure should be replaceable.

### Markdown-friendly

Content should remain portable.

### Deterministic core

Core functionality should not require AI or proprietary APIs.

### Progressive complexity

A developer should be able to start with the editor and add persistence, adapters, media, workflows, and other capabilities only when needed.

---

## 📄 License

TypeContent is intended to be open source.

The final license will be defined before the first public release.

---

## ❤️ Built for SaaS Builders

TypeContent exists because SaaS builders should spend their time building their product—not rebuilding the same content editor for the tenth time. This project was built with [Lovable](https://lovable.dev/invite/YQVMQGE). For the **Demo**: look this [screenshot](https://prnt.sc/d5TFluyzmSyX)

**One editor. Every content type.**

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
