import { readFile, writeFile } from "node:fs/promises";

const target = new URL("../src/app/components/MagazinePageLayouts.tsx", import.meta.url);
let source = await readFile(target, "utf8");

const importLine = 'import { PhEducationScrollLayout } from "./PhEducationScrollLayout";';
const delegationMarker = '  const isPhEducationScrollPage = new Set([';
let changed = false;

if (!source.includes(importLine)) {
  const importAnchor = 'import ReactMarkdown from "react-markdown";';
  if (!source.includes(importAnchor)) {
    throw new Error("Unable to register PH education layout: import anchor was not found.");
  }
  source = source.replace(importAnchor, `${importAnchor}\n${importLine}`);
  changed = true;
}

if (!source.includes(delegationMarker)) {
  const articleAnchor = `  const data = contentMap[page.id] || { blocks: [] };\n  const items = propBlocks || data.blocks || [];`;
  if (!source.includes(articleAnchor)) {
    throw new Error("Unable to register PH education layout: ArticleTextLayout anchor was not found.");
  }

  const delegation = `  const data = contentMap[page.id] || { blocks: [] };\n  const items = propBlocks || data.blocks || [];\n  const isPhEducationScrollPage = new Set([\n    "what-is-ph-left",\n    "what-is-ph-right",\n    "more-on-ph-left",\n    "more-on-ph-right",\n    "meds-left",\n    "meds-right",\n  ]).has(page.id);\n\n  if (isPhEducationScrollPage) {\n    return <PhEducationScrollLayout page={page} blocks={items} />;\n  }`;

  source = source.replace(articleAnchor, delegation);
  changed = true;
}

if (changed) {
  await writeFile(target, source, "utf8");
  console.log("Registered scrollable PH education card layout.");
} else {
  console.log("Scrollable PH education layout already registered.");
}
