import { createFileRoute } from "@tanstack/react-router";

import { SiteHeader } from "@/components/typecontent/SiteHeader";
import { contentTypes, featureLabels } from "@/core/content-types/registry";

export const Route = createFileRoute("/content-types")({
  head: () => ({
    meta: [
      { title: "Content Types — TypeContent" },
      { name: "description", content: "The six built-in TypeContent content types and the features, metadata and SEO rules each one enables." },
      { property: "og:title", content: "Content Types — TypeContent" },
      { property: "og:description", content: "Blog, Page, Docs, Knowledge Base, Changelog and Course — each with its own fields and SEO policy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ContentTypesPage,
});

function ContentTypesPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Content Types</h1>
        <p className="mt-2 text-muted-foreground">Each type defines features, metadata groups and SEO policy.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {contentTypes.map((t) => (
            <article key={t.id} className="panel rounded-lg border border-border bg-surface p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{t.name}</h2>
                <code className="font-mono text-xs text-muted-foreground">{t.id}</code>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {Object.entries(t.features).filter(([, v]) => v).map(([k]) => (
                  <span key={k} className="rounded bg-secondary px-2 py-0.5 font-mono text-xs">{featureLabels[k] ?? k}</span>
                ))}
              </div>
              <div className="mt-4 font-mono text-xs text-muted-foreground">
                SEO {t.seo.enabled ? `on · title ${t.seo.titleRange.join("–")} · min ${t.seo.minWords} words` : "off"}
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
