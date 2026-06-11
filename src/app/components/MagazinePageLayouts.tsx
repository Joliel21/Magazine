import { MagazinePage } from "@/app/data/magazine-data";
import { useDrag, useDrop } from "react-dnd";
import {
  useRef,
  useState,
  useEffect,
  useCallback,
  useLayoutEffect,
  type CSSProperties,
} from "react";
import { CollageBlock } from "./CollageBlock";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Resizable } from "re-resizable";
import Draggable from "react-draggable";
import ReactMarkdown from "react-markdown";
import brandLogo from "figma:asset/3ff991e8f0e8f3d097e1984cdf3d44207e2af8d9.png";

const GrainOverlay = () => (
  <div
    className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-multiply z-0"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
    }}
  ></div>
);

interface DraggableBlockProps {
  id: string;
  index: number;
  moveBlock: (
    index: number,
    pos: { x: number; y: number },
  ) => void;
  resizeBlock: (
    index: number,
    size: { width: string; height: string },
    pos?: { x: number; y: number },
  ) => void;
  onInteractionStart?: () => void;
  width?: string;
  height?: string;
  x?: number;
  y?: number;
  isEditable?: boolean;
  children: React.ReactNode;
}

const DraggableBlock = ({
  id,
  index,
  moveBlock,
  resizeBlock,
  onInteractionStart,
  width,
  height,
  x,
  y,
  isEditable,
  children,
}: DraggableBlockProps) => {
  const nodeRef = useRef<HTMLDivElement>(null);

  const handleCommonClass =
    "bg-blue-500 w-4 h-4 rounded-full shadow-md border-2 border-white z-[60] opacity-60 hover:opacity-100 transition-opacity absolute";
  const handleClasses = {
    top: "hidden",
    right: "hidden",
    bottom: "hidden",
    left: "hidden",
    topRight: isEditable
      ? `${handleCommonClass} right-0 top-0 translate-x-1/2 -translate-y-1/2`
      : "hidden",
    bottomRight: isEditable
      ? `${handleCommonClass} right-0 bottom-0 translate-x-1/2 translate-y-1/2`
      : "hidden",
    bottomLeft: isEditable
      ? `${handleCommonClass} left-0 bottom-0 -translate-x-1/2 translate-y-1/2`
      : "hidden",
    topLeft: isEditable
      ? `${handleCommonClass} left-0 top-0 -translate-x-1/2 -translate-y-1/2`
      : "hidden",
  };

  const enableConfig = isEditable
    ? {
        top: false,
        right: true,
        bottom: true,
        left: false,
        topRight: true,
        bottomRight: true,
        bottomLeft: true,
        topLeft: true,
      }
    : false;

  // If no position is provided (initial render or flow mode), render relatively
  if (x === undefined || y === undefined) {
    return (
      <div
        ref={nodeRef}
        className={`relative ${isEditable ? "hover:ring-2 hover:ring-blue-400" : ""}`}
        style={{ width: width || "100%" }}
        onMouseDownCapture={(e) => {
          if (isEditable && onInteractionStart) {
            onInteractionStart();
          }
        }}
      >
        <Resizable
          size={{
            width: width || "100%",
            height: height || "auto",
          }}
          onResizeStop={(e, direction, ref, d) => {
            if (onInteractionStart) onInteractionStart();
            resizeBlock(index, {
              width: ref.style.width,
              height: ref.style.height,
            });
          }}
          enable={enableConfig}
          handleClasses={handleClasses}
        >
          {children}
        </Resizable>
      </div>
    );
  }

  // Absolute positioning mode
  return (
    <Draggable
      nodeRef={nodeRef}
      position={{ x, y }}
      onStop={(e, data) =>
        moveBlock(index, { x: data.x, y: data.y })
      }
      disabled={!isEditable}
    >
      <div
        ref={nodeRef}
        className={`absolute ${isEditable ? "cursor-move hover:ring-2 hover:ring-blue-400 hover:ring-offset-2 z-50" : "z-10"}`}
        style={{ width: width || "100%" }}
      >
        {isEditable && (
          <div className="absolute -top-3 right-0 p-1 opacity-0 group-hover:opacity-100 bg-blue-500 text-white text-[10px] rounded px-2 z-[60] pointer-events-none">
            Drag
          </div>
        )}

        <Resizable
          size={{
            width: width || "100%",
            height: height || "auto",
          }}
          onResizeStop={(e, direction, ref, d) => {
            const newPos = { x, y };
            if (direction.includes("Left")) {
              newPos.x -= d.width;
            }
            if (direction.includes("Top")) {
              newPos.y -= d.height;
            }
            resizeBlock(
              index,
              {
                width: ref.style.width,
                height: ref.style.height,
              },
              newPos,
            );
          }}
          enable={enableConfig}
          handleClasses={handleClasses}
        >
          {children}
        </Resizable>
      </div>
    </Draggable>
  );
};

export interface PageLayoutProps {
  page: MagazinePage;
  onNavigate?: (pageNumber: number | "back-cover") => void;
  isEditable?: boolean;
  blocks?: ContentBlock[];
  onUpdateBlocks?: (blocks: ContentBlock[]) => void;
}

const MarginGuides = ({
  isRightPage,
}: {
  isRightPage: boolean;
}) => (
  <div className="absolute inset-0 pointer-events-none z-50">
    {/* Margins: Top 60px, Bottom 40px */}
    <div className="absolute left-0 right-0 top-[60px] border-b border-blue-600 opacity-20 border-dashed"></div>
    <div className="absolute left-0 right-0 bottom-[40px] border-t border-blue-600 opacity-20 border-dashed"></div>

    {/* Side Margins depends on Left/Right Page 
        Right Page (Odd): Left 56px (Inner/Gutter), Right 48px (Outer)
        Left Page (Even): Left 48px (Outer), Right 56px (Inner/Gutter)
    */}
    <div
      className={`absolute top-0 bottom-0 border-r border-red-600 opacity-20 border-dashed ${isRightPage ? "left-[56px]" : "left-[48px]"}`}
    ></div>
    <div
      className={`absolute top-0 bottom-0 border-l border-red-600 opacity-20 border-dashed ${isRightPage ? "right-[48px]" : "right-[56px]"}`}
    ></div>

    {/* Safe Area Content Box */}
    <div
      className="absolute border border-green-600 opacity-10 border-dashed"
      style={{
        top: "60px",
        bottom: "40px",
        left: isRightPage ? "56px" : "48px",
        right: isRightPage ? "48px" : "56px",
      }}
    ></div>
  </div>
);

// --- MASTER COMPONENT STRUCTURE ---

// Theme Helper
export type PageTheme = "light" | "dark" | "olive";

export const getPageTheme = (pageNumber: number): PageTheme => {
  return "light";
};

const PageMasterBase = ({
  children,
  pageNumber,
  className = "bg-ivory",
  dark = false,
  showGuides = false,
}: {
  children: React.ReactNode;
  pageNumber: number;
  className?: string;
  dark?: boolean;
  showGuides?: boolean;
}) => {
  // Determine if Right (Odd) or Left (Even) Page
  // Note: Usually Page 1 is Right.
  const isRightPage = pageNumber % 2 !== 0;

  // Margins per spec
  // Top: 60px
  // Bottom: 40px
  // Inner (Gutter): 56px
  // Outer: 48px

  const paddingLeft = isRightPage ? "56px" : "48px";
  const paddingRight = isRightPage ? "48px" : "56px";
  const paddingTop = "60px";
  const paddingBottom = "40px";

  return (
    <div
      className={`h-[660px] w-[480px] ${className} flex flex-col relative overflow-hidden`}
      style={{
        paddingTop,
        paddingBottom,
        paddingLeft,
        paddingRight,
      }}
    >
      {showGuides && <MarginGuides isRightPage={isRightPage} />}
      {/* 
         Content Wrapper to enforce safe area width.
         Safe Width = 480 - 56 - 48 = 376px.
      */}
      <div className="flex-1 flex flex-col w-full h-full relative">
        {children}
      </div>
    </div>
  );
};

export const InsideCoverLayout = ({
  page,
}: PageLayoutProps) => (
  <div className="h-[660px] w-[480px] relative overflow-hidden bg-[#F6F5F2] text-charcoal">
    {/* FOLD SHADOW - Spine Side (Right Edge) */}
    <div
      className="absolute top-0 bottom-0 right-0 w-[36px] z-30 pointer-events-none"
      style={{
        background:
          "linear-gradient(to left, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.03) 60%, transparent 100%)",
        mixBlendMode: "multiply",
        opacity: 1,
      }}
    />

    {/* SPINE LINE - Right Edge */}
    <div className="absolute top-0 bottom-0 right-0 w-[1px] bg-black/10 z-40 pointer-events-none" />

    <div className="absolute inset-0 px-[42px] z-10">
      {/* Main content sits higher on the page. Copyright remains fixed at the bottom. */}
      <div className="pt-[72px]">
        <h1 className="font-serif-primary text-[19px] leading-tight font-bold mb-4 text-[#021A2B]">
          Editorial Notice, Disclaimer, and Copyright
        </h1>

        <div className="space-y-2 text-[9.5px] leading-[1.35] text-[#2D2D2D]">
          <p>
            The content contained in this publication reflects
            personal experiences, opinions, advocacy
            perspectives, interviews, educational commentary,
            and editorial content. The views expressed by
            individual authors are their own and do not
            necessarily represent the views of any organization,
            healthcare provider, employer, publication, or
            advocacy group.
          </p>

          <p>
            This magazine is intended for informational,
            educational, and awareness purposes only. Nothing
            contained within this publication should be
            interpreted as medical, legal, financial, or other
            professional advice. Readers should always consult
            qualified healthcare professionals regarding medical
            decisions, diagnoses, treatments, medications, or
            changes to their healthcare plans.
          </p>

          <p>
            While every effort has been made to provide accurate
            and current information, medical knowledge,
            treatments, recommendations, and regulations may
            change over time. No guarantees are made regarding
            the completeness, accuracy, reliability, or
            applicability of the information presented.
          </p>

          <p>
            Patient stories and personal experiences are unique
            to each individual. Outcomes, symptoms, treatments,
            and responses to care vary from person to person. A
            personal experience shared in this publication
            should not be interpreted as a prediction of another
            person’s experience or outcome.
          </p>

          <p>
            All original content, articles, editorials, designs,
            graphics, and materials published by Breathtaking
            Awareness remain the intellectual property of their
            respective authors and rights holders unless
            otherwise noted. No portion of this publication may
            be reproduced, distributed, republished, modified,
            or used commercially without prior written
            permission from the copyright holder.
          </p>
        </div>

        <div className="mt-5 pt-4 border-t border-[#AF9355]/45">
          <h2 className="font-serif-primary text-[14px] font-bold mb-2 text-[#021A2B]">
            Publication Information
          </h2>

          <div className="text-[9.5px] leading-[1.45] text-[#2D2D2D]">
            <p>
              <strong>Publication:</strong> Breathtaking
              Awareness Magazine
            </p>
            <p>
              <strong>Publisher:</strong> Breathtaking Awareness
            </p>
            <p>
              <strong>Founder and Editor:</strong> Jolie Lizana
            </p>
            <p>
              <strong>Website:</strong>{" "}
              https://www.BreathtakingAwareness.com
            </p>
            <p>
              <strong>Email:</strong>{" "}
              Jolie@BreathtakingAwareness.com
            </p>
          </div>
        </div>
      </div>

      <p className="absolute left-[42px] right-[42px] bottom-[28px] text-center text-[9px] leading-tight text-[#2D2D2D]">
        © Breathtaking Awareness. All rights reserved.
      </p>
    </div>
  </div>
);

