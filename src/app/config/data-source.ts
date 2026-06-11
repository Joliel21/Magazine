/**
 * Runtime data-source helpers for The Words We Carry.
 *
 * Canonical content source:
 *   public/content/articles.json
 *   public/content/chapters.json
 *   public/content/articles/{chapterSlug}/{articleSlug}.md
 *
 * The reader uses /content paths and does not need dated issue folders.
 */

declare global {
  interface Window {
    theWordsWeCarryConfig?: {
      configUrl?: string;
      contentBaseUrl?: string;
      magazineUrl?: string;
      articlesUrl?: string;
      chaptersUrl?: string;
    };
  }
}

export type DataFileType =
  | "PUBLISH_MANIFEST_JSON"
  | "RUNTIME_CSS"
  | "RUNTIME_JS";

const DEFAULT_MAGAZINE_URL = "https://joliel21.github.io/Magazine/";
const DEFAULT_RAW_PUBLIC_BASE_URL =
  "https://raw.githubusercontent.com/Joliel21/Magazine/main/public/";

const ensureTrailingSlash = (value: string) =>
  value.endsWith("/") ? value : `${value}/`;

export function getSameOriginBaseUrl(): string {
  if (typeof window === "undefined") return "/";

  const viteBase = import.meta.env.BASE_URL || "./";
  return ensureTrailingSlash(new URL(viteBase, window.location.href).toString());
}

export function getContentBaseUrl(): string {
  if (typeof window === "undefined") return DEFAULT_RAW_PUBLIC_BASE_URL;

  const config = window.theWordsWeCarryConfig;
  if (config?.contentBaseUrl) {
    return ensureTrailingSlash(config.contentBaseUrl);
  }

  const host = window.location.hostname.toLowerCase();
  const isLocal =
    host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";
  const isGitHubPages = host.endsWith("github.io");

  if (isLocal || isGitHubPages) {
    return getSameOriginBaseUrl();
  }

  // WordPress/plugin embeds do not have /public/content locally unless provided
  // through shortcode config, so default to the canonical GitHub raw content.
  return DEFAULT_RAW_PUBLIC_BASE_URL;
}

export function getMagazineUrl(): string {
  if (typeof window === "undefined") return DEFAULT_MAGAZINE_URL;

  const config = window.theWordsWeCarryConfig;
  if (config?.magazineUrl) return ensureTrailingSlash(config.magazineUrl);

  const host = window.location.hostname.toLowerCase();
  const isLocal =
    host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";
  const isGitHubPages = host.endsWith("github.io");

  if (isLocal || isGitHubPages) return getSameOriginBaseUrl();
  return DEFAULT_MAGAZINE_URL;
}

export function getArticlesUrl(): string {
  const config = typeof window !== "undefined" ? window.theWordsWeCarryConfig : undefined;
  if (config?.articlesUrl) return config.articlesUrl;
  return new URL("content/articles.json", getContentBaseUrl()).toString();
}

export function getChaptersUrl(): string {
  const config = typeof window !== "undefined" ? window.theWordsWeCarryConfig : undefined;
  if (config?.chaptersUrl) return config.chaptersUrl;
  return new URL("content/chapters.json", getContentBaseUrl()).toString();
}

export function resolvePublicUrl(value = ""): string {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^(https?:|data:|blob:)/i.test(raw)) return encodeURI(raw);

  const normalized = raw
    .replace(/^public\//, "")
    .replace(/^\/+/, "")
    .replace(/^(\.\.\/)+/, "");

  return encodeURI(new URL(normalized, getContentBaseUrl()).toString());
}

/**
 * Optional runtime files. These are not the content source.
 */
export function getDataUrl(fileType: DataFileType): string {
  if (fileType === "PUBLISH_MANIFEST_JSON") {
    const configUrl =
      typeof window !== "undefined" ? window.theWordsWeCarryConfig?.configUrl : "";
    return configUrl || new URL("publish_manifest.json", getContentBaseUrl()).toString();
  }

  const filename = fileType === "RUNTIME_CSS" ? "runtime.css" : "runtime.js";
  return new URL(filename, getContentBaseUrl()).toString();
}
