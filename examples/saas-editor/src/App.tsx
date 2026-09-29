/**
 * Minimal SaaS integration: ContentEditor + Blog/Docs types + SEO + preview,
 * with in-memory content. No auth, no database.
 * Assumes the TypeContent source was copied in (`typecontent add editor`).
 */
import { useState } from "react";

import { ContentEditor, type ContentEditorChange } from "@/components/typecontent/editor/ContentEditor";
import { blog, docs } from "@/core/content-types/registry";

export default function App() {
  const [type, setType] = useState<"blog" | "docs">("blog");
  const [saved, setSaved] = useState<ContentEditorChange | null>(null);

  return (
    <main>
      <button onClick={() => setType(type === "blog" ? "docs" : "blog")}>
        Switch to {type === "blog" ? "Docs" : "Blog"}
      </button>
      <ContentEditor
        key={type}
        contentType={type === "blog" ? blog : docs}
        value={{ title: "", markdown: "## Start here\n\nWrite something." }}
        onChange={setSaved}
        showTypeSwitcher={false}
      />
      <pre>{saved ? `${saved.title} · ${saved.markdown.length} chars` : null}</pre>
    </main>
  );
}