export const Page1Layout = ({
  page,
  title = "Untitled",
  subtitle = "",
  summary = "",
  byline = "",
}: PageLayoutProps & {
  title?: string;
  subtitle?: string;
  summary?: string;
  byline?: string;
}) => {
  // Page 1 is always Right Page (Odd)
  const isRightPage = true;

  return (
    <div className="h-[660px] w-[480px] relative overflow-hidden bg-ivory text-charcoal select-none">
      {/* Grain Overlay */}
      <GrainOverlay />

      {/* Spine Shadow (Left Side for Right Page) */}
      <div
        className="absolute top-0 bottom-0 left-0 w-[36px] z-20 pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.03) 60%, transparent 100%)",
          mixBlendMode: "multiply",
          opacity: 1,
        }}
      />
      {/* SPINE LINE - Left Edge */}
      <div className="absolute top-0 bottom-0 left-0 w-[1px] bg-black/10 z-30 pointer-events-none" />

      {/* Content Container - Centered in Safe Area
                Safe Area: Top 60, Bottom 40, Left 56 (Inner), Right 48 (Outer).
            */}
      <div
        className="absolute flex flex-col justify-center items-center text-center z-10"
        style={{
          top: "60px",
          bottom: "40px",
          left: "56px",
          right: "48px",
        }}
      >
        <h1 className="type-major-opener text-charcoal w-full mb-[20px]">
          {title}
        </h1>

        <h2
          className="type-subhead text-charcoal font-sans-accent font-normal w-full mb-[18px]"
          style={{
            fontFamily:
              "Inter, Avenir Next, Helvetica Neue, Arial, sans-serif",
            fontWeight: 300,
          }}
        >
          {subtitle}
        </h2>

        <div className="w-full flex justify-center mb-[28px]">
          <p className="type-minor-head italic text-forest max-w-[340px]">
            {summary}
          </p>
        </div>

        <p className="type-kicker text-forest">{byline}</p>
      </div>
    </div>
  );
};

export const GenericPageLayout = ({
  page,
}: PageLayoutProps) => (
  <div className="h-[660px] w-[480px] bg-ivory relative overflow-hidden">
    <GrainOverlay />
  </div>
);

export type ContentBlock =
  | {
      type: "paragraph";
      content: React.ReactNode;
      className?: string;
      width?: string;
      height?: string;
      x?: number;
      y?: number;
      _id?: string;
      dropCap?: boolean;
    }
  | {
      type: "kicker";
      content: string;
      className?: string;
      width?: string;
      height?: string;
      x?: number;
      y?: number;
      _id?: string;
    }
  | {
      type: "byline";
      content: string;
      className?: string;
      width?: string;
      height?: string;
      x?: number;
      y?: number;
      _id?: string;
    }
  | {
      type: "subheading";
      content: string;
      className?: string;
      width?: string;
      height?: string;
      x?: number;
      y?: number;
      _id?: string;
    }
  | {
      type: "list";
      content: React.ReactNode[];
      className?: string;
      width?: string;
      height?: string;
      x?: number;
      y?: number;
      _id?: string;
    }
  | {
      type: "signoff";
      content: React.ReactNode;
      width?: string;
      height?: string;
      x?: number;
      y?: number;
      _id?: string;
    }
  | {
      type: "link-button";
      text: string;
      href: string;
      width?: string;
      height?: string;
      x?: number;
      y?: number;
      _id?: string;
    }
  | {
      type: "references";
      content: string[];
      width?: string;
      height?: string;
      x?: number;
      y?: number;
      _id?: string;
    }
  | {
      type: "pull-quote";
      content: string;
      style?: "standard" | "oversized-marks";
      width?: string;
      height?: string;
      x?: number;
      y?: number;
      _id?: string;
    }
  | {
      type: "qa";
      question: string;
      answer: string;
      width?: string;
      height?: string;
      x?: number;
      y?: number;
      _id?: string;
    }
  | {
      type: "image";
      src: string;
      alt: string;
      className?: string;
      credit?: string;
      fullPage?: boolean;
      width?: string;
      height?: string;
      x?: number;
      y?: number;
      _id?: string;
    }
  | {
      type: "image-collage";
      images: {
        src: string;
        alt: string;
        className: string;
        credit?: string;
      }[];
      containerClassName?: string;
      width?: string;
      height?: string;
      x?: number;
      y?: number;
      _id?: string;
    }
  | {
      type: "collage-block";
      items: {
        src: string;
        alt: string;
        title?: string;
        subtitle?: string;
      }[];
      width?: string;
      height?: string;
      x?: number;
      y?: number;
      _id?: string;
    }
  | {
      type: "fact-box";
      title?: string;
      content: string;
      className?: string;
      width?: string;
      height?: string;
      x?: number;
      y?: number;
      _id?: string;
    }
  | {
      type: "toc-section";
      title: string;
      className?: string;
      width?: string;
      height?: string;
      x?: number;
      y?: number;
      _id?: string;
    }
  | {
      type: "toc-entry";
      title: string;
      pageNumber: string;
      showDivider?: boolean;
      className?: string;
      width?: string;
      height?: string;
      x?: number;
      y?: number;
      _id?: string;
    }
  | {
      type: "team-grid";
      members: {
        name: string;
        title: string;
        imageUrl: string;
      }[];
      width?: string;
      height?: string;
      x?: number;
      y?: number;
      _id?: string;
    }
  | {
      type: "markdown";
      content: string;
      width?: string;
      height?: string;
      x?: number;
      y?: number;
      _id?: string;
    }
  | {
      type: "chapter-divider";
      title: string;
      subtitle?: string;
      eyebrow?: string;
      width?: string;
      height?: string;
      x?: number;
      y?: number;
      _id?: string;
    }
  | {
      type: "share";
      articleId: string;
      articleTitle: string;
      articleUrl?: string;
      width?: string;
      height?: string;
      x?: number;
      y?: number;
      _id?: string;
    };

export const contentMap: Record<
  string,
  {
    title?: string;
    byline?: string;
    backgroundColor?: string;
    backgroundImage?: string;
    blocks: ContentBlock[];
  }
> = {};

export const SectionDividerLayout = ({
  page,
}: PageLayoutProps) => {
  const data = contentMap[page.id] || { title: "", blocks: [] };
  const title = data.title || "";
  const bodyBlock = data.blocks?.find(
    (b) => b.type === "paragraph",
  );
  const bodyText =
    bodyBlock && typeof bodyBlock.content === "string"
      ? bodyBlock.content
      : "";

  const isRightPage = page.pageNumber % 2 !== 0;
  const paddingLeft = isRightPage ? "56px" : "48px";
  const paddingRight = isRightPage ? "48px" : "56px";
  const paddingTop = "60px";
  const paddingBottom = "40px";

  return (
    <div
      className="h-[660px] w-[480px] bg-ivory flex flex-col justify-center items-center text-center relative overflow-hidden"
      style={{
        paddingLeft,
        paddingRight,
        paddingTop,
        paddingBottom,
      }}
    >
      <div className="flex flex-col items-center w-full">
        <h1
          className="type-prestige-opener mb-8"
          style={{ color: "#021A2B" }}
        >
          {title}
        </h1>
        {bodyText && (
          <p className="type-body text-charcoal opacity-80 max-w-[65%] mx-auto">
            {bodyText}
          </p>
        )}
      </div>
    </div>
  );
};

