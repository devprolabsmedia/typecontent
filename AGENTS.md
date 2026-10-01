<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev/invite/VG98I04) using blueprint [Contextlab](https://context.web.id). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Content title is stored separately from the Markdown body and rendered as the only H1; bodies start at H2. Why: avoids duplicate titles and keeps one content model across modes.
- Editor keeps per-content-type drafts in memory when switching types. Why: switching must never overwrite another type's content.
- Distribution (dialog, docs, CLI) reads one data-only component registry in src/core/distribution/registry.ts. Why: adding a component never requires CLI changes, and nothing from the registry is executed.
- packages/* hold READMEs + CLI only; source stays in src/ until a real monorepo split. Why: clean boundaries without a premature migration.
- SEO is one pure analyzer (src/core/analyzers/seo.ts) running per-content-type rule sets from seo-rules.ts; the SEO panel only renders SEOResult. Why: no SEO logic in UI and deterministic, testable scoring.
- Course lessons are structured metadata (Lesson[]) edited via pure ops in src/core/content/lessons.ts. Why: keeps lesson order/state out of the Markdown body.
