import { readFile, writeFile } from "node:fs/promises";

const target = new URL("../src/app/components/MagazinePageLayouts.tsx", import.meta.url);
let source = await readFile(target, "utf8");

const marker = 'const phEducationPageIds = new Set([';
if (source.includes(marker)) {
  console.log("PH education layout already applied.");
  process.exit(0);
}

function replaceRequired(label, search, replacement) {
  if (!source.includes(search)) {
    throw new Error(`Unable to apply ${label}: expected source block was not found.`);
  }
  source = source.replace(search, replacement);
}

replaceRequired(
  "PH page classification",
  `  const isChapterDescriptionPage =\n    page.id.startsWith("chapter-") &&\n    page.id.endsWith("-description");\n  const isStoryTextPage =`,
  `  const isChapterDescriptionPage =\n    page.id.startsWith("chapter-") &&\n    page.id.endsWith("-description");\n  const phEducationPageIds = new Set([\n    "what-is-ph-left",\n    "what-is-ph-right",\n    "more-on-ph-left",\n    "more-on-ph-right",\n    "meds-left",\n    "meds-right",\n  ]);\n  const isPhEducationPage = phEducationPageIds.has(page.id);\n  const isPhEducationDensePage = new Set([\n    "more-on-ph-left",\n    "more-on-ph-right",\n    "meds-left",\n    "meds-right",\n  ]).has(page.id);\n  const isStoryTextPage =`,
);

replaceRequired(
  "PH page padding",
  `  const articleStoryPaddingX = "58px";\n  const articleStoryPaddingTop = "64px";\n  const articleStoryPaddingBottom = "78px";`,
  `  const articleStoryPaddingX = isPhEducationPage ? "44px" : "58px";\n  const articleStoryPaddingTop = isPhEducationPage ? "36px" : "64px";\n  const articleStoryPaddingBottom = isPhEducationPage ? "34px" : "78px";`,
);

const storyStart = source.indexOf("  const storyComponents = {");
const storyEnd = source.indexOf("  if (isGeneratedTitlePage && markdownBlock) {", storyStart);
if (storyStart === -1 || storyEnd === -1 || storyEnd <= storyStart) {
  throw new Error("Unable to apply PH typography: story component block was not found.");
}

