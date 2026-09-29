import { createFileRoute } from "@tanstack/react-router";

import { SiteHeader } from "@/components/typecontent/SiteHeader";
import { ContentEditor } from "@/components/typecontent/editor/ContentEditor";
import { SITE } from "@/core/content/site";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TypeContent — Markdown editor playground for every content type" },
      {
        name: "description",
        content:
          "Try the TypeContent editor: Markdown, live preview, SEO scoring and metadata for blogs, docs, changelogs and more.",
      },
      { property: "og:title", content: "TypeContent Playground" },
      {
        property: "og:description",
        content: "One editor for every content type — live preview, SEO and metadata built in.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-[1600px] px-4 pt-10">
        <p className="label-xs text-primary">{SITE.positioning}</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">{SITE.tagline}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Switch content types below — the toolbar, metadata fields and SEO rules adapt
          automatically.
        </p>
      </section>
      <ContentEditor showCopyToProject />
    </div>
  );
}
