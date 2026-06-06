import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const publicDir = path.join(repoRoot, "public");
const articlesPath = path.join(publicDir, "content", "articles.json");
const shareDir = path.join(publicDir, "share");

const PUBLIC_MAGAZINE_URL =
  process.env.PUBLIC_MAGAZINE_URL || "https://joliel21.github.io/Magazine/";

const BASE_RAW_URL =
  process.env.BASE_RAW_URL ||
  "https://raw.githubusercontent.com/Joliel21/Magazine/main/public/";

const FALLBACK_IMAGE =
  process.env.FALLBACK_SHARE_IMAGE ||
  `${BASE_RAW_URL}images/brand/BreathtakingAwareness_ContentsIcon.png`;

const ARTICLE_IMAGE_OVERRIDES = {
  "since-my-pulmonary-hypertension-diagnosis-im-tragically-blessed":
    `${BASE_RAW_URL}images/articles/phlip-side/blessed.png`,
  "tragically-blessed":
    `${BASE_RAW_URL}images/articles/phlip-side/blessed.png`,
  "how-to-explain-the-complexities-of-pulmonary-hypertension-to-others":
    `${BASE_RAW_URL}images/articles/phlip-side/How-to-explain.jpg`,
  "sticky-bras-are-good-for-the-heart":
    `${BASE_RAW_URL}images/articles/phlip-side/Jolie-Flash-the-boobs.png`,
  "a-ph-advocate-finds-hope-in-new-research-anxiety-at-the-airport":
    `${BASE_RAW_URL}images/articles/phlip-side/Symposium.jpg`,
  "the-weight-of-staying-well":
    `${BASE_RAW_URL}images/articles/scleroderma-foundation-of-greater-chicago/the_weight_of_staying_well_8x11_5.jpg`,
  "the_weight_of_staying_well":
    `${BASE_RAW_URL}images/articles/scleroderma-foundation-of-greater-chicago/the_weight_of_staying_well_8x11_5.jpg`,
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

const stripMarkdown = (value = "") =>
  String(value)
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/<!--\s*BTA_IMAGE_START\s*-->[\s\S]*?<!--\s*BTA_IMAGE_END\s*-->/gi, "")
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

const toAbsoluteUrl = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return `${BASE_RAW_URL}${raw.replace(/^\/+/, "")}`;
  if (raw.startsWith("public/")) return `${BASE_RAW_URL}${raw.replace(/^public\//, "")}`;
  return `${BASE_RAW_URL}${raw}`;
};

const getMarkdownFileText = (article) => {
  if (article.markdownContent) return String(article.markdownContent);

  const markdownPath = article.markdownPath || article.path || article.filename || "";
  if (!markdownPath) return "";

  const normalizedPath = String(markdownPath).replace(/^public\//, "");
  const fullPath = path.join(publicDir, normalizedPath);

  if (!fs.existsSync(fullPath)) return "";
  return fs.readFileSync(fullPath, "utf8");
};

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

  return toAbsoluteUrl(imageValue) || FALLBACK_IMAGE;
};

const getArticleExcerpt = (article, markdown) => {
  const metadataExcerpt =
    article.excerpt || article.description || article.summary || article.subtitle || "";

  const cleanedMarkdown = stripMarkdown(markdown)
    .replace(article.title || "", "")
    .replace(/^Editorial\s*\|?\s*[^.]*\.?/i, "")
    .replace(/^Written by\s+[^.]*\.?/i, "")
    .trim();

  const excerpt = stripMarkdown(metadataExcerpt) || cleanedMarkdown;
  if (excerpt.length <= 165) return excerpt;
  return `${excerpt.slice(0, 162).trim()}…`;
};

const readArticles = () => {
  if (!fs.existsSync(articlesPath)) {
    throw new Error(`Missing articles file: ${articlesPath}`);
  }

  const raw = JSON.parse(fs.readFileSync(articlesPath, "utf8"));
  return Array.isArray(raw) ? raw : raw.articles || [];
};

const renderShareHtml = ({ id, title, excerpt, imageUrl, shareUrl, magazineUrl }) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />

  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(excerpt)}" />

  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(excerpt)}" />
  <meta property="og:image" content="${escapeHtml(imageUrl)}" />
  <meta property="og:url" content="${escapeHtml(shareUrl)}" />
  <meta property="og:site_name" content="Breathtaking Awareness" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(excerpt)}" />
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />

  <link rel="canonical" href="${escapeHtml(shareUrl)}" />
  <meta http-equiv="refresh" content="0; url=${escapeHtml(magazineUrl)}" />

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
    <p><a href="${escapeHtml(magazineUrl)}">Open this writing in the magazine</a></p>
  </main>
</body>
</html>
`;

const generateSharePages = () => {
  const articles = readArticles();
  fs.mkdirSync(shareDir, { recursive: true });

  for (const article of articles) {
    const id = normalizeArticleKey(article.id || article.title || "");
    if (!id) continue;

    const title = article.title || "Breathtaking Awareness";
    const markdown = getMarkdownFileText(article);
    const excerpt = getArticleExcerpt(article, markdown);
    const imageUrl = getArticleImage(article, markdown);
    const shareUrl = new URL(`share/${id}/`, PUBLIC_MAGAZINE_URL).toString();
    const magazineUrl = new URL(`?article=${encodeURIComponent(id)}`, PUBLIC_MAGAZINE_URL).toString();

    const articleShareDir = path.join(shareDir, id);
    fs.mkdirSync(articleShareDir, { recursive: true });

    fs.writeFileSync(
      path.join(articleShareDir, "index.html"),
      renderShareHtml({ id, title, excerpt, imageUrl, shareUrl, magazineUrl }),
      "utf8",
    );
  }

  fs.writeFileSync(
    path.join(shareDir, "index.html"),
    `<!doctype html><html><head><meta charset="utf-8"><title>Breathtaking Awareness</title><meta http-equiv="refresh" content="0; url=${PUBLIC_MAGAZINE_URL}"></head><body><a href="${PUBLIC_MAGAZINE_URL}">Open Breathtaking Awareness</a></body></html>`,
    "utf8",
  );

  console.log(`Generated ${articles.length} static share pages in ${shareDir}`);
};

generateSharePages();
