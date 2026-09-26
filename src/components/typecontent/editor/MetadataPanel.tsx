import { X } from "lucide-react";
import { useState } from "react";

import { hasFeature } from "@/core/content-types/registry";
import type { ContentTypeDefinition, Metadata, MetadataFieldDef, MetadataValue } from "@/types/typecontent";

const input =
  "w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:border-ring";

function TagsField({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState("");
  return (
    <div className="flex flex-wrap gap-1.5 rounded-md border border-input bg-background p-1.5">
      {value.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">
          {t}
          <button aria-label={`Remove ${t}`} onClick={() => onChange(value.filter((x) => x !== t))}>
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === ",") && draft.trim()) {
            e.preventDefault();
            if (!value.includes(draft.trim())) onChange([...value, draft.trim()]);
            setDraft("");
          }
        }}
        placeholder="Add + Enter"
        className="min-w-20 flex-1 bg-transparent px-1 text-sm outline-none"
      />
    </div>
  );
}

function Field({ f, value, onChange }: { f: MetadataFieldDef; value: MetadataValue; onChange: (v: MetadataValue) => void }) {
  switch (f.kind) {
    case "textarea":
      return <textarea rows={3} className={input + " resize-none"} placeholder={f.placeholder} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
    case "select":
      return (
        <select className={input} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    case "tags":
      return <TagsField value={Array.isArray(value) ? value : []} onChange={onChange} />;
    case "switch":
      return (
        <button
          role="switch"
          aria-checked={Boolean(value)}
          onClick={() => onChange(!value)}
          className={`relative h-5 w-9 rounded-full transition ${value ? "bg-primary" : "bg-input"}`}
        >
          <span className={`absolute top-0.5 size-4 rounded-full bg-background transition-all ${value ? "left-4.5" : "left-0.5"}`} />
        </button>
      );
    case "number":
      return <input type="number" className={input} placeholder={f.placeholder} value={value === null || value === undefined ? "" : String(value)} onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))} />;
    case "date":
      return <input type="date" className={input} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
    case "image":
      return <input className={input} placeholder="https://… image URL" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
    default:
      return <input className={input} placeholder={f.placeholder} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
  }
}

export function MetadataPanel({ type, metadata, onChange }: { type: ContentTypeDefinition; metadata: Metadata; onChange: (k: string, v: MetadataValue) => void }) {
  return (
    <div className="space-y-5">
      {type.metadataGroups.map((g) => (
        <section key={g.id} className="space-y-3">
          <h3 className="label-xs">{g.label}</h3>
          {g.fields.filter((f) => hasFeature(type, f.feature)).map((f) => (
            <label key={f.key} className="block space-y-1">
              <span className="text-xs text-muted-foreground">{f.label}</span>
              <Field f={f} value={metadata[f.key] ?? null} onChange={(v) => onChange(f.key, v)} />
              {f.hint && <span className="block text-[11px] text-muted-foreground">{f.hint}</span>}
            </label>
          ))}
        </section>
      ))}
    </div>
  );
}
