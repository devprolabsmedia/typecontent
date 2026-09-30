import { createFileRoute } from "@tanstack/react-router";

import { SiteHeader } from "@/components/typecontent/SiteHeader";
import { Snippet } from "@/components/typecontent/editor/CopyToProjectDialog";
import { blog, docs } from "@/core/content-types/registry";
import { customTypeExample, integrationExample } from "@/core/distribution/examples";
import { componentRegistry } from "@/core/distribution/registry";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Docs — Add TypeContent to your project" },
      {
        name: "description",
        content:
          "Add the TypeContent editor with the CLI, packages or by copying the source. Define custom content types and own the code.",
      },
      { property: "og:title", content: "TypeContent Docs — You own the code" },
      {
        property: "og:description",
        content: "CLI, packages or copy source: put a unified content editor inside your SaaS.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DocsPage,
});

function Section({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
        {title}
        {badge && (
          <span className="rounded border border-border px-1.5 py-0.5 font-mono text-xs font-normal text-muted-foreground">
            {badge}
          </span>
        )}
      </h2>
      {children}
    </section>
  );
}

function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-10 px-4 py-10">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Add TypeContent to your project</h1>
          <p className="mt-2 text-muted-foreground">
            TypeContent is open source. You own the code: copy it, customize it, connect your own
            storage later. No hosted service required.
          </p>
        </div>

        <Section title="Option 1: CLI" badge="Coming with the CLI package">
          <Snippet code={"npx typecontent init\nnpx typecontent add editor"} />
          <p className="text-sm text-muted-foreground">
            <code className="font-mono">init</code> detects your package manager, TypeScript and
            React, then writes <code className="font-mono">typecontent.config.ts</code>.{" "}
            <code className="font-mono">add</code> copies source into your project and never
            overwrites existing files unless you pass <code className="font-mono">--force</code>.
          </p>
          <Snippet
            label="typecontent.config.ts"
            code={`export default {\n  componentsDir: "./src/components/typecontent",\n  contentTypesDir: "./src/content-types",\n  blocksDir: "./src/components/typecontent/blocks",\n};`}
          />
        </Section>

        <Section title="Option 2: Packages" badge="Planned — not on npm yet">
          <Snippet code="npm install @typecontent/editor @typecontent/core" />
          <ul className="space-y-1 text-sm">
            {Object.values(componentRegistry).map((e) => (
              <li key={e.id}>
                <span className="font-mono text-primary">{e.packageName}</span>{" "}
                <span className="text-muted-foreground">— {e.description}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Option 3: Copy source">
          <p className="text-sm text-muted-foreground">
            Copy the editor source into your application. Everything runs on the client — no
            server-only modules, no Node APIs — so it works in Vite, Next.js and Cloudflare apps.
          </p>
        </Section>

        <Section title="Blog integration">
          <Snippet code={integrationExample(blog)} />
        </Section>
        <Section title="Docs integration">
          <Snippet code={integrationExample(docs)} />
        </Section>

        <Section title="Create your own content type">
          <p className="text-sm text-muted-foreground">
            Six types ship built in. Case studies, recipes, job posts, FAQs — define anything with{" "}
            <code className="font-mono">defineContentType</code>. The editor stays the same; only
            configuration changes.
          </p>
          <Snippet code={customTypeExample} />
        </Section>

        <Section title="Connect storage">
          <Snippet
            code={`const adapter: ContentAdapter = {\n  create, get, update, delete: remove, list, publish, unpublish,\n};`}
          />
          <p className="font-mono text-xs text-muted-foreground">Open source · License: TBD</p>
        </Section>
      </main>
    </div>
  );
}
