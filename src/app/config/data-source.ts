/**
 * Data Source Configuration
 *
 * This file controls where the magazine reader loads content from in both:
 * - standalone Vite preview/builds, and
 * - WordPress plugin embeds.
 *
 * In WordPress, the PHP plugin passes URLs through window.theWordsWeCarryConfig.
 * Always prefer those WordPress URLs when they exist.
 */

declare global {
  interface Window {
    theWordsWeCarryConfig?: {
      configUrl?: string;
      defaultConfigUrl?: string;
      pluginUrl?: string;
      assetsUrl?: string;
      localManifestUrl?: string;
      localViewerUrl?: string;
      articlesUrl?: string;
      chaptersUrl?: string;
      baseRawUrl?: string;
      frontMatterUrl?: string;
      chapterDescriptionsUrl?: string;
      magazineManifestUrl?: string;
      wordpressMagazineUrl?: string;
      analyticsUrl?: string;
    };
  }
}

export type DataFileType =
  | "VIEWER_JSON"
  | "PUBLISH_MANIFEST_JSON"
  | "RUNTIME_CSS"
  | "RUNTIME_JS"
  | "ARTICLES_JSON"
  | "CHAPTERS_JSON"
  | "FRONT_MATTER_JSON"
  | "CHAPTER_DESCRIPTIONS_JSON"
  | "MAGAZINE_MANIFEST_JSON"
  | "WORDPRESS_MAGAZINE_JSON"
  | "ANALYTICS_URL"
  | "BASE_RAW_URL";

const RRM_PUBLIC_BASE =
  "https://raw.githubusercontent.com/Joliel21/RRM/main/magazine-source/public/";
const EMPTY_ARRAY_JSON = "data:application/json,%5B%5D";
const EMPTY_OBJECT_JSON = "data:application/json,%7B%7D";

export const DATA_SOURCE_CONFIG = {
  // Standalone builds now use Joliel21/RRM as the reader content repository.
  USE_EXTERNAL_URLS: true,

  EXTERNAL_URLS: {
    VIEWER_JSON: EMPTY_OBJECT_JSON,
    PUBLISH_MANIFEST_JSON: `${RRM_PUBLIC_BASE}publish_manifest.json`,
    RUNTIME_CSS: "data:text/css,",
    RUNTIME_JS: "data:text/javascript,",
    ARTICLES_JSON: EMPTY_ARRAY_JSON,
    CHAPTERS_JSON: EMPTY_ARRAY_JSON,
    FRONT_MATTER_JSON: `${RRM_PUBLIC_BASE}content/front-matter.json`,
    CHAPTER_DESCRIPTIONS_JSON: EMPTY_OBJECT_JSON,
    MAGAZINE_MANIFEST_JSON: EMPTY_OBJECT_JSON,
    WORDPRESS_MAGAZINE_JSON: "",
    ANALYTICS_URL: "",
    BASE_RAW_URL: RRM_PUBLIC_BASE,
  },

  LOCAL_PATHS: {
    VIEWER_JSON: "/viewer.json",
    PUBLISH_MANIFEST_JSON: "/publish_manifest.json",
    RUNTIME_CSS: "/runtime.css",
    RUNTIME_JS: "/runtime.js",
    ARTICLES_JSON: "/content/articles.json",
    CHAPTERS_JSON: "/content/chapters.json",
    FRONT_MATTER_JSON: "/content/front-matter.json",
    CHAPTER_DESCRIPTIONS_JSON: "/content/chapter-descriptions.json",
    MAGAZINE_MANIFEST_JSON: "/content/magazine-manifest.json",
    WORDPRESS_MAGAZINE_JSON: "",
    ANALYTICS_URL: "",
    BASE_RAW_URL: "/",
  },
};

function getWordPressConfigUrl(fileType: DataFileType): string | null {
  if (typeof window === "undefined") return null;

  const wpConfig = window.theWordsWeCarryConfig;
  if (!wpConfig) return null;

  switch (fileType) {
    case "PUBLISH_MANIFEST_JSON":
      return (
        wpConfig.configUrl ||
        wpConfig.localManifestUrl ||
        wpConfig.defaultConfigUrl ||
        null
      );
    case "VIEWER_JSON":
      return wpConfig.localViewerUrl || null;
    case "ARTICLES_JSON":
      return wpConfig.articlesUrl || DATA_SOURCE_CONFIG.EXTERNAL_URLS.ARTICLES_JSON;
    case "CHAPTERS_JSON":
      return wpConfig.chaptersUrl || DATA_SOURCE_CONFIG.EXTERNAL_URLS.CHAPTERS_JSON;
    case "FRONT_MATTER_JSON":
      return wpConfig.frontMatterUrl || DATA_SOURCE_CONFIG.EXTERNAL_URLS.FRONT_MATTER_JSON;
    case "CHAPTER_DESCRIPTIONS_JSON":
      return (
        wpConfig.chapterDescriptionsUrl ||
        DATA_SOURCE_CONFIG.EXTERNAL_URLS.CHAPTER_DESCRIPTIONS_JSON
      );
    case "MAGAZINE_MANIFEST_JSON":
      return (
        wpConfig.magazineManifestUrl ||
        DATA_SOURCE_CONFIG.EXTERNAL_URLS.MAGAZINE_MANIFEST_JSON
      );
    case "WORDPRESS_MAGAZINE_JSON":
      return wpConfig.wordpressMagazineUrl || null;
    case "ANALYTICS_URL":
      return wpConfig.analyticsUrl || null;
    case "BASE_RAW_URL":
      return wpConfig.baseRawUrl || DATA_SOURCE_CONFIG.EXTERNAL_URLS.BASE_RAW_URL;
    case "RUNTIME_CSS":
      return wpConfig.assetsUrl
        ? `${wpConfig.assetsUrl}runtime.css`
        : DATA_SOURCE_CONFIG.EXTERNAL_URLS.RUNTIME_CSS;
    case "RUNTIME_JS":
      return wpConfig.assetsUrl
        ? `${wpConfig.assetsUrl}runtime.js`
        : DATA_SOURCE_CONFIG.EXTERNAL_URLS.RUNTIME_JS;
    default:
      return null;
  }
}

/**
 * Get the URL for a data file.
 * WordPress-localized URLs win over standalone defaults.
 */
export function getDataUrl(fileType: DataFileType): string {
  const wpUrl = getWordPressConfigUrl(fileType);
  if (wpUrl) return wpUrl;

  if (DATA_SOURCE_CONFIG.USE_EXTERNAL_URLS) {
    return DATA_SOURCE_CONFIG.EXTERNAL_URLS[fileType];
  }

  return DATA_SOURCE_CONFIG.LOCAL_PATHS[fileType];
}
