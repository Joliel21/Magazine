import ReactMarkdown from "react-markdown";
import { MagazinePage } from "@/app/data/magazine-data";

type PhContentBlock = {
  type: string;
  content?: string;
};

type PhEducationScrollLayoutProps = {
  page: MagazinePage;
  blocks?: PhContentBlock[];
};

type PhEducationSection = {
  title: string;
  body: string;
};

const PH_EDUCATION_PAGE_META: Record<
  string,
  { eyebrow: string; deck: string; sectionLabel: string }
> = {
  "what-is-ph-left": {
    eyebrow: "PH & Meds",
    deck: "Start with the basics: what pulmonary hypertension is, how it affects the heart and lungs, and why symptoms can be easy to miss.",
    sectionLabel: "Understanding PH",
  },
  "what-is-ph-right": {
    eyebrow: "PH & Meds",
    deck: "Diagnosis is built from symptoms, testing, and direct pressure measurements that help identify the type of pulmonary hypertension.",
    sectionLabel: "Diagnosis",
  },
  "more-on-ph-left": {
    eyebrow: "PH & Meds",
    deck: "Pulmonary hypertension is organized into five clinical groups based mainly on its cause or associated condition.",
    sectionLabel: "Clinical groups",
  },
  "more-on-ph-right": {
    eyebrow: "PH & Meds",
    deck: "Functional class describes how much PH symptoms limit daily activity. It is different from the five clinical groups.",
    sectionLabel: "Functional class",
  },
  "meds-left": {
    eyebrow: "PH & Meds",
    deck: "PAH treatment can target several biological pathways. The specific combination and route are individualized by the PH care team.",
    sectionLabel: "Treatment pathways",
  },
  "meds-right": {
    eyebrow: "PH & Meds",
    deck: "Medication safety depends on monitoring, communication, and knowing which symptoms or side effects need prompt medical attention.",
    sectionLabel: "Safety & self-advocacy",
  },
};

