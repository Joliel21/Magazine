#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const publicDir = path.join(root, 'public');
const contentDir = path.join(publicDir, 'content');
const errors = [];
const warnings = [];

function readJson(relPath, fallback = null) {
  const abs = path.join(root, relPath);
  if (!fs.existsSync(abs)) {
    if (fallback !== null) return fallback;
    errors.push(`Missing JSON file: ${relPath}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(abs, 'utf8'));
  } catch (err) {
    errors.push(`Invalid JSON in ${relPath}: ${err.message}`);
    return null;
  }
}

function normalizeSlug(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function existsPublicPath(value = '') {
  const clean = String(value || '').trim();
  if (!clean || /^https?:\/\//i.test(clean) || /^data:/i.test(clean)) return true;
  const rel = clean.replace(/^public\//, '').replace(/^\//, '');
  return fs.existsSync(path.join(publicDir, rel)) || fs.existsSync(path.join(root, rel));
}

const articlesPayload = readJson('public/content/articles.json', { articles: [] });
const chaptersPayload = readJson('public/content/chapters.json', []);
readJson('public/content/front-matter.json', { pages: [] });
readJson('public/content/chapter-descriptions.json', {});
const manifestPayload = readJson('public/content/magazine-manifest.json', { placementRules: [], overrides: [], backMatterPages: [] });

const articles = Array.isArray(articlesPayload) ? articlesPayload : (articlesPayload?.articles || []);
const chapters = Array.isArray(chaptersPayload) ? chaptersPayload : (chaptersPayload?.chapters || []);
const chapterSlugs = new Set(chapters.map((chapter, index) => normalizeSlug(chapter.slug || chapter.id || chapter.title || `chapter-${index}`)));
const articleIds = new Set();

articles.forEach((article, index) => {
  if (!article || typeof article !== 'object') {
    errors.push(`Article at index ${index} is not an object.`);
    return;
  }

  const id = String(article.id || '').trim();
  if (!id) errors.push(`Article at index ${index} is missing id.`);
  if (id && articleIds.has(id)) errors.push(`Duplicate article id: ${id}`);
  if (id) articleIds.add(id);

  if (!String(article.title || '').trim()) errors.push(`Article ${id || index} is missing title.`);

  const chapter = normalizeSlug(article.chapterSlug || article.chapter || article.chapterTitle || '');
  if (chapter && chapterSlugs.size > 0 && !chapterSlugs.has(chapter)) {
    warnings.push(`Article ${id || index} uses chapter "${article.chapter || article.chapterSlug}"; no exact chapter slug found. This may be okay if the reader normalizes titles.`);
  }

  const hasInlineBody = ['body', 'markdownContent', 'content', 'text'].some((key) => String(article[key] || '').trim().length > 0);
  const contentPath = article.contentPath || article.markdownPath || article.path || '';
  if (!hasInlineBody && !contentPath) errors.push(`Article ${id || index} has no body/contentPath.`);
  if (contentPath && !existsPublicPath(contentPath)) errors.push(`Article ${id || index} content path missing: ${contentPath}`);

  ['imageUrl', 'image', 'coverImage', 'thumbnailUrl'].forEach((key) => {
    if (article[key] && !existsPublicPath(article[key])) errors.push(`Article ${id || index} ${key} missing: ${article[key]}`);
  });
});



function validateManifestPage(page, index, groupName) {
  if (!page || typeof page !== 'object') {
    errors.push(`${groupName} page at index ${index} is not an object.`);
    return;
  }
  const id = String(page.id || '').trim();
  if (!id) errors.push(`${groupName} page at index ${index} is missing id.`);
  const pathValue = page.markdownPath || page.contentPath || page.path || '';
  const hasInlineBody = ['body', 'markdownContent', 'content', 'text'].some((key) => String(page[key] || '').trim().length > 0);
  const hasBlocks = Array.isArray(page.blocks) && page.blocks.length > 0;
  if (!hasInlineBody && !hasBlocks && !pathValue) {
    errors.push(`${groupName} page ${id || index} has no body/contentPath/blocks.`);
  }
  if (pathValue && !existsPublicPath(pathValue)) {
    errors.push(`${groupName} page ${id || index} content path missing: ${pathValue}`);
  }
  ['imageUrl', 'image', 'coverImage', 'thumbnailUrl'].forEach((key) => {
    if (page[key] && !existsPublicPath(page[key])) errors.push(`${groupName} page ${id || index} ${key} missing: ${page[key]}`);
  });
}

const manifestPages = Array.isArray(manifestPayload?.pages) ? manifestPayload.pages : [];
const backMatterPages = Array.isArray(manifestPayload?.backMatterPages) ? manifestPayload.backMatterPages : [];
manifestPages.forEach((page, index) => validateManifestPage(page, index, 'Manifest'));
backMatterPages.forEach((page, index) => validateManifestPage(page, index, 'Back matter'));

chapters.forEach((chapter, index) => {
  const ids = Array.isArray(chapter.articleIds) ? chapter.articleIds : [];
  ids.forEach((articleId) => {
    if (!articleIds.has(String(articleId))) {
      errors.push(`Chapter ${chapter.slug || chapter.title || index} references missing article id: ${articleId}`);
    }
  });
});

if (errors.length > 0) {
  console.error('\nContent validation failed:\n');
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  if (warnings.length) {
    console.error('\nWarnings:\n');
    warnings.forEach((warning) => console.error(`WARN: ${warning}`));
  }
  process.exit(1);
}

console.log('Content validation passed.');
if (warnings.length) {
  console.log('\nWarnings:');
  warnings.forEach((warning) => console.log(`WARN: ${warning}`));
}
