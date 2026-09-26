import { createFileRoute } from "@tanstack/react-router";

import { SiteHeader } from "@/components/typecontent/SiteHeader";
import { SITE } from "@/core/content/site";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Docs — Getting started with TypeContent" },
      { name: "description", content: "Install TypeContent, render the editor, add custom content types and plug in your own storage adapter." },
      { property: "og:title", content: "TypeContent Docs" },
      { property: "og:description", content: "Install, configure content types and connect storage in minutes." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DocsPage,
});

const steps = [
  { title: "Install", code: `bun add ${SITE.packageName}` },
  { title: "Render the editor", code: `import { ContentEditor } from "${SITE.packageName}";\n\n<ContentEditor contentType="blog" />` },
  {
    title: "Add a content type",
    code: `const release = {\n  id: "release",\n  name: "Release",\n  features: { version: true, tags: true },\n  metadataGroups: [...],\n  seo: { enabled: false, titleRange: [10, 60], descriptionRange: [50, 160], minWords: 60 },\n};`,
  },
  {
    title: "Connect storage",
    code: `const adapter: ContentAdapter = {\n  create, get, update, delete: remove, list, publish, unpublish,\n};`,
  },
];

function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Getting started</h1>
        <p className="mt-2 text-muted-foreground">
          Markdown is the canonical format. Content types drive every field and rule.
        </p>
        <ol className="mt-8 space-y-6">
          {steps.map((s, i) => (
            <li key={s.title}>
              <h2 className="font-semibold"><span className="mr-2 font-mono text-primary">{i + 1}.</span>{s.title}</h2>
              <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-surface p-4 font-mono text-xs leading-relaxed">{s.code}</pre>
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
}
