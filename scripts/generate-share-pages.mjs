import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const publicDir = path.join(repoRoot, "public");
const articlesPath = path.join(publicDir, "content", "articles.json");
const shareDir = path.join(publicDir, "share");

const PUBLIC_MAGAZINE_URL =
  process.env.PUBLIC_MAGAZINE_URL || "https://joliel21.github.io/Magazine/";

const PUBLIC_ASSET_URL =
  process.env.PUBLIC_ASSET_URL || "https://joliel21.github.io/Magazine/";

const SITE_NAME = "Breathtaking Awareness";
const AUTHOR_NAME = "Jolie Lizana";

const FALLBACK_IMAGE =
  process.env.FALLBACK_SHARE_IMAGE ||
  new URL(
    "images/articles/phlip-side/blessed.png",
    PUBLIC_ASSET_URL,
  ).toString();

const ARTICLE_IMAGE_OVERRIDES = {
  "since-my-pulmonary-hypertension-diagnosis-im-tragically-blessed":
    new URL(
      "images/articles/phlip-side/blessed.png",
      PUBLIC_ASSET_URL,
    ).toString(),
  "tragically-blessed":
    new URL(
      "images/articles/phlip-side/blessed.png",
      PUBLIC_ASSET_URL,
    ).toString(),
  "my-delayed-ph-diagnosis-reveals-a-lesson-in-claiming-victory-over-loss":
    new URL(
      "images/articles/phlip-side/claiming-victory-columnist-graphic.jpg",
      PUBLIC_ASSET_URL,
    ).toString(),
  "the-pandoras-box-of-making-plans-and-managing-friendships-with-ph":
    new URL(
      "images/articles/phlip-side/pandoras-box-window-rain.jpg",
      PUBLIC_ASSET_URL,
    ).toString(),
  "why-a-day-of-rest-is-a-victory-with-pulmonary-hypertension":
    new URL(
      "images/articles/phlip-side/rest-victory-reading.jpg",
      PUBLIC_ASSET_URL,
    ).toString(),
  "getting-through-the-fog-of-grief-to-see-clearly-on-the-other-side":
    new URL(
      "images/articles/phlip-side/fog-of-grief-zaylan-apple-tree.jpg",
      PUBLIC_ASSET_URL,
    ).toString(),
  "the-high-cost-of-time-spent-managing-a-chronic-illness":
    new URL(
      "images/articles/phlip-side/high-cost-phone-call.jpg",
      PUBLIC_ASSET_URL,
    ).toString(),
  "advocating-for-the-ph-community-is-meaningful-work-it-helps-me-too":
    new URL(
      "images/articles/phlip-side/advocating-ph-community-support-rare.jpg",
      PUBLIC_ASSET_URL,
    ).toString(),
  "being-mindful-of-good-moments-helps-me-through-difficult-times":
    new URL(
      "images/articles/phlip-side/mindful-good-moments-holiday.jpg",
      PUBLIC_ASSET_URL,
    ).toString(),
  "when-coexisting-conditions-complicate-our-health-strategy":
    new URL(
      "images/articles/phlip-side/coexisting-conditions-pumpkin-display.jpg",
      PUBLIC_ASSET_URL,
    ).toString(),
  "grieving-the-mom-i-used-to-be-before-ph-entered-my-life":
    new URL(
      "images/articles/phlip-side/grieving-mom-state-park-2014.jpg",
      PUBLIC_ASSET_URL,
    ).toString(),
  "how-i-transitioned-from-an-iv-therapy-pump-to-oral-meds":
    new URL(
      "images/articles/phlip-side/iv-pump-to-oral-state-capitol-2025.jpg",
      PUBLIC_ASSET_URL,
    ).toString(),
  "legislative-advocacy-can-make-a-difference-for-ph-care":
    new URL(
      "images/articles/phlip-side/legislative-advocacy-us-capitol.jpg",
      PUBLIC_ASSET_URL,
    ).toString(),
  "im-learning-how-to-live-fully-not-just-survive-with-pulmonary-hypertension":
    new URL(
      "images/articles/phlip-side/live-fully-dc-mural.jpg",
      PUBLIC_ASSET_URL,
    ).toString(),
  "i-learn-a-hard-lesson-about-traveling-with-pulmonary-hypertension":
    new URL(
      "images/articles/phlip-side/learned-a-hard-lesson-share.jpg",
      PUBLIC_ASSET_URL,
    ).toString(),
  "how-to-explain-the-complexities-of-pulmonary-hypertension-to-others":
    new URL(
      "images/articles/phlip-side/How-to-explain.jpg",
      PUBLIC_ASSET_URL,
    ).toString(),
  "sticky-bras-are-good-for-the-heart":
    new URL(
      "images/articles/phlip-side/Nippies.png",
      PUBLIC_ASSET_URL,
    ).toString(),
  "how-flashing-the-boobs-is-helping-to-save-womens-lives":
    new URL(
      "images/articles/phlip-side/Jolie-Flash-the-boobs.png",
      PUBLIC_ASSET_URL,
    ).toString(),
  "a-ph-advocate-finds-hope-in-new-research-anxiety-at-the-airport":
    new URL(
      "images/articles/phlip-side/Symposium.jpg",
      PUBLIC_ASSET_URL,
    ).toString(),
  "the-weight-of-staying-well":
    new URL(
      "images/articles/scleroderma-foundation-of-greater-chicago/the_weight_of_staying_well_8x11_5.jpg",
      PUBLIC_ASSET_URL,
    ).toString(),
  "the_weight_of_staying_well":
    new URL(
      "images/articles/scleroderma-foundation-of-greater-chicago/the_weight_of_staying_well_8x11_5.jpg",
      PUBLIC_ASSET_URL,
    ).toString(),
};