const parsePhEducationMarkdown = (markdown = "") => {
  const normalized = String(markdown || "").replace(/\r\n/g, "\n").trim();
  const lines = normalized.split("\n");
  let title = "PH & Meds";
  let bodyStart = 0;

  const firstContentLine = lines.findIndex((line) => line.trim().length > 0);
  if (firstContentLine >= 0) {
    const titleMatch = lines[firstContentLine].match(/^#\s+(.+)$/);
    if (titleMatch) {
      title = titleMatch[1].replace(/\*\*/g, "").trim();
      bodyStart = firstContentLine + 1;
    }
  }

  const bodyLines = lines.slice(bodyStart);
  const sections: PhEducationSection[] = [];
  let currentTitle = "Overview";
  let currentLines: string[] = [];

  const flushSection = () => {
    const body = currentLines.join("\n").trim();
    if (!body) return;
    sections.push({ title: currentTitle, body });
    currentLines = [];
  };

  bodyLines.forEach((line) => {
    const headingMatch = line.match(/^##\s+(.+)$/);
    if (headingMatch) {
      flushSection();
      currentTitle = headingMatch[1].replace(/\*\*/g, "").trim();
      return;
    }
    currentLines.push(line);
  });
  flushSection();

  if (sections.length === 0) {
    sections.push({
      title: "Overview",
      body: bodyLines.join("\n").trim(),
    });
  }

  return { title, sections };
};

const phEducationMarkdownComponents = {
  h1: ({ node, ...props }: any) => (
    <h3
      className="mb-2 mt-3 text-[12.5px] font-semibold leading-[1.2] text-[#251a38]"
      {...props}
    />
  ),
  h2: ({ node, ...props }: any) => (
    <h3
      className="mb-2 mt-3 text-[12.5px] font-semibold leading-[1.2] text-[#251a38]"
      {...props}
    />
  ),
  h3: ({ node, ...props }: any) => (
    <h3
      className="mb-2 mt-3 text-[12px] font-semibold leading-[1.2] text-[#251a38]"
      {...props}
    />
  ),
  p: ({ node, ...props }: any) => (
    <p
      className="mb-2.5 text-left text-[10.5px] leading-[1.5] text-[#324653] last:mb-0"
      {...props}
    />
  ),
  ul: ({ node, ...props }: any) => (
    <ul
      className="mb-2.5 list-disc space-y-1 pl-5 text-[10.3px] leading-[1.45] text-[#324653] last:mb-0"
      {...props}
    />
  ),
  ol: ({ node, ...props }: any) => (
    <ol
      className="mb-2.5 list-decimal space-y-1 pl-5 text-[10.3px] leading-[1.45] text-[#324653] last:mb-0"
      {...props}
    />
  ),
  li: ({ node, ...props }: any) => <li {...props} />,
  strong: ({ node, ...props }: any) => (
    <strong className="font-semibold text-[#241735]" {...props} />
  ),
  em: ({ node, ...props }: any) => <em className="italic" {...props} />,
  a: ({ node, ...props }: any) => (
    <a
      className="font-semibold text-[#6747a1] underline underline-offset-2"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  blockquote: ({ node, ...props }: any) => (
    <blockquote
      className="my-3 border-l-[3px] border-[#7553ad] bg-[#f4f0fa] px-3 py-2 text-[10.3px] leading-[1.45] text-[#40515b]"
      {...props}
    />
  ),
};

export const PhEducationScrollLayout = ({
  page,
  blocks = [],
}: PhEducationScrollLayoutProps) => {
  const markdownBlock = blocks.find(
    (block) => block.type === "markdown",
  );
  const { title, sections } = parsePhEducationMarkdown(markdownBlock?.content || "");
  const meta = PH_EDUCATION_PAGE_META[page.id] || {
    eyebrow: "PH & Meds",
    deck: "Pulmonary hypertension education and patient-facing information.",
    sectionLabel: "Learn more",
  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#f8f6fb] text-[#172b3a]">
      <style>{`
        .ph-education-scroll {
          scrollbar-width: thin;
          scrollbar-color: #7553ad #ebe6f2;
          scrollbar-gutter: stable;
        }
        .ph-education-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .ph-education-scroll::-webkit-scrollbar-track {
          background: #ebe6f2;
          border-radius: 999px;
        }
        .ph-education-scroll::-webkit-scrollbar-thumb {
          background: #7553ad;
          border: 2px solid #ebe6f2;
          border-radius: 999px;
        }
        .ph-education-scroll::-webkit-scrollbar-thumb:hover {
          background: #5f428f;
        }
      `}</style>

      <div className="relative shrink-0 overflow-hidden border-b border-[#ddd4ea] bg-white px-[34px] pb-[17px] pt-[24px]">
        <div
          aria-hidden="true"
          className="absolute right-[-64px] top-[-78px] h-[190px] w-[190px] rounded-full border border-[#7653ad]/15"
        />
        <div
          aria-hidden="true"
          className="absolute right-[-24px] top-[-36px] h-[118px] w-[118px] rounded-full bg-[#7250aa]/[0.06]"
        />

        <div className="relative flex items-center justify-between gap-4">
          <p className="text-[8.5px] font-bold uppercase tracking-[0.28em] text-[#7250aa]">
            {meta.eyebrow}
          </p>
          <span className="rounded-full border border-[#d9d0e7] bg-[#f7f4fb] px-2.5 py-1 text-[7.5px] font-semibold uppercase tracking-[0.14em] text-[#6c5a7d]">
            Scroll to explore
          </span>
        </div>

        <h1
          className="relative mt-2 max-w-[380px] font-normal tracking-[-0.025em] text-[#1d2932]"
          style={{
            fontFamily: "var(--font-serif-primary)",
            fontSize: title.length > 40 ? "22px" : "27px",
            lineHeight: 1.04,
          }}
        >
          {title}
        </h1>
        <p className="relative mt-2 max-w-[390px] text-[9.7px] leading-[1.38] text-[#61707a]">
          {meta.deck}
        </p>
      </div>

      <div
        className="ph-education-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-[22px] py-[18px]"
        onWheel={(event) => event.stopPropagation()}
        onTouchMove={(event) => event.stopPropagation()}
        tabIndex={0}
        role="region"
        aria-label={`${title} scrollable information`}
      >
        <div className="mb-3 flex items-center gap-3 px-1">
          <div className="h-px flex-1 bg-[#ddd4ea]" />
          <span className="text-[7.5px] font-bold uppercase tracking-[0.2em] text-[#7250aa]">
            {meta.sectionLabel}
          </span>
          <div className="h-px flex-1 bg-[#ddd4ea]" />
        </div>

        <div className="space-y-3 pb-6">
          {sections.map((section, index) => (
            <section
              key={`${page.id}-${section.title}-${index}`}
              className="overflow-hidden rounded-[13px] border border-[#ded7ea] bg-white shadow-[0_3px_12px_rgba(44,32,67,0.06)]"
            >
              <div className="flex items-start gap-3 border-b border-[#eee8f4] bg-[linear-gradient(90deg,#faf8fd_0%,#ffffff_100%)] px-4 py-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#7250aa] text-[8px] font-bold text-white">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h2
                  className="pt-[2px] text-[13px] font-semibold leading-[1.2] text-[#241735]"
                  style={{ fontFamily: "var(--font-serif-primary)" }}
                >
                  {section.title}
                </h2>
              </div>
              <div className="px-4 py-3.5">
                <ReactMarkdown components={phEducationMarkdownComponents}>
                  {section.body}
                </ReactMarkdown>
              </div>
            </section>
          ))}
        </div>
      </div>

      <div className="shrink-0 border-t border-[#ded7ea] bg-white/95 px-[30px] py-2.5">
        <p className="text-center text-[7.6px] leading-[1.35] text-[#7a6d82]">
          Educational information only. Treatment and medication decisions should be made with a qualified clinician, preferably a pulmonary hypertension specialist.
        </p>
      </div>
    </div>
  );
};
