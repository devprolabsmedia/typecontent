/**
 * Video URL parsing for structured content (e.g. course lessons).
 * YouTube only for now; the model is provider-ready (vimeo, future providers).
 * Pure functions — no React, no network.
 */

export type VideoProvider = "youtube";

export interface ParsedVideo {
  provider: VideoProvider;
  videoId: string;
  /** Privacy-conscious embed URL (youtube-nocookie, no autoplay). */
  embedUrl: string;
  /** Static thumbnail URL. */
  thumbnailUrl: string;
}

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * Parse a video URL. Supports youtube.com/watch?v=, youtu.be/, and
 * youtube.com/embed/. Returns null for anything else — arbitrary URLs are
 * not accepted as videos.
 */
export function parseVideoUrl(raw: string): ParsedVideo | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "");
  let id: string | null = null;
  if (host === "youtu.be") {
    id = url.pathname.slice(1).split("/")[0] ?? null;
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    else if (url.pathname.startsWith("/embed/")) id = url.pathname.slice(7).split("/")[0] ?? null;
    else if (url.pathname.startsWith("/shorts/")) id = url.pathname.slice(8).split("/")[0] ?? null;
  }
  if (!id || !YOUTUBE_ID.test(id)) return null;
  return {
    provider: "youtube",
    videoId: id,
    embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
    thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  };
}