const ARTICLE_DATE_OVERRIDES = {
  "since-my-pulmonary-hypertension-diagnosis-im-tragically-blessed": "2025-07-11",
  "tragically-blessed": "2025-07-11",
  "my-delayed-ph-diagnosis-reveals-a-lesson-in-claiming-victory-over-loss": "2025-07-25",
  "the-pandoras-box-of-making-plans-and-managing-friendships-with-ph": "2025-08-01",
  "why-a-day-of-rest-is-a-victory-with-pulmonary-hypertension": "2025-08-15",
  "getting-through-the-fog-of-grief-to-see-clearly-on-the-other-side": "2025-10-03",
  "sticky-bras-are-good-for-the-heart": "2025-09-12",
  "how-flashing-the-boobs-is-helping-to-save-womens-lives": "2025-09-05",
  "a-ph-advocate-finds-hope-in-new-research-anxiety-at-the-airport": "2025-09-26",
  "how-to-explain-the-complexities-of-pulmonary-hypertension-to-others": "2026-01-30",
};

const normalizeArticleKey = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const normalizeAssetPath = (value = "") => {
  const raw = String(value || "")
    .trim()
    .replace(/^public\//, "")
    .replace(/^\/+/, "");

  if (!raw) return "";

  // articles.json usually stores filenames like "phlip-side/image.jpg".
  // Public URL must be "images/articles/phlip-side/image.jpg".
  if (
    /^(phlip-side|scleroderma-foundation-of-greater-chicago|rants-of-the-psyche|tips-tricks)\//i.test(
      raw,
    )
  ) {
    return `images/articles/${raw}`;
  }

  if (raw.startsWith("articles/")) {
    return `images/${raw}`;
  }

  return raw;
};

const toPublicAssetUrl = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;

  return new URL(normalizeAssetPath(raw), PUBLIC_ASSET_URL).toString();
};

const getMarkdownFileText = (article) => {
  if (article.markdownContent) return String(article.markdownContent);

  const markdownPath =
    article.markdownPath || article.path || article.filename || "";
  if (!markdownPath) return "";

  const normalizedPath = String(markdownPath)
    .trim()
    .replace(/^public\//, "")
    .replace(/^\/+/, "");
  const fullPath = path.join(publicDir, normalizedPath);

  if (!fs.existsSync(fullPath)) return "";
  return fs.readFileSync(fullPath, "utf8");
};

const removeImageAndCaptionBlocks = (value = "") =>
  String(value)
    .replace(/!\[[^\]]*?\]\([^)]+?\)/g, "")
    .replace(
      /<!--\s*BTA_IMAGE_START\s*-->[\s\S]*?<!--\s*BTA_IMAGE_END\s*-->/gi,
      "",
    )
    .replace(/Image\/caption placement[\s\S]*?(?=\n\s*\n|$)/gi, "")
    .replace(/^Image(?:\s+\d+)?:.*$/gim, "")
    .replace(/^Caption(?:\s+\d+)?:.*$/gim, "")
    .replace(/^Alt(?:\s+text)?(?:\s+\d+)?:.*$/gim, "");