const storyComponents = `  const storyComponents = {
    h1: ({ node, ...props }: any) => (
      <h1
        className={\`text-left font-normal leading-tight \${
          isMissionStatementPage
            ? "mb-4"
            : isPhEducationPage
              ? "mb-3"
              : "mb-8"
        }\`}
        style={
          isWelcomePage
            ? { display: "none" }
            : isMissionStatementPage
              ? {
                  fontFamily: "var(--font-serif-primary)",
                  fontSize: "20pt",
                  lineHeight: 1.08,
                  color: "#021A2B",
                }
              : isHowToUsePage
                ? {
                    fontFamily: "var(--font-serif-primary)",
                    fontSize: "34pt",
                    lineHeight: 1.05,
                    color: "#021A2B",
                  }
                : isPhEducationPage
                  ? {
                      fontFamily: "var(--font-serif-primary)",
                      fontSize: isPhEducationDensePage ? "20pt" : "22pt",
                      lineHeight: 1.02,
                      color: "#021A2B",
                    }
                  : {
                      fontFamily: "var(--font-serif-primary)",
                      fontSize: "34pt",
                      lineHeight: 1.05,
                      color: "#021A2B",
                    }
        }
        {...props}
      />
    ),
    h2: ({ node, ...props }: any) => (
      <h2
        className={
          isPhEducationPage
            ? "mt-3 mb-1 text-left font-serif-primary font-normal text-[#021A2B]"
            : "mt-6 mb-3 text-left font-serif-primary text-[18px] leading-tight font-normal text-[#021A2B]"
        }
        style={
          isPhEducationPage
            ? {
                fontSize: isPhEducationDensePage ? "10.5pt" : "11.5pt",
                lineHeight: 1.12,
                fontWeight: 600,
              }
            : undefined
        }
        {...props}
      />
    ),
    h3: ({ node, ...props }: any) => (
      <h3
        className={
          isPhEducationPage
            ? "mt-2 mb-1 text-left font-serif-primary font-normal text-[#021A2B]"
            : "mt-5 mb-3 text-left font-serif-primary text-[16px] leading-tight font-normal text-[#021A2B]"
        }
        style={isPhEducationPage ? { fontSize: "10pt", lineHeight: 1.12, fontWeight: 600 } : undefined}
        {...props}
      />
    ),
    h4: ({ node, ...props }: any) => (
      <h4
        className={isPhEducationPage ? "mt-2 mb-1 text-left font-serif-primary text-[#021A2B]" : "mt-5 mb-2 text-left font-serif-primary text-[15px] leading-tight font-normal text-[#021A2B]"}
        style={isPhEducationPage ? { fontSize: "9.5pt", lineHeight: 1.12, fontWeight: 600 } : undefined}
        {...props}
      />
    ),
    h5: ({ node, ...props }: any) => (
      <h5
        className={isPhEducationPage ? "mt-2 mb-1 text-left font-serif-primary text-[#021A2B]" : "mt-4 mb-2 text-left font-serif-primary text-[14px] leading-tight font-normal text-[#021A2B]"}
        style={isPhEducationPage ? { fontSize: "9pt", lineHeight: 1.12, fontWeight: 600 } : undefined}
        {...props}
      />
    ),
    h6: ({ node, ...props }: any) => (
      <h6
        className={isPhEducationPage ? "mt-2 mb-1 text-left font-serif-primary text-[#021A2B]" : "mt-4 mb-2 text-left font-serif-primary text-[13px] leading-tight font-normal text-[#021A2B]"}
        style={isPhEducationPage ? { fontSize: "8.75pt", lineHeight: 1.12, fontWeight: 600 } : undefined}
        {...props}
      />
    ),
    strong: ({ node, ...props }: any) => (
      <span className="font-normal" {...props} />
    ),
    b: ({ node, ...props }: any) => (
      <span className="font-normal" {...props} />
    ),
    p: ({ node, ...props }: any) => (
      <p
        className={isPhEducationPage ? "type-body mb-2 text-left" : "type-body mb-3 text-justify"}
        style={
          isPhEducationPage
            ? {
                fontSize: isPhEducationDensePage ? "7.8pt" : "8.2pt",
                lineHeight: isPhEducationDensePage ? 1.24 : 1.28,
              }
            : isStoryTextPage
              ? {
                  lineHeight: 1.42,
                }
              : undefined
        }
        {...props}
      />
    ),
    a: ({ node, ...props }: any) => (
      <a
        className="text-forest underline font-sans-accent"
        {...props}
      />
    ),
    ul: ({ node, ...props }: any) => (
      <ul
        className={isPhEducationPage ? "list-disc pl-4 mb-2 type-body" : "list-disc pl-6 mb-5 type-body"}
        style={isPhEducationPage ? { fontSize: isPhEducationDensePage ? "7.7pt" : "8.1pt", lineHeight: 1.22 } : undefined}
        {...props}
      />
    ),
    ol: ({ node, ...props }: any) => (
      <ol
        className={isPhEducationPage ? "list-decimal pl-4 mb-2 type-body" : "list-decimal pl-6 mb-5 type-body"}
        style={isPhEducationPage ? { fontSize: isPhEducationDensePage ? "7.7pt" : "8.1pt", lineHeight: 1.22 } : undefined}
        {...props}
      />
    ),
    li: ({ node, ...props }: any) => (
      <li className={isPhEducationPage ? "mb-[2px]" : "mb-2"} {...props} />
    ),
    blockquote: ({ node, ...props }: any) => (
      <blockquote
        className="pl-6 italic my-6 type-body text-charcoal/80"
        {...props}
      />
    ),
    hr: () => <span className="block h-6"></span>,
    img: ({ node, ...props }: any) => (
      <img
        className="w-full h-auto max-h-[300px] object-cover my-6"
        {...props}
      />
    ),
  };

`;

source = source.slice(0, storyStart) + storyComponents + source.slice(storyEnd);
await writeFile(target, source, "utf8");
console.log("Applied compact PH education page layout.");