export const ChristinaFeatureLayout = ({
  page,
  onNavigate,
  isEditable,
  blocks: propBlocks,
  onUpdateBlocks,
}: PageLayoutProps) => {
  const data = contentMap[page.id] || { title: "", blocks: [] };

  const [localItems, setLocalItems] = useState(() => {
    const blocks =
      data && data.blocks
        ? data.blocks.filter(
            (b) => !(b.type === "image" && b.fullPage),
          )
        : [];
    return blocks.map((b, i) => ({
      ...b,
      _id:
        b._id ||
        `block-${page.id}-${i}-${Math.random().toString(36).substr(2, 9)}`,
    }));
  });

  const items = propBlocks || localItems;
  const containerRef = useRef<HTMLDivElement>(null);

  const convertLayout = useCallback(() => {
    if (!containerRef.current) return;
    const unpositionedIndices = items
      .map((b, i) => ({ b, i }))
      .filter(({ b }) => b.x === undefined || b.y === undefined)
      .map(({ i }) => i);

    if (unpositionedIndices.length === 0) return;

    const containerRect =
      containerRef.current.getBoundingClientRect();
    const children = Array.from(containerRef.current.children);

    const updates: {
      index: number;
      x: number;
      y: number;
      width: string;
      height: string;
    }[] = [];

    unpositionedIndices.forEach((index) => {
      const child = children[index] as HTMLElement;
      if (!child) return;

      const rect = child.getBoundingClientRect();

      const x = Math.round(rect.left - containerRect.left);
      const y = Math.round(rect.top - containerRect.top);

      const width = child.style.width || `${rect.width}px`;
      const height = child.style.height || `${rect.height}px`;

      updates.push({ index, x, y, width, height });
    });

    if (updates.length > 0) {
      if (onUpdateBlocks && propBlocks) {
        const newItems = [...propBlocks];
        updates.forEach((u) => {
          newItems[u.index] = {
            ...newItems[u.index],
            x: u.x,
            y: u.y,
            width: newItems[u.index].width || u.width,
          };
        });
        onUpdateBlocks(newItems);
      } else {
        setLocalItems((prev: any) => {
          const newItems = [...prev];
          updates.forEach((u) => {
            newItems[u.index] = {
              ...newItems[u.index],
              x: u.x,
              y: u.y,
              width: newItems[u.index].width || u.width,
            };
          });
          return newItems;
        });
      }
    }
  }, [items, onUpdateBlocks, propBlocks]);

  const moveBlock = useCallback(
    (index: number, pos: { x: number; y: number }) => {
      if (onUpdateBlocks && propBlocks) {
        const newItems = [...propBlocks];
        newItems[index] = { ...newItems[index], ...pos };
        onUpdateBlocks(newItems);
      } else {
        setLocalItems((prevItems: any) => {
          const newItems = [...prevItems];
          newItems[index] = { ...newItems[index], ...pos };
          return newItems;
        });
      }
    },
    [onUpdateBlocks, propBlocks],
  );

  const resizeBlock = useCallback(
    (
      index: number,
      size: { width: string; height: string },
      pos?: { x: number; y: number },
    ) => {
      if (onUpdateBlocks && propBlocks) {
        const newItems = [...propBlocks];
        newItems[index] = {
          ...newItems[index],
          ...size,
          ...(pos || {}),
        };
        onUpdateBlocks(newItems);
      } else {
        setLocalItems((prevItems: any) => {
          const newItems = [...prevItems];
          newItems[index] = {
            ...newItems[index],
            ...size,
            ...(pos || {}),
          };
          return newItems;
        });
      }
    },
    [onUpdateBlocks, propBlocks],
  );

  if (!data) {
    return (
      <div className="h-[660px] w-[480px] bg-ivory px-16 pt-10 pb-16 flex flex-col relative overflow-hidden"></div>
    );
  }

  // Inside Cover (Page 0)
  if (page.pageNumber === 0) {
    return (
      <div className="h-[660px] w-[480px] bg-[#F5F2EA] relative flex flex-col items-center justify-center">
        {/* Shadow for spine */}
        <div
          className="absolute top-0 bottom-0 right-0 w-[6px] z-30 pointer-events-none"
          style={{
            background:
              "linear-gradient(to left, rgba(0,0,0,0.08), transparent)",
            mixBlendMode: "multiply",
          }}
        />
      </div>
    );
  }

  return (
    <div className="h-[660px] w-[480px] bg-ivory relative overflow-hidden flex flex-col">
      <GrainOverlay />
      {/* Spine Shadow based on page side */}
      <div
        className="absolute top-0 bottom-0 w-[6px] z-30 pointer-events-none"
        style={{
          left: page.pageNumber % 2 !== 0 ? 0 : "auto",
          right: page.pageNumber % 2 === 0 ? 0 : "auto",
          background:
            page.pageNumber % 2 !== 0
              ? "linear-gradient(to right, rgba(0,0,0,0.08), transparent)"
              : "linear-gradient(to left, rgba(0,0,0,0.08), transparent)",
          mixBlendMode: "multiply",
        }}
      />

      <div ref={containerRef} className="absolute inset-0">
        {items.map((block, index) => (
          <DraggableBlock
            key={block._id || index}
            id={block._id || `${index}`}
            index={index}
            moveBlock={moveBlock}
            resizeBlock={resizeBlock}
            width={block.width}
            height={block.height}
            x={block.x}
            y={block.y}
            isEditable={isEditable}
          >
            {/* Content Rendering based on Type */}
            {block.type === "paragraph" && (
              <div
                className={`type-body text-charcoal ${block.className || ""}`}
              >
                {block.dropCap &&
                typeof block.content === "string" ? (
                  <>
                    <span className="float-left type-prestige-opener leading-[0.8] mr-2 mt-[-2px] font-serif-primary">
                      {block.content[0]}
                    </span>
                    {block.content.substring(1)}
                  </>
                ) : (
                  block.content
                )}
              </div>
            )}
            {block.type === "kicker" && (
              <div
                className={`type-kicker text-charcoal border-b border-charcoal/20 pb-1 mb-4 inline-block ${block.className || ""}`}
              >
                {block.content}
              </div>
            )}
            {block.type === "subheading" && (
              <h3
                className={`type-subhead text-charcoal mb-2 ${block.className || ""}`}
              >
                {block.content}
              </h3>
            )}
            {block.type === "image" && (
              <div className="w-full h-full relative group overflow-hidden">
                <ImageWithFallback
                  src={block.src}
                  alt={block.alt}
                  className={`w-full h-full object-cover ${block.className || ""}`}
                />
                {block.credit && (
                  <div className="absolute bottom-0 right-0 bg-white/80 px-1 type-caption text-charcoal/60">
                    {block.credit}
                  </div>
                )}
              </div>
            )}
            {block.type === "collage-block" && (
              <CollageBlock items={block.items} />
            )}
            {block.type === "pull-quote" && (
              <blockquote
                className={`type-subhead italic text-charcoal pl-4 my-4 ${block.style === "oversized-marks" ? "relative" : ""}`}
              >
                {block.style === "oversized-marks" && (
                  <span className="absolute -left-4 -top-4 text-4xl text-gold/30">
                    “
                  </span>
                )}
                {block.content}
              </blockquote>
            )}
            {block.type === "fact-box" && (
              <div
                className={`bg-linen p-4 border border-gold/30 ${block.className || ""}`}
              >
                {block.title && (
                  <h4 className="type-minor-head text-charcoal mb-2">
                    {block.title}
                  </h4>
                )}
                <p className="type-body text-charcoal">
                  {block.content}
                </p>
              </div>
            )}
            {block.type === "list" && (
              <ul className="list-disc pl-5 type-body text-charcoal space-y-1">
                {block.content.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            )}
            {block.type === "byline" && (
              <div
                className={`type-kicker text-charcoal ${block.className || ""}`}
              >
                {block.content}
              </div>
            )}
            {block.type === "signoff" && (
              <div className="type-body italic text-charcoal mt-4 flex items-center gap-2">
                <span className="w-8 h-[1px] bg-charcoal/30"></span>
                {block.content}
              </div>
            )}
            {block.type === "qa" && (
              <div className="mb-4">
                <p className="type-body font-bold text-charcoal mb-1">
                  {block.question}
                </p>
                <p className="type-body text-charcoal">
                  {block.answer}
                </p>
              </div>
            )}
            {block.type === "references" && (
              <div className="mt-8 pt-4 border-t border-charcoal/10">
                <h5 className="type-kicker mb-2">References</h5>
                <ul className="type-caption text-charcoal/70 space-y-1 list-none">
                  {block.content.map((ref, i) => (
                    <li key={i}>{ref}</li>
                  ))}
                </ul>
              </div>
            )}
            {block.type === "link-button" && (
              <a
                href={block.href}
                className="inline-block px-4 py-2 border border-charcoal type-kicker hover:bg-charcoal hover:text-ivory transition-colors text-center no-underline"
              >
                {block.text}
              </a>
            )}
            {block.type === "toc-section" && (
              <h3 className="type-section-head text-charcoal mb-4 border-b border-charcoal pb-2">
                {block.title}
              </h3>
            )}
            {block.type === "toc-entry" && (
              <div className="flex justify-between items-baseline mb-2 group cursor-pointer">
                <span className="type-body text-charcoal font-serif-primary">
                  {block.title}
                </span>
                {block.showDivider && (
                  <span className="flex-1 mx-2 border-b border-charcoal/20 border-dotted h-1"></span>
                )}
                <span className="type-body text-charcoal font-sans-accent">
                  {block.pageNumber}
                </span>
              </div>
            )}
            {block.type === "team-grid" && (
              <div className="grid grid-cols-2 gap-4">
                {block.members.map((member, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center text-center"
                  >
                    <div className="w-16 h-16 rounded-full overflow-hidden mb-2 bg-gray-200">
                      <img
                        src={member.imageUrl}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h4 className="type-minor-head leading-tight">
                      {member.name}
                    </h4>
                    <p className="type-caption uppercase text-charcoal/60 mt-1">
                      {member.title}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </DraggableBlock>
        ))}
      </div>
    </div>
  );
};

export const ArticleLayout = ({
  page,
  blocks: propBlocks,
}: PageLayoutProps) => {
  const data = contentMap[page.id] || { blocks: [] };
  const items = propBlocks || data.blocks || [];
  const markdownBlock = items.find(
    (b) => b.type === "markdown",
  ) as { type: "markdown"; content: string } | undefined;

  const isRightPage = page.pageNumber % 2 !== 0;
  const paddingLeft = isRightPage ? "56px" : "48px";
  const paddingRight = isRightPage ? "48px" : "56px";
  const paddingTop = "60px";
  const paddingBottom = "40px";

  return (
    <div
      className="h-[660px] w-[480px] bg-ivory overflow-y-auto relative"
      style={{
        paddingLeft,
        paddingRight,
        paddingTop,
        paddingBottom,
      }}
    >
      <style>
        {`
          @font-face {
            font-family: "Priestacy";
            src:
              url("/fonts/Priestacy.otf") format("opentype"),
              url("https://raw.githubusercontent.com/Joliel21/Magazine/main/public/fonts/Priestacy.otf") format("opentype");
            font-weight: 400;
            font-style: normal;
            font-display: block;
          }
        `}
      </style>
      <GrainOverlay />
      <div className="max-w-none text-charcoal">
        {markdownBlock ? (
          <ReactMarkdown
            components={{
              h1: ({ node, ...props }) => (
                <h1
                  className="type-prestige-opener mb-8 text-left font-normal leading-tight"
                  {...props}
                />
              ),
              h2: ({ node, ...props }) => (
                <h2
                  className="mt-6 mb-3 text-left font-serif-primary text-[18px] leading-tight font-normal text-[#021A2B]"
                  {...props}
                />
              ),
              h3: ({ node, ...props }) => (
                <h3
                  className="mt-5 mb-3 text-left font-serif-primary text-[16px] leading-tight font-normal text-[#021A2B]"
                  {...props}
                />
              ),
              h4: ({ node, ...props }) => (
                <h4
                  className="mt-5 mb-2 text-left font-serif-primary text-[15px] leading-tight font-normal text-[#021A2B]"
                  {...props}
                />
              ),
              h5: ({ node, ...props }) => (
                <h5
                  className="mt-4 mb-2 text-left font-serif-primary text-[14px] leading-tight font-normal text-[#021A2B]"
                  {...props}
                />
              ),
              h6: ({ node, ...props }) => (
                <h6
                  className="mt-4 mb-2 text-left font-serif-primary text-[13px] leading-tight font-normal text-[#021A2B]"
                  {...props}
                />
              ),
              strong: ({ node, ...props }) => (
                <span className="font-normal" {...props} />
              ),
              b: ({ node, ...props }) => (
                <span className="font-normal" {...props} />
              ),
              p: ({ node, ...props }) => (
                <p className="type-body mb-4" {...props} />
              ),
              a: ({ node, ...props }) => (
                <a className="text-rust underline" {...props} />
              ),
              ul: ({ node, ...props }) => (
                <ul
                  className="list-disc pl-6 mb-4 type-body"
                  {...props}
                />
              ),
              ol: ({ node, ...props }) => (
                <ol
                  className="list-decimal pl-6 mb-4 type-body"
                  {...props}
                />
              ),
              li: ({ node, ...props }) => (
                <li className="mb-1" {...props} />
              ),
              blockquote: ({ node, ...props }) => (
                <blockquote
                  className="pl-4 italic my-4 type-body"
                  {...props}
                />
              ),
              hr: () => <span className="block h-4"></span>,
            }}
          >
            {markdownBlock.content}
          </ReactMarkdown>
        ) : (
          <p className="type-body">Loading article...</p>
        )}
      </div>

      {isWelcomePage && (
        <div className="absolute left-0 right-0 bottom-0 bg-[#19454B] px-[56px] py-5 text-[#F8F3E8]">
          <h2
            className="mb-2"
            style={{
              fontFamily: "var(--font-serif-primary)",
              fontSize: "15pt",
              lineHeight: 1.08,
              fontWeight: 700,
              color: "#8FC7D2",
            }}
          >
            Mission Statement
          </h2>

          <p className="text-[8.5px] leading-[1.35] text-[#F8F3E8]">
            Breathtaking Awareness empowers the pulmonary
            hypertension (PH) community through awareness,
            advocacy, education, and support.
          </p>

          <p
            className="mt-3 text-center"
            style={{
              fontFamily:
                "Priestacy, var(--font-serif-primary), cursive",
              fontSize: "25pt",
              lineHeight: 1,
              color: "#AF9355",
              textShadow: "0 2px 8px rgba(0,0,0,0.35)",
            }}
          >
            Jolie Lizana
          </p>

          <p className="mt-2 text-center text-[8px] leading-tight text-[#F8F3E8]/90">
            © Breathtaking Awareness. All rights reserved.
          </p>
        </div>
      )}
    </div>
  );
};

export const ArticleImageLayout = ({
  page,
  blocks: propBlocks,
}: PageLayoutProps) => {
  const data = contentMap[page.id] || { blocks: [] };
  const items = propBlocks || data.blocks || [];
  const imageBlock = items.find((b) => b.type === "image") as
    | { type: "image"; src: string; alt: string }
    | undefined;

  return (
    <div className="h-[660px] w-[480px] bg-[#1a1a1a] relative overflow-hidden">
      {imageBlock && (
        <ImageWithFallback
          src={imageBlock.src}
          alt={imageBlock.alt}
          className="w-full h-full object-cover opacity-90"
        />
      )}
    </div>
  );
};

export const ArticleTitleLayout = ({
  page,
  blocks: propBlocks,
}: PageLayoutProps) => {
  const data = contentMap[page.id] || { blocks: [] };
  const items = (propBlocks || data.blocks || []) as Array<{
    type?: string;
    content?: string;
  }>;

  const toPlainText = (value = "") =>
    String(value)
      .replace(/^#+\s*/gm, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .trim();

  const splitMarkdownTitlePage = (markdown = "") => {
    const lines = markdown
      .split(/\n+/)
      .map((line) => toPlainText(line))
      .filter(Boolean);

    return {
      title: lines[0] || page.title || "Untitled",
      subtitle:
        lines[1] &&
        !/^editorial$/i.test(lines[1]) &&
        !/^by\s+/i.test(lines[1])
          ? lines[1]
          : "",
      metaLines: lines.filter(
        (line, index) =>
          index > 0 &&
          !(
            index === 1 &&
            !/^editorial$/i.test(line) &&
            !/^by\s+/i.test(line)
          ),
      ),
    };
  };

  const markdownBlock = items.find(
    (block) => block.type === "markdown",
  );
  const markdownData = markdownBlock?.content
    ? splitMarkdownTitlePage(markdownBlock.content)
    : null;

  const kicker = toPlainText(
    items.find((block) => block.type === "kicker")?.content ||
      "",
  );

  const paragraphs = items
    .filter((block) => block.type === "paragraph")
    .map((block) => toPlainText(block.content || ""))
    .filter(Boolean);

  const title =
    markdownData?.title ||
    paragraphs[0] ||
    page.title ||
    "Untitled";
  const subtitle =
    markdownData?.subtitle || paragraphs[1] || "";
  const metaLines =
    markdownData?.metaLines ||
    paragraphs.slice(2).filter(Boolean);

  const isRightPage = page.pageNumber % 2 !== 0;
  const paddingLeft = isRightPage ? "54px" : "48px";
  const paddingRight = isRightPage ? "48px" : "54px";

  return (
    <div
      className="relative h-[660px] w-[480px] overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #021A2B 0%, #0A2736 54%, #021A2B 100%)",
        paddingLeft,
        paddingRight,
        paddingTop: "64px",
        paddingBottom: "56px",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 82% 16%, rgba(43,155,192,0.18), transparent 30%), radial-gradient(circle at 14% 88%, rgba(175,147,85,0.13), transparent 34%)",
        }}
      />

      <div className="absolute left-[42px] top-[48px] h-[1px] w-[122px] bg-[#AF9355]/70" />
      <div className="absolute right-[44px] top-[74px] h-[1px] w-[86px] bg-[#2B9BC0]/60" />
      <div className="absolute left-[-116px] bottom-[-120px] h-[300px] w-[300px] rounded-full border border-[#2B9BC0]/18" />
      <div className="absolute right-[-118px] top-[-112px] h-[280px] w-[280px] rounded-full border border-[#AF9355]/18" />
      <div className="absolute bottom-[72px] right-[-36px] h-[1px] w-[220px] rotate-[-32deg] bg-[#AF9355]/55" />

      <div className="absolute inset-[30px] border border-[#AF9355]/26 pointer-events-none" />

      <div className="relative z-10 flex h-full flex-col justify-between">
        <div>
          <div
            className="mb-8 uppercase tracking-[0.24em]"
            style={{
              fontFamily:
                "Inter, Avenir Next, Helvetica Neue, Arial, sans-serif",
              fontSize: "9pt",
              fontWeight: 400,
              lineHeight: 1.2,
              color: "#AF9355",
            }}
          >
            {kicker || "Breathtaking Awareness"}
          </div>

          <div className="max-w-[340px]">
            <h1
              style={{
                fontFamily: "var(--font-serif-primary)",
                fontSize: title.length > 92 ? "22pt" : "26pt",
                lineHeight: 1.05,
                fontWeight: 600,
                color: "#F8F3E8",
              }}
            >
              {title}
            </h1>

            {subtitle ? (
              <>
                <div className="mt-7 h-[2px] w-28 bg-[#2B9BC0]" />
                <p
                  className="mt-6"
                  style={{
                    fontFamily:
                      "Inter, Avenir Next, Helvetica Neue, Arial, sans-serif",
                    fontSize: "15pt",
                    lineHeight: 1.28,
                    fontWeight: 300,
                    color: "#F3E8D3",
                  }}
                >
                  {subtitle}
                </p>
              </>
            ) : (
              <div className="mt-7 h-[2px] w-28 bg-[#2B9BC0]" />
            )}
          </div>
        </div>

        <div className="pb-2">
          {metaLines.map((line, index) => (
            <p
              key={`${page.id}-meta-${index}`}
              className={index === 0 ? "" : "mt-2"}
              style={{
                fontFamily:
                  "Inter, Avenir Next, Helvetica Neue, Arial, sans-serif",
                fontSize: index === 0 ? "10pt" : "10.5pt",
                lineHeight: 1.35,
                fontWeight: index === 0 ? 500 : 300,
                letterSpacing:
                  index === 0 ? "0.14em" : "0.04em",
                textTransform:
                  index === 0 ? "uppercase" : "none",
                color:
                  index === 0
                    ? "#AF9355"
                    : "rgba(248,243,232,0.9)",
              }}
            >
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

const ChapterDividerBlock = ({
  title,
  subtitle,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
}) => {
  const normalizedTitle = title.trim().toLowerCase();
  const isPhlipSide = normalizedTitle === "the phlip-side";
  const isContributionsInWriting =
    normalizedTitle === "contributions in writing";
  const titleLines = isPhlipSide
    ? ["The", "PHlip-side"]
    : isContributionsInWriting
      ? ["Contributions", "in Writing"]
      : [title];
  const titleFontSize = isPhlipSide
    ? "47pt"
    : isContributionsInWriting
      ? "42pt"
      : title.length > 28
        ? "44pt"
        : "58pt";
  const chapterPaddingClass = isContributionsInWriting
    ? "pl-16 pr-10 py-12"
    : "px-10 py-12";

  return (
    <div
      className={`relative flex h-full w-full flex-col justify-center overflow-hidden bg-[#021A2B] ${chapterPaddingClass} text-ivory`}
    >
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(circle at 80% 20%, rgba(43,155,192,0.28), transparent 34%), radial-gradient(circle at 15% 85%, rgba(0,95,115,0.42), transparent 38%), linear-gradient(180deg, #01101C 0%, #021A2B 46%, #01101C 100%)",
        }}
      />
      <div className="absolute right-[-118px] bottom-[-96px] h-[320px] w-[320px] rounded-full border border-[#AF9355]/18" />
      <div className="absolute left-[-120px] top-[-110px] h-[290px] w-[290px] rounded-full border border-[#2B9BC0]/24" />
      <div className="absolute top-[118px] right-[-54px] h-[1px] w-[260px] rotate-[28deg] bg-[#AF9355]/58" />
      <div className="absolute left-10 top-10 h-[92px] w-[1px] bg-[#C9A45C]/45" />
      <div className="absolute left-10 top-10 h-[1px] w-[92px] bg-[#C9A45C]/45" />

      <div className="relative z-10">
        {eyebrow && (
          <p
            className="mb-8 font-sans-accent uppercase tracking-[0.28em] text-[#C9A45C]"
            style={{ fontSize: "14px" }}
          >
            {eyebrow}
          </p>
        )}

        <h1
          className="mb-5 text-left"
          style={{
            fontFamily: "var(--font-serif-primary)",
            fontSize: titleFontSize,
            lineHeight: isContributionsInWriting ? 0.92 : 0.86,
            fontWeight: 700,
            letterSpacing: "-0.035em",
            color: "#AF9355",
            textShadow: "0 3px 12px rgba(0,0,0,0.45)",
          }}
        >
          {titleLines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h1>

        <div className="mb-6 h-[2px] w-44 bg-[#2B9BC0]" />

        {subtitle && (
          <p
            className="text-left text-ivory/90"
            style={{
              fontFamily:
                "Inter, Avenir Next, Helvetica Neue, Arial, sans-serif",
              fontSize: "15pt",
              lineHeight: 1.3,
              fontWeight: 300,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

const SHARE_COVER_LOGO_SOURCES = [
  `${import.meta.env.BASE_URL}images/brand/Cover_Logo.png`,
  "/Magazine/images/brand/Cover_Logo.png",
  "/images/brand/Cover_Logo.png",
  "https://raw.githubusercontent.com/Joliel21/Magazine/main/public/images/brand/Cover_Logo.png",
];

const ShareCoverLogo = () => {
  const [sourceIndex, setSourceIndex] = useState(0);
  const [isHidden, setIsHidden] = useState(false);

  const handleError = () => {
    if (sourceIndex < SHARE_COVER_LOGO_SOURCES.length - 1) {
      setSourceIndex((currentIndex) => currentIndex + 1);
      return;
    }

    setIsHidden(true);
  };

  if (isHidden) return null;

  return (
    <img
      src={SHARE_COVER_LOGO_SOURCES[sourceIndex]}
      alt=""
      className="h-[276px] w-auto object-contain"
      onError={handleError}
      draggable={false}
    />
  );
};

const EditorialShareBlock = ({
  articleId,
  articleTitle,
  articleUrl,
  articleExcerpt = "",
  articleImage = "",
  pageNumber = 1,
}: {
  articleId: string;
  articleTitle: string;
  articleUrl?: string;
  articleExcerpt?: string;
  articleImage?: string;
  pageNumber?: number;
}) => {
  const [copyStatus, setCopyStatus] = useState("");
  const [manualShareUrl, setManualShareUrl] = useState("");
  const [showShareOptions, setShowShareOptions] =
    useState(false);

  const getShareUrl = () => {
    if (articleUrl) return articleUrl;
    if (typeof window === "undefined") return "";

    const url = new URL(window.location.href);
    url.hash = "";

    // Keep the outward-facing URL clean. Remove reader/navigation-only params
    // so shared links do not open at odd page numbers.
    Array.from(url.searchParams.keys()).forEach((key) => {
      if (key !== "article") url.searchParams.delete(key);
    });

    url.searchParams.set("article", articleId);
    return url.toString();
  };

  const copyToClipboard = async (value: string) => {
    if (!value) return false;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
        return true;
      }
    } catch (error) {
      // Continue to the legacy fallback.
    }

    try {
      const textArea = document.createElement("textarea");
      textArea.value = value;
      textArea.setAttribute("readonly", "true");
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const copied = document.execCommand("copy");
      document.body.removeChild(textArea);

      return copied;
    } catch (error) {
      return false;
    }
  };

  const copyShareText = async () => {
    const shareUrl = getShareUrl();
    setManualShareUrl(shareUrl);

    const copied = await copyToClipboard(shareUrl);

    setCopyStatus(
      copied
        ? "Link copied"
        : "Copy blocked — use the visible link below",
    );
    window.setTimeout(() => setCopyStatus(""), 2600);
    return copied;
  };

  const openShareWindow = (url: string) => {
    if (typeof window === "undefined") return false;

    const popup = window.open(
      url,
      "_blank",
      "noopener,noreferrer,width=760,height=680",
    );

    if (popup) {
      popup.opener = null;
      return true;
    }

    return false;
  };

  const handleShare = async (
    platform: "linkedin" | "facebook" | "x" | "copy",
  ) => {
    updateSharePreviewMetadata();

    const shareUrl = getShareUrl();
    const encodedUrl = encodeURIComponent(shareUrl);

    if (platform === "copy") {
      const copied = await copyShareText();
      setShowShareOptions(false);

      if (!copied) {
        setManualShareUrl(shareUrl);
      }

      return;
    }

    setShowShareOptions(false);

    if (platform === "linkedin") {
      const opened = openShareWindow(
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      );

      if (!opened) {
        setManualShareUrl(shareUrl);
        setCopyStatus(
          "Popup blocked — use the visible link below",
        );
        window.setTimeout(() => setCopyStatus(""), 3200);
      }

      return;
    }

    if (platform === "facebook") {
      // Facebook pulls title, description, and image from the public share page's
      // Open Graph tags. This works best after the reader is published online.
      const opened = openShareWindow(
        `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      );

      if (!opened) {
        setManualShareUrl(shareUrl);
        setCopyStatus(
          "Popup blocked — use the visible link below",
        );
        window.setTimeout(() => setCopyStatus(""), 3200);
      }

      return;
    }

    if (platform === "x") {
      const encodedTitle = encodeURIComponent(
        articleTitle.trim(),
      );
      const opened = openShareWindow(
        `https://x.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      );

      if (!opened) {
        setManualShareUrl(shareUrl);
        setCopyStatus(
          "Popup blocked — use the visible link below",
        );
        window.setTimeout(() => setCopyStatus(""), 3200);
      }

      return;
    }
  };

  const cleanArticleTitle =
    articleTitle.trim().replace(/[?!\.]+$/, "") ||
    "this editorial";
  const isRightPage = pageNumber % 2 !== 0;
  const shareBoxEdgeStyle = isRightPage
    ? { right: "78px" }
    : { left: "78px" };
  const logoCircleNudgeStyle = isRightPage
    ? { transform: "translateX(14px)" }
    : { transform: "translateX(-14px)" };

  const updateSharePreviewMetadata = () => {
    if (typeof document === "undefined") return;

    const upsertMeta = (
      selector: string,
      attributeName: "property" | "name",
      attributeValue: string,
      content: string,
    ) => {
      if (!content) return;

      let element = document.head.querySelector(
        selector,
      ) as HTMLMetaElement | null;

      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attributeName, attributeValue);
        document.head.appendChild(element);
      }

      element.setAttribute("content", content);
    };

    const shareUrl = getShareUrl();
    const description = articleExcerpt || articleTitle;

    upsertMeta(
      'meta[property="og:title"]',
      "property",
      "og:title",
      articleTitle,
    );
    upsertMeta(
      'meta[property="og:description"]',
      "property",
      "og:description",
      description,
    );
    upsertMeta(
      'meta[property="og:url"]',
      "property",
      "og:url",
      shareUrl,
    );
    upsertMeta(
      'meta[property="og:type"]',
      "property",
      "og:type",
      "article",
    );
    upsertMeta(
      'meta[property="og:image"]',
      "property",
      "og:image",
      articleImage,
    );
    upsertMeta(
      'meta[name="twitter:card"]',
      "name",
      "twitter:card",
      "summary_large_image",
    );
    upsertMeta(
      'meta[name="twitter:title"]',
      "name",
      "twitter:title",
      articleTitle,
    );
    upsertMeta(
      'meta[name="twitter:description"]',
      "name",
      "twitter:description",
      description,
    );
    upsertMeta(
      'meta[name="twitter:image"]',
      "name",
      "twitter:image",
      articleImage,
    );
  };

  const buttonClass =
    "rounded-full border px-5 py-2.5 text-[13px] uppercase tracking-[0.12em] transition-colors focus:outline-none focus:ring-2" +
    " border-[#2B9BC0]/55 text-[#F8F3E8] hover:bg-[#2B9BC0]/20 hover:border-[#2B9BC0] hover:text-white focus:ring-[#2B9BC0]/40";

  const shareUrlForMenu = getShareUrl();
  const encodedShareUrlForMenu =
    encodeURIComponent(shareUrlForMenu);
  const encodedTitleForMenu = encodeURIComponent(
    articleTitle.trim(),
  );
  const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedShareUrlForMenu}`;
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedShareUrlForMenu}`;
  const xShareUrl = `https://x.com/intent/tweet?text=${encodedTitleForMenu}&url=${encodedShareUrlForMenu}`;

  const handleNativeShareLinkClick = () => {
    updateSharePreviewMetadata();
    setShowShareOptions(false);
  };

  return (
    <div
      className="relative h-full w-full text-center"
      style={{
        background:
          "radial-gradient(circle at 82% 18%, rgba(43,155,192,0.18) 0%, rgba(43,155,192,0.05) 28%, transparent 42%), linear-gradient(180deg, #01101C 0%, #021A2B 42%, #01101C 100%)",
        color: "#F8F3E8",
      }}
    >
      <div
        className="absolute top-[34%] z-20 flex w-[326px] max-w-[68%] -translate-y-1/2 flex-col items-center text-center"
        style={{
          ...shareBoxEdgeStyle,
          border: "1.35px solid rgba(201,164,92,0.78)",
          padding: "26px 22px 24px",
          boxShadow:
            "0 0 0 1px rgba(201,164,92,0.18), 0 18px 42px rgba(0,0,0,0.22)",
          background:
            "linear-gradient(180deg, rgba(1,16,28,0.18) 0%, rgba(2,26,43,0.28) 100%)",
        }}
      >
        <div
          className="absolute left-4 top-4 h-[22px] w-[22px] border-l border-t border-[#C9A45C]/70"
          aria-hidden="true"
        />
        <div
          className="absolute right-4 top-4 h-[22px] w-[22px] border-r border-t border-[#C9A45C]/70"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-4 left-4 h-[22px] w-[22px] border-b border-l border-[#C9A45C]/70"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-4 right-4 h-[22px] w-[22px] border-b border-r border-[#C9A45C]/70"
          aria-hidden="true"
        />

        <div className="mb-5 h-[1px] w-14 bg-[#2B9BC0]/80" />
        <p
          className="type-minor-head mb-1.5"
          style={{ color: "#C9A45C" }}
        >
          Enjoyed
        </p>
        <h2
          className="mb-4 max-w-[280px]"
          style={{
            fontFamily: "var(--font-serif-primary)",
            fontSize:
              cleanArticleTitle.length > 76
                ? "14.5pt"
                : cleanArticleTitle.length > 62
                  ? "16pt"
                  : "18.5pt",
            lineHeight: 1.14,
            fontWeight: 700,
            color: "#F8F3E8",
            overflowWrap: "break-word",
            wordBreak: "normal",
          }}
        >
          {cleanArticleTitle}?
        </h2>
        <div className="relative flex w-full max-w-[300px] flex-col items-center justify-center">
          <button
            type="button"
            className={`${buttonClass} min-w-[142px]`}
            aria-expanded={showShareOptions}
            aria-controls={`share-options-${articleId}`}
            onClick={() =>
              setShowShareOptions((current) => !current)
            }
          >
            Share
          </button>

          {showShareOptions && (
            <div
              id={`share-options-${articleId}`}
              className="absolute top-[40px] z-[9999] flex w-[188px] flex-col overflow-hidden rounded-lg border border-[#C9A45C]/70 bg-[#021A2B] shadow-xl"
            >
              <a
                href={linkedinShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 text-left text-[11px] font-semibold tracking-[0.08em] text-[#F8F3E8] transition-colors hover:bg-[#0B3A4F] no-underline"
                onClick={handleNativeShareLinkClick}
              >
                LinkedIn
              </a>
              <a
                href={facebookShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="border-t border-[#C9A45C]/25 px-4 py-2.5 text-left text-[11px] font-semibold tracking-[0.08em] text-[#F8F3E8] transition-colors hover:bg-[#0B3A4F] no-underline"
                onClick={handleNativeShareLinkClick}
              >
                Facebook
              </a>
              <a
                href={xShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="border-t border-[#C9A45C]/25 px-4 py-2.5 text-left text-[11px] font-semibold tracking-[0.08em] text-[#F8F3E8] transition-colors hover:bg-[#0B3A4F] no-underline"
                onClick={handleNativeShareLinkClick}
              >
                X-Twitter
              </a>
              <button
                type="button"
                className="border-t border-[#C9A45C]/25 px-4 py-2.5 text-left text-[11px] font-semibold tracking-[0.08em] text-[#F8F3E8] transition-colors hover:bg-[#0B3A4F]"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  handleShare("copy");
                }}
              >
                Copy Link
              </button>
            </div>
          )}
        </div>

        {copyStatus && (
          <p
            className="type-caption mt-4"
            style={{ color: "#2B9BC0" }}
            role="status"
          >
            {copyStatus}
          </p>
        )}

        {manualShareUrl && (
          <div className="mt-3 w-full max-w-[280px]">
            <label
              className="sr-only"
              htmlFor={`share-url-${articleId}`}
            >
              Share URL
            </label>
            <input
              id={`share-url-${articleId}`}
              readOnly
              value={manualShareUrl}
              onFocus={(event) => event.currentTarget.select()}
              className="w-full rounded-md border border-[#C9A45C]/60 bg-[#F8F3E8] px-3 py-2 text-center text-[9px] leading-tight text-[#021A2B]"
            />
          </div>
        )}
      </div>

      <div
        className="pointer-events-none absolute top-[75%] z-0 flex w-[326px] max-w-[68%] -translate-y-1/2 items-center justify-center"
        style={shareBoxEdgeStyle}
        aria-hidden="true"
      >
        <div style={logoCircleNudgeStyle}>
          <ShareCoverLogo />
        </div>
      </div>
    </div>
  );
};

export const ArticleTextLayout = ({
  page,
  blocks: propBlocks,
}: PageLayoutProps) => {
  const data = contentMap[page.id] || { blocks: [] };
  const items = propBlocks || data.blocks || [];
  const markdownBlock = items.find(
    (b) => b.type === "markdown",
  ) as { type: "markdown"; content: string } | undefined;
  const shareBlock = items.find((b) => b.type === "share") as
    | {
        type: "share";
        articleId: string;
        articleTitle: string;
        articleUrl?: string;
        articleExcerpt?: string;
        articleImage?: string;
      }
    | undefined;
  const chapterDividerBlock = items.find(
    (b) => b.type === "chapter-divider",
  ) as
    | {
        type: "chapter-divider";
        title: string;
        subtitle?: string;
        eyebrow?: string;
      }
    | undefined;
  const isGeneratedTitlePage =
    Boolean(
      markdownBlock?.content?.includes("By Jolie Lizana"),
    ) && page.id.includes("-title");
  const isWelcomePage =
    page.id === "welcome-to-breathtaking-awareness";
  const isMissionStatementPage =
    page.id === "mission-statement-page";
  const isHowToUsePage =
    page.id === "how-to-use-this-volume-page";
  const isAboutBreathtakingAwarenessPage =
    page.id === "about-breathtaking-awareness-page";
  const showWelcomeHeader = isAboutBreathtakingAwarenessPage;
  const isFrontOpenerPage = page.id === "front-opener-page";
  const isVolumeOnePage = page.id === "volume-one-page";
  const isChapterDescriptionPage =
    page.id.startsWith("chapter-") &&
    page.id.endsWith("-description");
  const isStoryTextPage =
    !chapterDividerBlock &&
    !shareBlock &&
    !isGeneratedTitlePage &&
    !isWelcomePage &&
    !isMissionStatementPage &&
    !showWelcomeHeader &&
    !isHowToUsePage &&
    !isFrontOpenerPage &&
    !isVolumeOnePage &&
    !isChapterDescriptionPage;

  const isRightPage = page.pageNumber % 2 !== 0;
  const paddingLeft = isRightPage ? "56px" : "48px";
  const paddingRight = isRightPage ? "48px" : "56px";
  const articleStoryPaddingX = "58px";
  const articleStoryPaddingTop = "64px";
  const articleStoryPaddingBottom = "78px";
  const paddingTop = "60px";
  const paddingBottom = "40px";

  const titleHeadingStyle = {
    fontFamily: "var(--font-serif-primary)",
    fontWeight: 700,
    lineHeight: 1.08,
    letterSpacing: "-0.01em",
  } as CSSProperties;

  const titlePageComponents = {
    h1: ({ node, ...props }: any) => (
      <h1
        className="text-center text-charcoal mb-7"
        style={{ ...titleHeadingStyle, fontSize: "34pt" }}
        {...props}
      />
    ),
    h2: ({ node, ...props }: any) => (
      <h2
        className="text-center text-charcoal mb-7"
        style={{ ...titleHeadingStyle, fontSize: "30pt" }}
        {...props}
      />
    ),
    h3: ({ node, ...props }: any) => (
      <h3
        className="text-center text-charcoal mb-7"
        style={{ ...titleHeadingStyle, fontSize: "26pt" }}
        {...props}
      />
    ),
    h4: ({ node, ...props }: any) => (
      <h4
        className="text-center text-charcoal mb-7"
        style={{ ...titleHeadingStyle, fontSize: "22pt" }}
        {...props}
      />
    ),
    h5: ({ node, ...props }: any) => (
      <h5
        className="text-center text-charcoal mb-8"
        style={{
          fontFamily: "var(--font-serif-secondary)",
          fontSize: "12pt",
          lineHeight: 1.35,
          fontWeight: 600,
        }}
        {...props}
      />
    ),
    h6: ({ node, ...props }: any) => (
      <h6
        className="text-center text-charcoal mb-8"
        style={{
          fontFamily: "var(--font-serif-secondary)",
          fontSize: "11pt",
          lineHeight: 1.35,
          fontWeight: 600,
        }}
        {...props}
      />
    ),
    strong: ({ node, ...props }: any) => (
      <strong style={{ fontWeight: 700 }} {...props} />
    ),
    b: ({ node, ...props }: any) => (
      <strong style={{ fontWeight: 700 }} {...props} />
    ),
    p: ({ node, ...props }: any) => (
      <p
        className="text-center text-charcoal mb-4"
        style={{
          fontFamily: "var(--font-serif-secondary)",
          fontSize: "10pt",
          lineHeight: 1.4,
          fontWeight: 500,
        }}
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
        className="list-disc pl-6 mb-5 type-body"
        {...props}
      />
    ),
    ol: ({ node, ...props }: any) => (
      <ol
        className="list-decimal pl-6 mb-5 type-body"
        {...props}
      />
    ),
    li: ({ node, ...props }: any) => (
      <li className="mb-2" {...props} />
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

  const storyComponents = {
    h1: ({ node, ...props }: any) => (
      <h1
        className={`text-left font-normal leading-tight ${
          isMissionStatementPage ? "mb-4" : "mb-8"
        }`}
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
        className="mt-6 mb-3 text-left font-serif-primary text-[18px] leading-tight font-normal text-[#021A2B]"
        {...props}
      />
    ),
    h3: ({ node, ...props }: any) => (
      <h3
        className="mt-5 mb-3 text-left font-serif-primary text-[16px] leading-tight font-normal text-[#021A2B]"
        {...props}
      />
    ),
    h4: ({ node, ...props }: any) => (
      <h4
        className="mt-5 mb-2 text-left font-serif-primary text-[15px] leading-tight font-normal text-[#021A2B]"
        {...props}
      />
    ),
    h5: ({ node, ...props }: any) => (
      <h5
        className="mt-4 mb-2 text-left font-serif-primary text-[14px] leading-tight font-normal text-[#021A2B]"
        {...props}
      />
    ),
    h6: ({ node, ...props }: any) => (
      <h6
        className="mt-4 mb-2 text-left font-serif-primary text-[13px] leading-tight font-normal text-[#021A2B]"
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
        className="type-body mb-3 text-justify"
        style={
          isStoryTextPage
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
        className="list-disc pl-6 mb-5 type-body"
        {...props}
      />
    ),
    ol: ({ node, ...props }: any) => (
      <ol
        className="list-decimal pl-6 mb-5 type-body"
        {...props}
      />
    ),
    li: ({ node, ...props }: any) => (
      <li className="mb-2" {...props} />
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

  if (isGeneratedTitlePage && markdownBlock) {
    const toPlainTitleText = (value = "") =>
      String(value)
        .replace(/^#+\s*/gm, "")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .trim();

    const titleLines = markdownBlock.content
      .split(/\n+/)
      .map((line) => toPlainTitleText(line))
      .filter(Boolean);

    const titleText = titleLines[0] || page.alt || "Untitled";
    const hasSubtitle =
      Boolean(titleLines[1]) &&
      !/^editorial$/i.test(titleLines[1]) &&
      !/^by\s+/i.test(titleLines[1]) &&
      !/^published\s+/i.test(titleLines[1]);

    const subtitleText = hasSubtitle ? titleLines[1] : "";
    const metaLines = titleLines.filter(
      (line, index) =>
        index > 0 && !(hasSubtitle && index === 1),
    );

    const titleSize =
      page.pageNumber === 118 || page.pageNumber === 127
        ? titleText.length > 112
          ? "24pt"
          : titleText.length > 86
            ? "27pt"
            : "30pt"
        : titleText.length > 112
          ? "20pt"
          : titleText.length > 86
            ? "23pt"
            : "26pt";

    return (
      <div
        className="relative h-[660px] w-[480px] overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, #021A2B 0%, #0A2736 54%, #021A2B 100%)",
          paddingLeft,
          paddingRight,
          paddingTop: "64px",
          paddingBottom: "56px",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 82% 16%, rgba(43,155,192,0.18), transparent 30%), radial-gradient(circle at 14% 88%, rgba(175,147,85,0.13), transparent 34%)",
          }}
        />

        <div className="absolute left-[42px] top-[48px] h-[1px] w-[122px] bg-[#AF9355]/70" />
        <div className="absolute right-[44px] top-[74px] h-[1px] w-[86px] bg-[#2B9BC0]/60" />
        <div className="absolute left-[-116px] bottom-[-120px] h-[300px] w-[300px] rounded-full border border-[#2B9BC0]/18" />
        <div className="absolute right-[-118px] top-[-112px] h-[280px] w-[280px] rounded-full border border-[#AF9355]/18" />
        <div className="absolute bottom-[72px] right-[-36px] h-[1px] w-[220px] rotate-[-32deg] bg-[#AF9355]/55" />
        <div className="absolute inset-[30px] border border-[#AF9355]/26 pointer-events-none" />

        <div className="relative z-10 flex h-full flex-col justify-between">
          <div>
            <div
              className="mb-8 uppercase tracking-[0.24em]"
              style={{
                fontFamily:
                  "Inter, Avenir Next, Helvetica Neue, Arial, sans-serif",
                fontSize: "9pt",
                fontWeight: 400,
                lineHeight: 1.2,
                color: "#AF9355",
              }}
            >
              Breathtaking Awareness
            </div>

            <div className="max-w-[340px]">
              <h1
                style={{
                  fontFamily: "var(--font-serif-primary)",
                  fontSize: titleSize,
                  lineHeight: 1.05,
                  fontWeight: 600,
                  color: "#F8F3E8",
                }}
              >
                {titleText}
              </h1>

              {subtitleText ? (
                <>
                  <div className="mt-7 h-[2px] w-28 bg-[#2B9BC0]" />
                  <p
                    className="mt-6"
                    style={{
                      fontFamily:
                        "Inter, Avenir Next, Helvetica Neue, Arial, sans-serif",
                      fontSize: "15pt",
                      lineHeight: 1.28,
                      fontWeight: 300,
                      color: "#F3E8D3",
                    }}
                  >
                    {subtitleText}
                  </p>
                </>
              ) : (
                <div className="mt-7 h-[2px] w-28 bg-[#2B9BC0]" />
              )}
            </div>
          </div>

          <div className="pb-2">
            {metaLines.map((line, index) => (
              <p
                key={`${page.id}-meta-${index}`}
                className={index === 0 ? "" : "mt-2"}
                style={{
                  fontFamily:
                    "Inter, Avenir Next, Helvetica Neue, Arial, sans-serif",
                  fontSize: index === 0 ? "10pt" : "10.5pt",
                  lineHeight: 1.35,
                  fontWeight: index === 0 ? 500 : 300,
                  letterSpacing:
                    index === 0 ? "0.14em" : "0.04em",
                  textTransform:
                    index === 0 ? "uppercase" : "none",
                  color:
                    index === 0
                      ? "#AF9355"
                      : "rgba(248,243,232,0.9)",
                }}
              >
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isChapterDescriptionPage && markdownBlock) {
    return (
      <div className="relative h-[660px] w-[480px] overflow-hidden bg-[#021A2B] text-[#F8F3E8] select-none">
        <div
          className="absolute inset-0 opacity-95"
          style={{
            background:
              "radial-gradient(circle at 18% 22%, rgba(175,147,85,0.14), transparent 30%), radial-gradient(circle at 88% 76%, rgba(43,155,192,0.24), transparent 36%), linear-gradient(160deg, #01101C 0%, #021A2B 52%, #082B3A 100%)",
          }}
        />

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -right-20 top-[-80px] h-[300px] w-[300px] rounded-full border border-[#2B9BC0]/25" />
          <div className="absolute -left-28 bottom-[-120px] h-[340px] w-[340px] rounded-full border border-[#C9A45C]/18" />
          <div className="absolute bottom-16 right-[-40px] h-[1px] w-[300px] rotate-[-32deg] bg-[#C9A45C]/60" />
          <div className="absolute left-10 top-10 h-[92px] w-[1px] bg-[#C9A45C]/45" />
          <div className="absolute left-10 top-10 h-[1px] w-[92px] bg-[#C9A45C]/45" />
        </div>

        <div
          className="relative z-10 flex h-full flex-col justify-center py-12"
          style={{
            paddingLeft:
              page.pageNumber === 117
                ? "72px"
                : page.pageNumber === 11
                  ? "56px"
                  : "40px",
            paddingRight:
              page.pageNumber === 117
                ? "24px"
                : page.pageNumber === 11
                  ? "24px"
                  : "40px",
          }}
        >
          <ReactMarkdown
            components={{
              h1: ({ node, ...props }: any) => (
                <h1
                  className="mb-8 text-left"
                  style={{
                    fontFamily: "var(--font-serif-primary)",
                    fontSize: "34pt",
                    lineHeight: 0.94,
                    fontWeight: 700,
                    letterSpacing: "-0.025em",
                    color: "#AF9355",
                    textShadow: "0 3px 12px rgba(0,0,0,0.45)",
                  }}
                  {...props}
                />
              ),
              h2: ({ node, ...props }: any) => (
                <h2
                  className="mb-8 text-left"
                  style={{
                    fontFamily: "var(--font-serif-primary)",
                    fontSize: "34pt",
                    lineHeight: 0.94,
                    fontWeight: 700,
                    letterSpacing: "-0.025em",
                    color: "#AF9355",
                    textShadow: "0 3px 12px rgba(0,0,0,0.45)",
                  }}
                  {...props}
                />
              ),
              p: ({ node, ...props }: any) => (
                <p
                  className="max-w-[360px] text-left"
                  style={{
                    fontFamily:
                      "Inter, Avenir Next, Helvetica Neue, Arial, sans-serif",
                    fontSize: "14pt",
                    lineHeight: 1.42,
                    fontWeight: 300,
                    color: "rgba(248,243,232,0.92)",
                  }}
                  {...props}
                />
              ),
              strong: ({ node, ...props }: any) => (
                <strong
                  style={{ fontWeight: 700 }}
                  {...props}
                />
              ),
              em: ({ node, ...props }: any) => (
                <em
                  style={{ fontStyle: "italic" }}
                  {...props}
                />
              ),
            }}
          >
            {markdownBlock.content}
          </ReactMarkdown>

          <div className="mt-8 h-[2px] w-44 bg-[#2B9BC0]" />
        </div>
      </div>
    );
  }

  if (isVolumeOnePage) {
    return (
      <div className="h-[660px] w-[480px] relative overflow-hidden bg-ivory text-charcoal select-none">
        <GrainOverlay />

        {/* Soft background accents */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -right-[86px] top-[-82px] h-[220px] w-[220px] rounded-full border border-[#19454B]/14" />
          <div className="absolute -left-[110px] bottom-[-92px] h-[250px] w-[250px] rounded-full border border-[#19454B]/10" />

          {/* Gold corner rules */}
          <div className="absolute left-[54px] top-[58px] h-[96px] w-[1px] bg-[#AF9355]/55" />
          <div className="absolute left-[54px] top-[58px] h-[1px] w-[132px] bg-[#AF9355]/55" />

          <div className="absolute right-[58px] bottom-[74px] h-[1px] w-[132px] bg-[#AF9355]/55" />
          <div className="absolute right-[58px] bottom-[74px] h-[96px] w-[1px] bg-[#AF9355]/55" />
        </div>

        {/* Main centered content */}
        <div className="absolute left-[56px] right-[48px] top-[132px] bottom-[96px] flex flex-col items-center text-center">
          <p
            className="uppercase mb-9"
            style={{
              fontFamily:
                "Arial Narrow, Avenir Next Condensed, Roboto Condensed, Helvetica Neue, sans-serif",
              fontSize: "8.5pt",
              lineHeight: 1.2,
              letterSpacing: "0.28em",
              color: "#19454B",
            }}
          >
            Breathtaking Awareness
          </p>

          <div className="w-[82px] h-[1px] bg-[#AF9355]/70 mb-12" />

          <h1
            className="text-center mb-8"
            style={{
              fontFamily: "var(--font-serif-primary)",
              fontSize: "46pt",
              lineHeight: 0.92,
              fontWeight: 700,
              letterSpacing: "-0.035em",
              color: "#021A2B",
            }}
          >
            Volume
            <br />I
          </h1>

          <div className="w-[172px] h-[2px] bg-[#AF9355]/80 mb-9" />

          <h2
            className="text-center"
            style={{
              fontFamily: "var(--font-serif-primary)",
              fontSize: "19pt",
              lineHeight: 1.1,
              fontWeight: 700,
              color: "#19454B",
            }}
          >
            The Words We Carry
          </h2>
        </div>

        {/* Right page fold shadow */}
        <div className="absolute right-0 top-0 bottom-0 w-[34px] pointer-events-none bg-gradient-to-l from-black/[0.055] to-transparent" />
      </div>
    );
  }

  if (isFrontOpenerPage) {
    return (
      <div className="h-[660px] w-[480px] bg-ivory overflow-hidden relative text-charcoal">
        <GrainOverlay />

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-[96px] bottom-[84px] h-[1px] w-[288px] bg-[#AF9355]/42" />
          <div className="absolute -right-[126px] top-[-104px] h-[260px] w-[260px] rounded-full border border-[#AF9355]/16" />
          <div className="absolute -left-[140px] bottom-[-128px] h-[280px] w-[280px] rounded-full border border-[#AF9355]/14" />
        </div>

        <div className="absolute left-[58px] right-[58px] top-[54px] bottom-[120px] flex flex-col items-center justify-center text-center">
          <div className="w-[210px] h-[2px] bg-[#AF9355]/70 mb-10" />

          <h1
            className="mb-8 text-center"
            style={{
              fontFamily: "var(--font-serif-primary)",
              fontSize: "42pt",
              lineHeight: 0.92,
              fontWeight: 700,
              letterSpacing: "-0.035em",
              color: "#021A2B",
            }}
          >
            Breathtaking
            <br />
            Awareness
          </h1>

          <div className="w-[168px] h-[2px] bg-[#AF9355] mb-8" />

          <h2
            className="mb-6 text-center"
            style={{
              fontFamily: "var(--font-serif-primary)",
              fontSize: "21pt",
              lineHeight: 1.08,
              fontWeight: 700,
              color: "#021A2B",
            }}
          >
            The Words We Carry
          </h2>

          <p
            className="uppercase mb-0 text-center"
            style={{
              fontFamily:
                "Arial Narrow, Avenir Next Condensed, Roboto Condensed, Helvetica Neue, sans-serif",
              fontSize: "13pt",
              lineHeight: 1.15,
              letterSpacing: "0.24em",
              color: "#5A5A5A",
            }}
          >
            Volume I
          </p>
        </div>

        <p
          className="absolute left-[48px] right-[48px] bottom-[38px] text-center uppercase"
          style={{
            fontFamily:
              "Arial Narrow, Avenir Next Condensed, Roboto Condensed, Helvetica Neue, sans-serif",
            fontSize: "7.25pt",
            lineHeight: 1.35,
            letterSpacing: "0.18em",
            color: "#AF9355",
          }}
        >
          Advocacy • Education • Reflection • Connection
        </p>

        <div className="absolute right-0 top-0 bottom-0 w-[34px] pointer-events-none bg-gradient-to-l from-black/[0.055] to-transparent" />
      </div>
    );
  }

  return (
    <div
      className={`h-[660px] w-[480px] bg-ivory overflow-hidden relative ${isGeneratedTitlePage ? "flex items-center" : ""}`}
      style={
        chapterDividerBlock || shareBlock
          ? {
              paddingLeft: "0px",
              paddingRight: "0px",
              paddingTop: "0px",
              paddingBottom: "0px",
            }
          : isMissionStatementPage || showWelcomeHeader
            ? {
                paddingLeft: "0px",
                paddingRight: "0px",
                paddingTop: "0px",
                paddingBottom,
              }
            : isStoryTextPage
              ? {
                  paddingLeft: articleStoryPaddingX,
                  paddingRight: articleStoryPaddingX,
                  paddingTop: articleStoryPaddingTop,
                  paddingBottom: articleStoryPaddingBottom,
                }
              : {
                  paddingLeft,
                  paddingRight,
                  paddingTop: isWelcomePage
                    ? "76px"
                    : isHowToUsePage
                      ? "92px"
                      : paddingTop,
                  paddingBottom: isWelcomePage
                    ? "120px"
                    : paddingBottom,
                }
      }
    >
      <style>
        {`
          @font-face {
            font-family: "Priestacy";
            src:
              url("/fonts/Priestacy.otf") format("opentype"),
              url("https://raw.githubusercontent.com/Joliel21/Magazine/main/public/fonts/Priestacy.otf") format("opentype");
            font-weight: 400;
            font-style: normal;
            font-display: swap;
          }
        `}
      </style>
      <GrainOverlay />
      <div
        className={`max-w-none text-charcoal flex flex-col h-full ${isGeneratedTitlePage ? "justify-center w-full" : ""}`}
      >
        {showWelcomeHeader && (
          <h1
            className="mb-3 text-left"
            style={{
              fontFamily: "var(--font-serif-primary)",
              fontSize: "30pt",
              lineHeight: 1.05,
              color: "#021A2B",
              fontWeight: 400,
              paddingTop: "82px",
              paddingLeft,
              paddingRight,
            }}
          >
            Welcome to Breathtaking Awareness
          </h1>
        )}

        {isWelcomePage && (
          <h1
            className="mb-7 text-left"
            style={{
              fontFamily: "var(--font-serif-primary)",
              fontSize: "20pt",
              lineHeight: 1.08,
              fontWeight: 400,
              color: "#021A2B",
            }}
          >
            Dear Reader,
          </h1>
        )}

        <div
          className={
            isMissionStatementPage || showWelcomeHeader
              ? "flex-1"
              : "contents"
          }
          style={
            isMissionStatementPage || showWelcomeHeader
              ? {
                  paddingLeft,
                  paddingRight,
                  paddingTop: isMissionStatementPage
                    ? "82px"
                    : "18px",
                }
              : undefined
          }
        >
          {chapterDividerBlock ? (
            <ChapterDividerBlock
              title={chapterDividerBlock.title}
              subtitle={chapterDividerBlock.subtitle}
              eyebrow={chapterDividerBlock.eyebrow}
            />
          ) : shareBlock ? (
            <EditorialShareBlock
              articleId={shareBlock.articleId}
              articleTitle={shareBlock.articleTitle}
              articleUrl={shareBlock.articleUrl}
              articleExcerpt={shareBlock.articleExcerpt}
              articleImage={shareBlock.articleImage}
              pageNumber={page.pageNumber}
            />
          ) : markdownBlock ? (
            <ReactMarkdown
              components={
                isGeneratedTitlePage
                  ? titlePageComponents
                  : storyComponents
              }
            >
              {markdownBlock.content}
            </ReactMarkdown>
          ) : (
            <p className="type-body">Loading article...</p>
          )}
        </div>
      </div>

      {isWelcomePage && (
        <p
          className="absolute right-[56px] bottom-[54px] text-right"
          style={{
            fontFamily: '"Priestacy", cursive',
            fontSize: "27pt",
            fontWeight: 400,
            fontStyle: "normal",
            letterSpacing: "0.01em",
            lineHeight: 1,
            color: "#021A2B",
            opacity: 0.88,
            textShadow: "none",
          }}
        >
          Jolie Lizana
        </p>
      )}
    </div>
  );
};

const BrandLogoArtwork = ({
  dark = false,
}: {
  dark?: boolean;
}) => (
  <div
    className="flex h-[86px] w-[86px] items-center justify-center rounded-full"
    style={{
      backgroundColor: dark
        ? "rgba(248,243,232,0.96)"
        : "rgba(255,255,255,0.82)",
      border: dark
        ? "1px solid rgba(175,147,85,0.62)"
        : "1px solid rgba(175,147,85,0.45)",
      boxShadow: dark
        ? "0 18px 42px rgba(0,0,0,0.28)"
        : "0 16px 38px rgba(2,26,43,0.12)",
    }}
  >
    <img
      src={brandLogo}
      alt="Breathtaking Awareness logo"
      className="h-[58px] w-[58px] object-contain"
      style={{ filter: dark ? "none" : "saturate(0.95)" }}
    />
  </div>
);

const CONTENTS_LOGO_DATA_URI =
  "data:image/png;base64,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";

const ContentsLineIcon = ({
  kind,
}: {
  kind: "pen" | "people" | "chat" | "light" | "logo";
}) => {
  const stroke = "#021A2B";

  if (kind === "logo") {
    return (
      <img
        src={CONTENTS_LOGO_DATA_URI}
        alt="Breathtaking Awareness logo"
        className="h-[38px] w-[38px] object-contain opacity-90"
      />
    );
  }

  if (kind === "pen") {
    return (
      <svg
        viewBox="0 0 36 36"
        className="h-[38px] w-[38px]"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M24.5 4.5c3 2.3 4.6 5.5 4.5 9.2-.2 6.3-5.9 11.5-14.7 16.8 1.3-8.7 3.9-16.4 10.2-26Z"
          stroke={stroke}
          strokeWidth="1.2"
        />
        <path
          d="M10 31c3.7-5.6 8.2-11.4 14.5-17.5"
          stroke={stroke}
          strokeWidth="1.1"
          strokeLinecap="round"
        />
        <path
          d="M19 10.5c2 1.1 3.8 2.7 5.2 4.7"
          stroke={stroke}
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (kind === "people") {
    return (
      <svg
        viewBox="0 0 36 36"
        className="h-[38px] w-[38px]"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="18"
          cy="11"
          r="4.2"
          stroke={stroke}
          strokeWidth="1.2"
        />
        <path
          d="M10.5 28c.9-5 3.6-8 7.5-8s6.6 3 7.5 8"
          stroke={stroke}
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <circle
          cx="8.5"
          cy="15.5"
          r="3"
          stroke={stroke}
          strokeWidth="1"
        />
        <path
          d="M3.6 27c.5-3.3 2.4-5.4 5.2-5.7"
          stroke={stroke}
          strokeWidth="1"
          strokeLinecap="round"
        />
        <circle
          cx="27.5"
          cy="15.5"
          r="3"
          stroke={stroke}
          strokeWidth="1"
        />
        <path
          d="M32.4 27c-.5-3.3-2.4-5.4-5.2-5.7"
          stroke={stroke}
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (kind === "chat") {
    return (
      <svg
        viewBox="0 0 36 36"
        className="h-[38px] w-[38px]"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M7 8.5h22a3 3 0 0 1 3 3v10.2a3 3 0 0 1-3 3H16.8L9 31v-6.3H7a3 3 0 0 1-3-3V11.5a3 3 0 0 1 3-3Z"
          stroke={stroke}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path
          d="M10.5 14.5h15M10.5 18.5h12M10.5 22.5h8"
          stroke={stroke}
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 36 36"
      className="h-[38px] w-[38px]"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M18 4v4M18 28v4M5 18h4M27 18h4M8.8 8.8l2.8 2.8M24.4 24.4l2.8 2.8M27.2 8.8l-2.8 2.8M11.6 24.4l-2.8 2.8"
        stroke={stroke}
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M13 20.5c-2.5-2.8-2.1-7.4 1.1-9.7 2.4-1.8 5.8-1.8 8.2 0 3.2 2.3 3.5 6.9 1 9.7-1.3 1.5-2.1 2.8-2.3 4.5h-6c-.1-1.7-.9-3-2-4.5Z"
        stroke={stroke}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M15 28h6"
        stroke={stroke}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
};

const contentsItems = [
  {
    page: "",
    title: "Beyond the Column",
    body: "Selected articles, features, and contributed pieces written beyond the regular column space.",
    icon: "people" as const,
  },
  {
    page: "",
    title: "The PHlip-side",
    body: "Columns and editorials on life with PH, advocacy, and healthcare experiences.",
    icon: "pen" as const,
  },
  {
    page: "",
    title: "Rants in Writing",
    body: "Raw, personal reflections on resilience, identity, and navigating chronic illness.",
    icon: "chat" as const,
  },
  {
    page: "",
    title: "Tips & Tricks",
    body: "Practical lessons and strategies from life, healthcare, and advocacy.",
    icon: "light" as const,
  },
  {
    page: "",
    title: "About the Author",
    body: "The story behind Breathtaking Awareness and Jolie Lizana's journey.",
    icon: "logo" as const,
    target: "back-cover" as const,
  },
];

export const WhatsInsideLeftPageLayout = ({
  page,
}: PageLayoutProps) => {
  return (
    <div className="h-[660px] w-[480px] relative overflow-hidden bg-[#021A2B] text-[#F8F3E8] select-none">
      <div
        className="absolute inset-0 opacity-95"
        style={{
          background:
            "radial-gradient(circle at 82% 16%, rgba(43,155,192,0.2), transparent 34%), radial-gradient(circle at 15% 86%, rgba(175,147,85,0.12), transparent 38%), linear-gradient(180deg, #01101C 0%, #021A2B 46%, #01101C 100%)",
        }}
      />

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-[136px] bottom-[-122px] h-[310px] w-[310px] rounded-full border border-[#AF9355]/14" />
        <div className="absolute -right-[132px] top-[-110px] h-[288px] w-[288px] rounded-full border border-[#2B9BC0]/18" />
        <div className="absolute left-[58px] top-[74px] h-[1px] w-[136px] bg-[#AF9355]/62" />
        <div className="absolute left-[58px] top-[74px] h-[108px] w-[1px] bg-[#AF9355]/45" />
        <div className="absolute right-[64px] bottom-[86px] h-[1px] w-[116px] bg-[#AF9355]/42" />
      </div>

      <div className="absolute left-[58px] top-[198px] text-left">
        <h1
          style={{
            fontFamily: "var(--font-serif-primary)",
            fontSize: "58pt",
            lineHeight: 0.86,
            fontWeight: 700,
            letterSpacing: "-0.025em",
            color: "#AF9355",
            textShadow: "0 3px 14px rgba(0,0,0,0.44)",
          }}
        >
          What&apos;s
          <br />
          Inside
        </h1>
        <div className="mt-8 h-[2px] w-[136px] bg-[#AF9355]/80" />
      </div>

      <div className="absolute right-0 top-0 bottom-0 w-[38px] pointer-events-none bg-gradient-to-l from-black/[0.2] to-transparent" />
    </div>
  );
};

export const WhatsInsideRightPageLayout = ({
  page,
  onNavigate,
  blocks,
}: PageLayoutProps) => {
  const pageOverrides = new Map<string, string>();

  blocks?.forEach((block) => {
    if (block.type === "toc-entry") {
      pageOverrides.set(block.title, block.pageNumber);
    }
  });

  const getTargetPage = (
    item: (typeof contentsItems)[number],
  ) => {
    if ("target" in item && item.target === "back-cover") {
      return "back-cover" as const;
    }

    const pageValue =
      pageOverrides.get(item.title) || item.page;
    const pageNumber = Number.parseInt(pageValue, 10);
    return Number.isFinite(pageNumber) ? pageNumber : null;
  };

  const formatPage = (item: (typeof contentsItems)[number]) => {
    if ("target" in item && item.target === "back-cover") {
      return "";
    }

    const pageValue =
      pageOverrides.get(item.title) || item.page;
    const pageNumber = Number.parseInt(pageValue, 10);
    if (!Number.isFinite(pageNumber)) return pageValue;
    return String(pageNumber).padStart(2, "0");
  };

  return (
    <div className="h-[660px] w-[480px] relative overflow-hidden bg-ivory text-charcoal select-none">
      <GrainOverlay />

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -right-[122px] top-[-112px] h-[288px] w-[288px] rounded-full border border-[#19454B]/10" />
        <div className="absolute left-[54px] top-[60px] h-[1px] w-[128px] bg-[#AF9355]/45" />
        <div className="absolute right-[56px] bottom-[76px] h-[96px] w-[1px] bg-[#AF9355]/32" />
        <div className="absolute right-[56px] bottom-[76px] h-[1px] w-[124px] bg-[#AF9355]/32" />
      </div>

      <div className="absolute left-[56px] right-[44px] top-[78px] bottom-[72px]">
        <div className="flex h-full flex-col justify-between">
          {contentsItems.map((item) => {
            const targetPage = getTargetPage(item);
            const isLinked = Boolean(onNavigate && targetPage);

            const content = (
              <>
                <div
                  className="text-right"
                  style={{
                    fontFamily: "var(--font-serif-primary)",
                    fontSize: "20pt",
                    lineHeight: 1,
                    fontWeight: 700,
                    color: "#021A2B",
                  }}
                >
                  {formatPage(item)}
                </div>

                <div className="flex justify-center pt-[2px]">
                  <ContentsLineIcon kind={item.icon} />
                </div>

                <div className="pt-[1px] text-left">
                  <h2
                    className="inline-block border-b border-[#2B9BC0]/80 pb-[2px]"
                    style={{
                      fontFamily: "var(--font-serif-primary)",
                      fontSize: "14pt",
                      lineHeight: 1.04,
                      fontWeight: 700,
                      color: "#021A2B",
                    }}
                  >
                    {item.title}
                  </h2>
                  <p
                    className="mt-[4px]"
                    style={{
                      fontFamily: "var(--font-serif-secondary)",
                      fontSize: "8.6pt",
                      lineHeight: 1.28,
                      color: "#3F3F3F",
                    }}
                  >
                    {item.body}
                  </p>
                </div>
              </>
            );

            if (!isLinked || !targetPage) {
              return (
                <div
                  key={item.title}
                  className="grid grid-cols-[48px_48px_1fr] items-start gap-4"
                >
                  {content}
                </div>
              );
            }

            return (
              <button
                key={item.title}
                type="button"
                onClick={() => onNavigate?.(targetPage)}
                className="grid grid-cols-[48px_48px_1fr] items-start gap-4 text-left cursor-pointer transition-opacity hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-[#AF9355]/45 focus:ring-offset-2 focus:ring-offset-ivory"
                aria-label={
                  targetPage === "back-cover"
                    ? `Go to ${item.title} on the back cover`
                    : `Go to ${item.title}, page ${formatPage(item)}`
                }
                title={
                  targetPage === "back-cover"
                    ? `${item.title} on the back cover`
                    : `Go to ${item.title}`
                }
              >
                {content}
              </button>
            );
          })}
        </div>
      </div>

      <div className="absolute left-0 top-0 bottom-0 w-[34px] pointer-events-none bg-gradient-to-r from-black/[0.05] to-transparent" />
    </div>
  );
};

const BREATHTAKING_AWARENESS_AD = {
  eyebrow: "Breathtaking Awareness",
  headline: "Advocate. Save a Life.",
  subheadline: "Sign up for the Monthly Newsletter or Meetings",
  signupLabel: "Sign-up",
  signupUrl: "https://breathtakingawareness.com/sign-up/",
  footer: "Education • Advocacy • Support • Storytelling",
};

export const BreathtakingAwarenessAdLayout = ({
  page,
}: PageLayoutProps) => {
  const isRightPage = page.pageNumber % 2 !== 0;
  const edgePadding = isRightPage
    ? { paddingLeft: "58px", paddingRight: "46px" }
    : { paddingLeft: "46px", paddingRight: "58px" };

  return (
    <div className="relative h-[660px] w-[480px] overflow-hidden bg-[#021A2B] text-[#F8F3E8] select-none">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 82% 18%, rgba(43,155,192,0.23), transparent 31%), radial-gradient(circle at 16% 78%, rgba(201,164,92,0.18), transparent 34%), linear-gradient(160deg, #01101C 0%, #021A2B 52%, #082B3A 100%)",
        }}
      />

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-[36px] top-[36px] right-[36px] bottom-[36px] border border-[#C9A45C]/35" />
        <div className="absolute left-[54px] top-[58px] h-[1px] w-[130px] bg-[#C9A45C]/70" />
        <div className="absolute right-[54px] top-[84px] h-[1px] w-[88px] bg-[#2B9BC0]/70" />
        <div className="absolute -right-[118px] top-[-110px] h-[290px] w-[290px] rounded-full border border-[#2B9BC0]/22" />
        <div className="absolute -left-[134px] bottom-[-128px] h-[316px] w-[316px] rounded-full border border-[#C9A45C]/18" />
        <div className="absolute bottom-[86px] right-[-42px] h-[1px] w-[252px] rotate-[-32deg] bg-[#C9A45C]/55" />
      </div>

      <div
        className="relative z-10 flex h-full flex-col justify-between py-[58px]"
        style={edgePadding}
      >
        <div>
          <p
            className="uppercase mb-8"
            style={{
              fontFamily:
                "Inter, Avenir Next, Helvetica Neue, Arial, sans-serif",
              fontSize: "9pt",
              lineHeight: 1.2,
              letterSpacing: "0.28em",
              color: "#C9A45C",
            }}
          >
            {BREATHTAKING_AWARENESS_AD.eyebrow}
          </p>

          <h1
            className="mb-7"
            style={{
              fontFamily: "var(--font-serif-primary)",
              fontSize: "43pt",
              lineHeight: 0.9,
              fontWeight: 700,
              letterSpacing: "-0.035em",
              color: "#F8F3E8",
            }}
          >
            {BREATHTAKING_AWARENESS_AD.headline}
          </h1>

          <div className="h-[2px] w-[136px] bg-[#2B9BC0] mb-7" />

          <p
            className="max-w-[350px] mb-7"
            style={{
              fontFamily:
                "Inter, Avenir Next, Helvetica Neue, Arial, sans-serif",
              fontSize: "17pt",
              lineHeight: 1.24,
              fontWeight: 300,
              color: "#F3E8D3",
            }}
          >
            {BREATHTAKING_AWARENESS_AD.subheadline}
          </p>
        </div>

        <div>
          <a
            href={BREATHTAKING_AWARENESS_AD.signupUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-full border border-[#2B9BC0]/85 bg-[#2B9BC0]/20 px-8 py-4 uppercase no-underline transition-opacity hover:opacity-85 focus:outline-none focus:ring-2 focus:ring-[#C9A45C]/70"
            style={{
              fontFamily:
                "Inter, Avenir Next, Helvetica Neue, Arial, sans-serif",
              fontSize: "13pt",
              letterSpacing: "0.16em",
              fontWeight: 700,
              color: "#F8F3E8",
            }}
          >
            {BREATHTAKING_AWARENESS_AD.signupLabel}
          </a>

          <p
            className="mt-5 uppercase"
            style={{
              fontFamily:
                "Inter, Avenir Next, Helvetica Neue, Arial, sans-serif",
              fontSize: "7.5pt",
              lineHeight: 1.2,
              letterSpacing: "0.18em",
              color: "rgba(201,164,92,0.9)",
            }}
          >
            {BREATHTAKING_AWARENESS_AD.footer}
          </p>
        </div>
      </div>
    </div>
  );
};

export const LAYOUT_REGISTRY: Record<
  string,
  React.ComponentType<PageLayoutProps>
> = {
  "article-image-layout": ArticleImageLayout,
  "article-title-layout": ArticleTitleLayout,
  "article-text-layout": ArticleTextLayout,
  "breathtaking-awareness-ad": BreathtakingAwarenessAdLayout,
  "article-layout": ArticleLayout,
  "inside-cover": InsideCoverLayout,
  "page-1": Page1Layout,
  "whats-inside-left-page": WhatsInsideLeftPageLayout,
  "whats-inside-right-page": WhatsInsideRightPageLayout,
  "volume-one-page": ArticleTextLayout,
  "section-divider": SectionDividerLayout,
  "christina-feature": ChristinaFeatureLayout,
};