const stripMarkdown = (value = "") =>
  removeImageAndCaptionBlocks(value)
    .replace(/<!--\s*PAGE_BREAK\s*-->/gi, "")
    .replace(/^#+\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/^>\s*/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();

const getFirstImageFromMarkdown = (markdown = "") => {
  const mdImage = markdown.match(/!\[[^\]]*?\]\((.*?)\)/);
  if (mdImage?.[1]) return mdImage[1];

  const btaImageBlock = markdown.match(
    /<!--\s*BTA_IMAGE_START\s*-->([\s\S]*?)<!--\s*BTA_IMAGE_END\s*-->/i,
  );
  const btaImageText = btaImageBlock?.[1] || "";
  const btaImageMatch = btaImageText.match(/Image(?:\s+\d+)?:\s*([^\n]+)/i);
  return btaImageMatch?.[1] || "";
};

const getArticleImage = (article, markdown) => {
  const idKey = normalizeArticleKey(article.id || "");
  const titleKey = normalizeArticleKey(article.title || "");

  if (ARTICLE_IMAGE_OVERRIDES[idKey]) return ARTICLE_IMAGE_OVERRIDES[idKey];
  if (ARTICLE_IMAGE_OVERRIDES[titleKey]) return ARTICLE_IMAGE_OVERRIDES[titleKey];

  const imageRecord = Array.isArray(article.images) ? article.images[0] : null;
  const imageValue =
    getFirstImageFromMarkdown(markdown) ||
    article.image ||
    article.imageUrl ||
    article.coverImage ||
    imageRecord?.src ||
    imageRecord?.url ||
    imageRecord?.filename ||
    "";

  return toPublicAssetUrl(imageValue) || FALLBACK_IMAGE;
};

const removeMetadataLines = (text = "") =>
  removeImageAndCaptionBlocks(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^by\s+jolie\s+lizana\b/i.test(line))
    .filter((line) => !/^written\s+by\s+jolie\s+lizana\b/i.test(line))
    .filter((line) => !/^publication\s+date\b/i.test(line))
    .filter((line) => !/^(editorial|published|posted|updated)\s*(\||:|—|-)/i.test(line))
    .filter((line) => !/^\*?\s*(editorial|published|posted|updated)\s*(\||:|—|-)/i.test(line))
    .join("\n");

const getArticleExcerpt = (article, markdown) => {
  const metadataExcerpt =
    article.excerpt ||
    article.description ||
    article.summary ||
    article.subtitle ||
    "";

  const cleanedMarkdown = removeMetadataLines(markdown)
    .replace(article.title || "", "")
    .trim();

  const markdownExcerpt = stripMarkdown(cleanedMarkdown)
    .replace(/^by\s+jolie\s+lizana\b.*?---\s*/i, "")
    .replace(/^publication\s+date\b.*?---\s*/i, "")
    .replace(/^editorial\b.*?---\s*/i, "")
    .replace(/\bImage\/caption placement\b.*$/i, "")
    .trim();

  let excerpt = stripMarkdown(metadataExcerpt) || markdownExcerpt;

  if (excerpt.length < 100 && markdownExcerpt) {
    excerpt = `${excerpt}. ${markdownExcerpt}`
      .replace(/\.\s*\./g, ".")
      .trim();
  }

  if (!excerpt) {
    excerpt =
      "A Breathtaking Awareness writing by Jolie Lizana on advocacy, chronic illness, and lived experience.";
  }

  if (excerpt.length <= 180) return excerpt;
  return `${excerpt.slice(0, 177).trim()}…`;
};

const getPublishedDate = (article, markdown) => {
  const idKey = normalizeArticleKey(article.id || "");
  const titleKey = normalizeArticleKey(article.title || "");

  if (ARTICLE_DATE_OVERRIDES[idKey]) return ARTICLE_DATE_OVERRIDES[idKey];
  if (ARTICLE_DATE_OVERRIDES[titleKey]) return ARTICLE_DATE_OVERRIDES[titleKey];

  const source = [
    article.date,
    article.publishedDate,
    article.publishDate,
    article.publicationDate,
    markdown,
  ]
    .filter(Boolean)
    .join("\n");

  const isoMatch = source.match(/\b\d{4}-\d{2}-\d{2}\b/);
  if (isoMatch?.[0]) return isoMatch[0];

  const monthMatch = source.match(
    /\b(?:January|February|March|April|May|June|July|August|Aug\.|September|Sept\.|October|November|December)\s+\d{1,2},\s+\d{4}\b/i,
  );
  if (monthMatch?.[0]) {
    const normalized = monthMatch[0]
      .replace(/^Aug\./i, "August")
      .replace(/^Sept\./i, "September");
    const parsed = Date.parse(normalized);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString().slice(0, 10);
    }
  }

  return "";
};

const toIsoPublishedTime = (date = "") => {
  if (!date) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return `${date}T12:00:00Z`;
  }

  const parsed = Date.parse(date);
  if (Number.isNaN(parsed)) return "";
  return new Date(parsed).toISOString();
};

const readArticles = () => {
  if (!fs.existsSync(articlesPath)) {
    throw new Error(`Missing articles file: ${articlesPath}`);
  }

  const raw = JSON.parse(fs.readFileSync(articlesPath, "utf8"));
  return Array.isArray(raw) ? raw : raw.articles || [];
};

const renderShareHtml = ({
  title,
  excerpt,
  imageUrl,
  shareUrl,
  magazineUrl,
  publishedDate,
}) => {
  const publishedTime = toIsoPublishedTime(publishedDate);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />

  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(excerpt)}" />
  <meta name="author" content="${escapeHtml(AUTHOR_NAME)}" />

  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(excerpt)}" />
  <meta property="og:image" content="${escapeHtml(imageUrl)}" />
  <meta property="og:image:secure_url" content="${escapeHtml(imageUrl)}" />
  <meta property="og:image:alt" content="${escapeHtml(title)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${escapeHtml(shareUrl)}" />
  <meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />
  <meta property="article:author" content="${escapeHtml(AUTHOR_NAME)}" />
  ${publishedTime ? `<meta property="article:published_time" content="${escapeHtml(publishedTime)}" />` : ""}

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(excerpt)}" />
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />

  <link rel="canonical" href="${escapeHtml(shareUrl)}" />

  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #021A2B;
      color: #F8F3E8;
      font-family: Inter, Montserrat, Arial, sans-serif;
    }
    main {
      max-width: 720px;
      padding: 40px;
      text-align: center;
    }
    img {
      max-width: 100%;
      max-height: 320px;
      object-fit: cover;
      border: 1px solid rgba(201,164,92,.65);
      margin-bottom: 24px;
    }
    h1 {
      margin: 0 0 12px;
      font-size: clamp(28px, 5vw, 44px);
      line-height: 1.05;
    }
    p {
      font-size: 18px;
      line-height: 1.45;
      opacity: .9;
    }
    a {
      color: #C9A45C;
    }
  </style>
</head>
<body>
  <main>
    <img src="${escapeHtml(imageUrl)}" alt="" />
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(excerpt)}</p>
    <p>This share preview page is here so social platforms can read the title, image, and description.</p>
    <p><a href="${escapeHtml(magazineUrl)}">Open this writing in the magazine</a></p>
  </main>
</body>
</html>`;
};

const generateSharePages = () => {
  const articles = readArticles();
  fs.mkdirSync(shareDir, { recursive: true });

  for (const article of articles) {
    const id = normalizeArticleKey(article.id || article.title || "");
    if (!id) continue;

    const title = article.title || SITE_NAME;
    const markdown = getMarkdownFileText(article);
    const excerpt = getArticleExcerpt(article, markdown);
    const imageUrl = getArticleImage(article, markdown);
    const publishedDate = getPublishedDate(article, markdown);
    const shareUrl = new URL(`share/${id}/`, PUBLIC_MAGAZINE_URL).toString();
    const magazineUrl = new URL(
      `?article=${encodeURIComponent(id)}`,
      PUBLIC_MAGAZINE_URL,
    ).toString();

    const articleShareDir = path.join(shareDir, id);
    fs.mkdirSync(articleShareDir, { recursive: true });

    fs.writeFileSync(
      path.join(articleShareDir, "index.html"),
      renderShareHtml({
        title,
        excerpt,
        imageUrl,
        shareUrl,
        magazineUrl,
        publishedDate,
      }),
      "utf8",
    );
  }

  fs.writeFileSync(
    path.join(shareDir, "index.html"),
    `<!doctype html><html><head><meta charset="utf-8"><title>${SITE_NAME}</title><meta name="description" content="A collected volume of advocacy, reflection, education, and lived experience."><meta name="author" content="${AUTHOR_NAME}"><meta property="og:title" content="${SITE_NAME}"><meta property="og:description" content="A collected volume of advocacy, reflection, education, and lived experience."><meta property="og:image" content="${FALLBACK_IMAGE}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:url" content="${new URL("share/", PUBLIC_MAGAZINE_URL).toString()}"></head><body><a href="${PUBLIC_MAGAZINE_URL}">Open ${SITE_NAME}</a></body></html>`,
    "utf8",
  );

  console.log(`Generated ${articles.length} static share pages in ${shareDir}`);
};

generateSharePages();
