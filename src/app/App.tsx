import { useState, useEffect, useRef, useMemo } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { PlaceMagazineAnimation } from "@/app/components/PlaceMagazineAnimation";
import { FirstOpenAnimation } from "@/app/components/FirstOpenAnimation";
import { ReadingView } from "@/app/components/ReadingView";
import { TopBar } from "@/app/components/TopBar";
import { LeftPanel } from "@/app/components/LeftPanel";
import type { SearchEntry } from "@/app/components/SearchPanel";
import { ClosedCover } from "@/app/components/ClosedCover";
import { ClosedBackCover } from "@/app/components/ClosedBackCover";
import type { MusicTrack } from "@/app/components/MusicControl";
import type {
  MagazinePage,
  TOCEntry,
  MagazineData,
} from "@/app/data/magazine-data";
import {
  FALLBACK_MAGAZINE_DATA,
  FALLBACK_MANIFEST,
  type PublishManifest,
} from "@/app/data/fallback-data";
import {
  getArticlesUrl,
  getChaptersUrl,
  getDataUrl,
  getMagazineUrl,
  resolvePublicUrl,
} from "@/app/config/data-source";
import {
  contentMap as initialContentMap,
  ContentBlock,
} from "@/app/components/MagazinePageLayouts";

const ARTICLES_URL = getArticlesUrl();
const CHAPTERS_URL = getChaptersUrl();

const BOOKMARKS_STORAGE_KEY =
  "breathtaking-awareness-magazine-reader-bookmarks";

const ARTICLE_IMAGE_OVERRIDES: Record<string, string> = {
  "since-my-pulmonary-hypertension-diagnosis-im-tragically-blessed":
    "public/images/articles/phlip-side/blessed.png",
  "i-learn-a-hard-lesson-about-traveling-with-pulmonary-hypertension":
    "public/images/articles/phlip-side/learned-a-hard-lesson-share.jpg",
  "how-to-explain-the-complexities-of-pulmonary-hypertension-to-others":
    "public/images/articles/phlip-side/How-to-explain.jpg",
  "sticky-bras-are-good-for-the-heart":
    "public/images/articles/phlip-side/Nippies.png",
  "how-flashing-the-boobs-is-helping-to-save-womens-lives":
    "public/images/articles/phlip-side/Jolie-Flash-the-boobs.png",
  "a-ph-advocate-finds-hope-in-new-research-anxiety-at-the-airport":
    "public/images/articles/phlip-side/Symposium.jpg",
  "the-weight-of-staying-well":
    "https://raw.githubusercontent.com/Joliel21/Magazine/main/public/images/articles/scleroderma-foundation-of-greater-chicago/the_weight_of_staying_well_8x11_5.jpg",
  the_weight_of_staying_well:
    "https://raw.githubusercontent.com/Joliel21/Magazine/main/public/images/articles/scleroderma-foundation-of-greater-chicago/the_weight_of_staying_well_8x11_5.jpg",
  "the-weight-of-staying-well-in-contributions-in-writing":
    "https://raw.githubusercontent.com/Joliel21/Magazine/main/public/images/articles/scleroderma-foundation-of-greater-chicago/the_weight_of_staying_well_8x11_5.jpg",
  "the-weight-of-staying-well-scleroderma-foundation-of-greater-chicago":
    "https://raw.githubusercontent.com/Joliel21/Magazine/main/public/images/articles/scleroderma-foundation-of-greater-chicago/the_weight_of_staying_well_8x11_5.jpg",
  "weight-of-staying-well":
    "https://raw.githubusercontent.com/Joliel21/Magazine/main/public/images/articles/scleroderma-foundation-of-greater-chicago/the_weight_of_staying_well_8x11_5.jpg",
  "the-weight-of-staying-well-when-survival-mode-stops-being-sustainable":
    "https://raw.githubusercontent.com/Joliel21/Magazine/main/public/images/articles/scleroderma-foundation-of-greater-chicago/the_weight_of_staying_well_8x11_5.jpg",
  "the-weight-of-staying-well-when-survival-mode-stops-being-sustainable-courtesy-of-jolie-lizana":
    "https://raw.githubusercontent.com/Joliel21/Magazine/main/public/images/articles/scleroderma-foundation-of-greater-chicago/the_weight_of_staying_well_8x11_5.jpg",
};

const ARTICLE_EXTRA_IMAGE_OVERRIDES: Record<string, string[]> =
  {};

const ARTICLE_IMAGE_SUPPRESSIONS = new Set([
  "the-weight-of-staying-well",
  "the-weight-of-staying-well-in-contributions-in-writing",
  "the-weight-of-staying-well-scleroderma-foundation-of-greater-chicago",
  "weight-of-staying-well",
  "the-weight-of-staying-well-when-survival-mode-stops-being-sustainable",
  "the-weight-of-staying-well-when-survival-mode-stops-being-sustainable-courtesy-of-jolie-lizana",
  "the-weight-of-staying-well-courtesy-of-jolie-lizana",
  "the-weight-of-staying-well-when-survival-mode-stops-being-sustainable-courtesy-of-jolie-lizana",
]);

const normalizeArticleKey = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const PUBLIC_MAGAZINE_URL = getMagazineUrl();

const PAGE_STACK_OUTSIDE_WIDTH = 64;

const getPublicArticleShareUrl = (
  articleId: string | number,
) => {
  const safeArticleId = normalizeArticleKey(
    String(articleId || ""),
  );

  if (!safeArticleId) {
    return PUBLIC_MAGAZINE_URL;
  }

  return new URL(
    `share/${encodeURIComponent(safeArticleId)}/`,
    PUBLIC_MAGAZINE_URL,
  ).toString();
};

const ARTICLE_DATE_OVERRIDES: Record<string, string> = {
  [normalizeArticleKey(
    "Since my pulmonary hypertension diagnosis, I’m tragically blessed",
  )]: "July 11, 2025",
  [normalizeArticleKey(
    "My delayed PH diagnosis reveals a lesson in claiming victory over loss",
  )]: "July 25, 2025",
  [normalizeArticleKey(
    "The Pandora’s box of making plans and managing friendships with PH",
  )]: "August 1, 2025",
  [normalizeArticleKey(
    "Why a day of rest is a victory with pulmonary hypertension",
  )]: "August 15, 2025",
  [normalizeArticleKey(
    "Getting through the fog of grief to see clearly on the other side",
  )]: "October 3, 2025",
  [normalizeArticleKey("Sticky bras are good for the heart")]:
    "September 12, 2025",
  [normalizeArticleKey(
    "How to explain the complexities of pulmonary hypertension to others",
  )]: "January 30, 2026",
  [normalizeArticleKey(
    "A PH advocate finds hope in new research, anxiety at the airport",
  )]: "September 26, 2025",
  [normalizeArticleKey(
    "How “flashing the boobs” is helping to save women’s lives",
  )]: "September 5, 2025",
};

type AppState =
  | "loading"
  | "closed-cover"
  | "closed-back"
  | "first-open"
  | "reading";
type PanelType = "toc" | "thumbnails" | null;

function App() {
  const [appState, setAppState] = useState<AppState>("loading");
  const [currentPage, setCurrentPage] = useState<
    number | "cover"
  >("cover");
  const [bookmarkedPages, setBookmarkedPages] = useState<
    number[]
  >([]);
  const [openPanel, setOpenPanel] = useState<PanelType>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showBranding, setShowBranding] = useState(true);
  const [tiltAngle, setTiltAngle] = useState(0);
  const [isSinglePageMode, setIsSinglePageMode] =
    useState(false);

  const [magazineData, setMagazineData] = useState<
    MagazinePage[]
  >(FALLBACK_MAGAZINE_DATA.pages);
  const [tocData, setTocData] = useState<TOCEntry[]>(
    FALLBACK_MAGAZINE_DATA.toc,
  );
  const [viewerData, setViewerData] =
    useState<MagazineData | null>(FALLBACK_MAGAZINE_DATA);
  const [manifest, setManifest] =
    useState<PublishManifest | null>(FALLBACK_MANIFEST);
  const [isDataLoaded, setIsDataLoaded] = useState(true);
  const [isPageLocked, setIsPageLocked] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isBackgroundLoaded, setIsBackgroundLoaded] =
    useState(false);
  const [showIntroAnimation, setShowIntroAnimation] =
    useState(false);
  const [hasCompletedFirstOpen, setHasCompletedFirstOpen] =
    useState(false);

  const [magazineSize] = useState({ width: 480, height: 660 });
  const [layoutScale, setLayoutScale] = useState(1);
  const isDesktop =
    typeof window !== "undefined"
      ? window.innerWidth >= 768
      : true;

  // Any visible magazine turn must start from one full page, not a two-page spread.
  // This keeps the first 45-degree turn from rendering as a spread, and it keeps
  // the 90-degree sideways view from clipping inside an upright page box.
  const isMagazineTurn = tiltAngle !== 0;
  const effectiveSinglePageMode =
    isSinglePageMode || isMagazineTurn;

  // Layout State & History
  const [layoutState, setLayoutState] = useState<
    Record<string, { blocks: ContentBlock[] }>
  >(() => {
    // Initialize with IDs to avoid key warnings
    const initialized: any = {};
    if (initialContentMap) {
      Object.entries(initialContentMap).forEach(
        ([key, value]) => {
          initialized[key] = {
            ...value,
            blocks: value.blocks
              ? value.blocks.map((b, i) => ({
                  ...b,
                  _id:
                    b._id ||
                    `block-${key}-${i}-${Math.random().toString(36).substr(2, 9)}`,
                }))
              : [],
          };
        },
      );
    }
    return initialized;
  });

  // History now stores the state AND the page that was modified
  const [history, setHistory] = useState<
    {
      state: Record<string, { blocks: ContentBlock[] }>;
      pageId: string;
    }[]
  >([]);
  const [future, setFuture] = useState<
    {
      state: Record<string, { blocks: ContentBlock[] }>;
      pageId: string;
    }[]
  >([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const storedBookmarks = window.localStorage.getItem(
        BOOKMARKS_STORAGE_KEY,
      );

      if (!storedBookmarks) return;

      const parsedBookmarks = JSON.parse(storedBookmarks);

      if (Array.isArray(parsedBookmarks)) {
        setBookmarkedPages(
          parsedBookmarks
            .map((page) => Number(page))
            .filter(
              (page) =>
                Number.isInteger(page) &&
                page >= 0 &&
                page <= 10000,
            ),
        );
      }
    } catch (err) {
      console.warn("Could not load magazine bookmarks:", err);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(
        BOOKMARKS_STORAGE_KEY,
        JSON.stringify(bookmarkedPages),
      );
    } catch (err) {
      console.warn("Could not save magazine bookmarks:", err);
    }
  }, [bookmarkedPages]);

  const getPageNumberFromId = (id: string): number | null => {
    const page = magazineData.find((p) => p.id === id);
    return page ? page.pageNumber : null;
  };

  const handleUpdateLayout = (
    pageId: string,
    newBlocks: ContentBlock[],
  ) => {
    // Save to history (limit to 10)
    setHistory((prev) => {
      const newHistory = [
        ...prev,
        { state: layoutState, pageId },
      ];
      return newHistory.slice(-10);
    });
    setFuture([]); // Clear redo stack

    setLayoutState((prev) => {
      // Handle both ID formats: 'christina-5' or '5' or internal ID
      // The pageId passed from ReadingView comes from page.id which matches keys in contentMap
      return {
        ...prev,
        [pageId]: { ...prev[pageId], blocks: newBlocks },
      };
    });
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previousEntry = history[history.length - 1];
    const { state: previousState, pageId } = previousEntry;

    // Check if we need to navigate
    const targetPageNumber = getPageNumberFromId(pageId);

    // If target page is valid and we are NOT on that page
    if (targetPageNumber && currentPage !== targetPageNumber) {
      // Ask for verification
      if (
        window.confirm(
          `Undo change on Page ${targetPageNumber}?`,
        )
      ) {
        setCurrentPage(targetPageNumber);
        setAppState("reading");
      } else {
        return; // Cancel undo
      }
    }

    const newHistory = history.slice(0, -1);

    // Push current state to future with the SAME pageId (since this is the page being reverted)
    setFuture((prev) => [
      { state: layoutState, pageId },
      ...prev,
    ]);
    setHistory(newHistory);
    setLayoutState(previousState);
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const nextEntry = future[0];
    const { state: nextState, pageId } = nextEntry;

    // Check if we need to navigate
    const targetPageNumber = getPageNumberFromId(pageId);

    if (targetPageNumber && currentPage !== targetPageNumber) {
      if (
        window.confirm(
          `Redo change on Page ${targetPageNumber}?`,
        )
      ) {
        setCurrentPage(targetPageNumber);
        setAppState("reading");
      } else {
        return;
      }
    }

    const newFuture = future.slice(1);

    setHistory((prev) => {
      const newHistory = [
        ...prev,
        { state: layoutState, pageId },
      ];
      return newHistory.slice(-10);
    });
    setFuture(newFuture);
    setLayoutState(nextState);
  };

  const handleResetPage = (pageId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to reset this page to its default layout?",
      )
    )
      return;

    // Save current state to history before resetting
    setHistory((prev) => {
      const newHistory = [
        ...prev,
        { state: layoutState, pageId },
      ];
      return newHistory.slice(-10);
    });
    setFuture([]);

    setLayoutState((prev) => {
      // Reset to initial state from contentMap
      const initialPageData = initialContentMap[pageId];
      if (!initialPageData) return prev; // Should not happen if data is consistent

      // Re-initialize blocks with fresh IDs to ensure clean state
      const resetBlocks = initialPageData.blocks
        ? initialPageData.blocks.map((b, i) => ({
            ...b,
            _id:
              b._id ||
              `block-${pageId}-${i}-${Math.random().toString(36).substr(2, 9)}`,
          }))
        : [];

      return {
        ...prev,
        [pageId]: { ...prev[pageId], blocks: resetBlocks },
      };
    });
  };

  const handleResetBoth = (leftId: string, rightId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to reset BOTH pages to their default layouts?",
      )
    )
      return;

    // Save history (we mark pageId as 'both' or just the first one? History struct expects pageId.
    // Let's just say 'spread' or leftId for now, layoutState captures all.)
    setHistory((prev) => {
      const newHistory = [
        ...prev,
        { state: layoutState, pageId: `${leftId}+${rightId}` },
      ];
      return newHistory.slice(-10);
    });
    setFuture([]);

    setLayoutState((prev) => {
      const newState = { ...prev };

      [leftId, rightId].forEach((pid) => {
        const initialPageData = initialContentMap[pid];
        if (initialPageData) {
          const resetBlocks = initialPageData.blocks
            ? initialPageData.blocks.map((b, i) => ({
                ...b,
                _id:
                  b._id ||
                  `block-${pid}-${i}-${Math.random().toString(36).substr(2, 9)}`,
              }))
            : [];

          newState[pid] = {
            ...newState[pid],
            blocks: resetBlocks,
          };
        }
      });

      return newState;
    });
  };

  // Calculate current visible pages for Reset buttons
  let leftPageId: string | null = null;
  let rightPageId: string | null = null;

  if (appState === "reading" && currentPage !== "cover") {
    if (isDesktop && !effectiveSinglePageMode) {
      const pageNum = currentPage as number;
      const isEven = pageNum % 2 === 0;
      const leftNum = isEven ? pageNum : pageNum - 1;
      const rightNum = leftNum + 1;

      const leftPage = magazineData.find(
        (p) => p.pageNumber === leftNum,
      );
      const rightPage = magazineData.find(
        (p) => p.pageNumber === rightNum,
      );

      if (leftPage) leftPageId = leftPage.id;
      if (rightPage) rightPageId = rightPage.id;
    } else {
      // Single page mode
      const page = magazineData.find(
        (p) => p.pageNumber === currentPage,
      );
      if (page) leftPageId = page.id; // Treat single page as "left" (primary) for simplicity or handle specifically
    }
  }

  const handleSave = () => {
    // In a real app, this would save to Supabase
    alert("Layout changes saved (in-memory)!");
  };

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isDesktop = width >= 768;

      const BASE_WIDTH = 480;
      const BASE_HEIGHT = 660;

      // Calculate available space
      // Leave space for UI and margins
      const horizontalMargin = isDesktop ? 60 : 20;
      const verticalMargin = isDesktop ? 140 : 100;

      const availableWidth = width - horizontalMargin;
      const availableHeight = height - verticalMargin;

      // Determine target layout dimensions based on view mode.
      // During any visible turn, render one page and fit the rotated page's
      // bounding box.
      const isTurn = tiltAngle !== 0;
      const isSpread =
        isDesktop && !isSinglePageMode && !isTurn;

      let targetWidth, targetHeight;

      if (isTurn) {
        const radians = (Math.abs(tiltAngle) * Math.PI) / 180;
        targetWidth =
          Math.abs(Math.cos(radians)) * BASE_WIDTH +
          Math.abs(Math.sin(radians)) * BASE_HEIGHT;
        targetHeight =
          Math.abs(Math.sin(radians)) * BASE_WIDTH +
          Math.abs(Math.cos(radians)) * BASE_HEIGHT;
      } else {
        targetWidth = isSpread ? BASE_WIDTH * 2 : BASE_WIDTH;
        targetHeight = BASE_HEIGHT;
      }

      // Calculate scale to fit
      const scaleX = availableWidth / targetWidth;
      const scaleY = availableHeight / targetHeight;

      let newScale;

      // Calculate layout scale
      if (isSpread || isTurn) {
        // Spreads and turned pages must fit fully on screen.
        newScale = Math.min(scaleX, scaleY);
      } else {
        // Standard single-page view: prioritize width fit and allow height scroll.
        newScale = Math.min(scaleX, 1.5);
      }

      // Global cap for all modes
      newScale = Math.min(newScale, 1.5);

      setLayoutScale(newScale);
    };

    handleResize(); // Initial calculation
    window.addEventListener("resize", handleResize);
    return () =>
      window.removeEventListener("resize", handleResize);
  }, [isSinglePageMode, tiltAngle]);

  const [musicLibrary, setMusicLibrary] = useState<
    MusicTrack[]
  >([]);
  const [selectedTrackId, setSelectedTrackId] = useState<
    string | null
  >(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [isRepeatingCurrentTrack, setIsRepeatingCurrentTrack] =
    useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastPlayedTrackIdRef = useRef<string | null>(null);

  const handlePlaceMagazineComplete = () => {
    setAppState("closed-cover");
  };

  const handleOpenMagazine = () => {
    if (hasCompletedFirstOpen) {
      setAppState("reading");
      setCurrentPage(1);
      return;
    }

    setAppState("first-open");
    setCurrentPage("cover");
  };

  const handleFirstOpenComplete = () => {
    setHasCompletedFirstOpen(true);
    setAppState("reading");
    setCurrentPage(1);
  };

  const handleBackToCover = () => {
    setAppState("closed-cover");
    setCurrentPage("cover");
    setOpenPanel(null);
  };

  const handlePrevious = () => {
    if (currentPage === "cover") return;

    const isDesktop = window.innerWidth >= 768;
    const isSpread = isDesktop && !effectiveSinglePageMode;

    if (isSpread) {
      if (currentPage <= 1) {
        setAppState("closed-cover");
        setCurrentPage("cover");
        setOpenPanel(null);
      } else {
        setCurrentPage(Math.max(1, currentPage - 2));
      }
    } else {
      if (currentPage <= 0) {
        setAppState("closed-cover");
        setCurrentPage("cover");
        setOpenPanel(null);
      } else {
        setCurrentPage(currentPage - 1);
      }
    }
  };

  const handleNext = () => {
    if (currentPage === "cover") return;

    const isDesktop = window.innerWidth >= 768;
    const isSpread = isDesktop && !effectiveSinglePageMode;
    const totalPages = magazineData.length;

    if (isSpread) {
      if (currentPage >= totalPages - 2) {
        setAppState("closed-back");
        setCurrentPage("cover");
        setOpenPanel(null);
      } else {
        setCurrentPage(currentPage + 2);
      }
    } else {
      if (currentPage >= totalPages - 1) {
        setAppState("closed-back");
        setCurrentPage("cover");
        setOpenPanel(null);
      } else {
        setCurrentPage(currentPage + 1);
      }
    }
  };

  const handlePageJump = (page: number | "back-cover") => {
    if (page === "back-cover") {
      setAppState("closed-back");
      setCurrentPage("cover");
      setOpenPanel(null);
      return;
    }

    setCurrentPage(page);
    setAppState("reading");
  };

  const currentBookmarkPage =
    currentPage === "cover" ? null : currentPage;

  const isCurrentPageBookmarked =
    currentBookmarkPage !== null &&
    bookmarkedPages.includes(currentBookmarkPage);

  const handleToggleBookmark = () => {
    if (currentBookmarkPage === null) return;

    setBookmarkedPages((currentBookmarks) => {
      const nextBookmarks = new Set(currentBookmarks);

      if (nextBookmarks.has(currentBookmarkPage)) {
        nextBookmarks.delete(currentBookmarkPage);
      } else {
        nextBookmarks.add(currentBookmarkPage);
      }

      return Array.from(nextBookmarks).sort((a, b) => a - b);
    });
  };

  const handleGoToBookmark = (page: number) => {
    handlePageJump(page);
    setOpenPanel(null);
  };

  const handleClearBookmarks = () => {
    setBookmarkedPages([]);
  };

  const getSharedArticleIdFromUrl = () => {
    if (typeof window === "undefined") return "";

    const params = new URLSearchParams(window.location.search);
    return params.get("article") || "";
  };

  const findArticleTitlePageNumber = (
    pages: MagazinePage[],
    sharedArticleId: string,
  ) => {
    const normalizedSharedArticleId =
      normalizeArticleKey(sharedArticleId);

    if (!normalizedSharedArticleId) return null;

    const targetPage = pages.find((page) => {
      if (!page.id.startsWith("article-")) return false;
      if (!page.id.endsWith("-title")) return false;

      const rawArticleId = page.id
        .replace(/^article-/, "")
        .replace(/-title$/, "");

      return (
        normalizeArticleKey(rawArticleId) ===
        normalizedSharedArticleId
      );
    });

    return targetPage?.pageNumber || null;
  };

  const openSharedArticleIfPresent = (
    pages: MagazinePage[],
  ) => {
    const sharedArticleId = getSharedArticleIdFromUrl();
    if (!sharedArticleId) return false;

    const pageNumber = findArticleTitlePageNumber(
      pages,
      sharedArticleId,
    );

    if (!pageNumber) return false;

    setCurrentPage(pageNumber);
    setAppState("reading");
    setOpenPanel(null);
    return true;
  };

  useEffect(() => {
    if (currentPage === "cover") return;

    const isDesktop = window.innerWidth >= 768;
    let announcement = "";

    if (isDesktop && !effectiveSinglePageMode) {
      const pageNum = currentPage as number;
      const isEven = pageNum % 2 === 0;
      const leftNum = isEven ? pageNum : pageNum - 1;
      const rightNum = leftNum + 1;

      if (leftNum > 0 && rightNum <= magazineData.length) {
        announcement = `Pages ${leftNum} to ${rightNum} of ${magazineData.length}`;
      } else if (leftNum > 0) {
        announcement = `Page ${leftNum} of ${magazineData.length}`;
      } else {
        announcement = `Page ${rightNum} of ${magazineData.length}`;
      }
    } else {
      announcement = `Page ${currentPage} of ${magazineData.length}`;
    }

    const announcer = document.createElement("div");
    announcer.setAttribute("role", "status");
    announcer.setAttribute("aria-live", "polite");
    announcer.setAttribute("aria-atomic", "true");
    announcer.className = "sr-only";
    announcer.textContent = announcement;
    document.body.appendChild(announcer);

    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  }, [currentPage, magazineData.length]);

  const handleToggleTOC = () => {
    setOpenPanel((prev) => (prev === "toc" ? null : "toc"));
  };

  const handleToggleThumbnails = () => {
    setOpenPanel((prev) =>
      prev === "thumbnails" ? null : "thumbnails",
    );
  };

  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
  };

  const canGoPrevious = currentPage !== "cover";
  const canGoNext = currentPage !== "cover";

  const stringifySearchValue = (value: unknown): string => {
    if (value == null || typeof value === "boolean") return "";
    if (
      typeof value === "string" ||
      typeof value === "number"
    ) {
      return String(value);
    }
    if (Array.isArray(value)) {
      return value
        .map(stringifySearchValue)
        .filter(Boolean)
        .join(" ");
    }
    if (typeof value === "object") {
      const maybeReactNode = value as {
        props?: { children?: unknown };
        title?: unknown;
        content?: unknown;
        text?: unknown;
        alt?: unknown;
        question?: unknown;
        answer?: unknown;
      };

      return [
        maybeReactNode.props?.children,
        maybeReactNode.title,
        maybeReactNode.content,
        maybeReactNode.text,
        maybeReactNode.alt,
        maybeReactNode.question,
        maybeReactNode.answer,
      ]
        .map(stringifySearchValue)
        .filter(Boolean)
        .join(" ");
    }

    return "";
  };

  const generatedTOC = useMemo(() => {
    // Check if current TOC is just the fallback default
    const isFallback =
      tocData.length === 1 &&
      tocData[0].title === "Navigating the Unpredictable";

    // If we have explicit custom TOC entries (more than fallback or different), use them
    if (!isFallback && tocData.length > 0) {
      return tocData.map((entry) => ({
        ...entry,
        level: entry.level ?? 0,
      }));
    }

    // Otherwise, generate dynamic TOC from content
    const entries: TOCEntry[] = [];

    magazineData.forEach((page) => {
      const pageState = layoutState[page.id];
      if (!pageState) return;

      // 1. Page Title (Main Headline)
      if (pageState.title) {
        entries.push({
          id: `toc-${page.id}-title`,
          title: pageState.title,
          pageNumber: page.pageNumber,
          level: 0,
        });
      }

      // 2. Scan blocks
      if (pageState.blocks) {
        pageState.blocks.forEach((block, index) => {
          // Subheadings -> Level 1
          if (block.type === "subheading") {
            entries.push({
              id: `toc-${page.id}-sub-${index}`,
              title: block.content,
              pageNumber: page.pageNumber,
              level: 1,
            });
          }
          // TOC Section -> Level 0
          if (block.type === "toc-section") {
            entries.push({
              id: `toc-${page.id}-sect-${index}`,
              title: block.title,
              pageNumber: page.pageNumber,
              level: 0,
            });
          }
          // TOC Entry -> Level 1 (or 0 if intended)
          if (block.type === "toc-entry") {
            entries.push({
              id: `toc-${page.id}-entry-${index}`,
              title: block.title,
              pageNumber:
                parseInt(block.pageNumber) || page.pageNumber,
              level: 1,
            });
          }
        });
      }
    });

    // If nothing generated (e.g. empty pages), fallback to at least one entry if possible, or just empty
    if (entries.length === 0 && isFallback) {
      return tocData;
    }

    return entries;
  }, [tocData, layoutState, magazineData]);

  const thumbnails = magazineData.map((page) => ({
    pageNumber: page.pageNumber,
    imageUrl: page.imageUrl,
    page,
    blocks: layoutState[page.id]?.blocks,
  }));

  const searchEntries = useMemo<SearchEntry[]>(() => {
    const articleTocEntries = generatedTOC
      .filter((entry) =>
        String(entry.id || "").startsWith("toc-article-"),
      )
      .sort((a, b) => a.pageNumber - b.pageNumber);

    return magazineData
      .filter((page) => page.pageNumber > 0)
      .map((page) => {
        const pageState = layoutState[page.id] as
          | {
              title?: string;
              byline?: string;
              blocks?: ContentBlock[];
            }
          | undefined;

        const tocEntry = generatedTOC.find(
          (entry) => entry.pageNumber === page.pageNumber,
        );

        const exactArticleTocEntry = articleTocEntries.find(
          (entry) => entry.pageNumber === page.pageNumber,
        );

        const currentArticleTocEntry = [...articleTocEntries]
          .reverse()
          .find((entry) => entry.pageNumber <= page.pageNumber);

        const blockText = (pageState?.blocks || [])
          .map((block) => {
            switch (block.type) {
              case "toc-section":
              case "chapter-divider":
                return stringifySearchValue(block.title);
              case "toc-entry":
                return stringifySearchValue(block.title);
              case "qa":
                return `${block.question} ${block.answer}`;
              case "image":
                return `${block.alt || ""} ${block.credit || ""}`;
              case "image-collage":
                return block.images
                  .map(
                    (image) =>
                      `${image.alt || ""} ${image.credit || ""}`,
                  )
                  .join(" ");
              case "collage-block":
                return block.items
                  .map(
                    (item) =>
                      `${item.title || ""} ${item.subtitle || ""} ${item.alt || ""}`,
                  )
                  .join(" ");
              case "fact-box":
                return `${block.title || ""} ${block.content || ""}`;
              case "references":
                return block.content.join(" ");
              case "link-button":
                return `${block.text || ""} ${block.href || ""}`;
              case "share":
                return `${block.articleTitle || ""} ${block.articleUrl || ""}`;
              default:
                return stringifySearchValue(
                  (block as { content?: unknown }).content,
                );
            }
          })
          .filter(Boolean)
          .join(" ");

        const title =
          pageState?.title ||
          tocEntry?.title ||
          (page.layoutId
            ? page.layoutId.replace(/[-_]+/g, " ")
            : "") ||
          `Page ${page.pageNumber}`;

        const searchableText = [
          title,
          pageState?.byline,
          tocEntry?.title,
          page.alt,
          blockText,
        ]
          .map(stringifySearchValue)
          .filter(Boolean)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();

        const articleTitle =
          exactArticleTocEntry?.title ||
          (page.id.startsWith("article-")
            ? currentArticleTocEntry?.title
            : "") ||
          title;

        const pageTitle = title;

        return {
          id: page.id,
          pageNumber: page.pageNumber,
          title: articleTitle,
          articleTitle,
          pageTitle,
          chapter:
            tocEntry?.level === 0 &&
            !String(tocEntry.id || "").startsWith(
              "toc-article-",
            )
              ? tocEntry.title
              : undefined,
          text: searchableText,
        };
      })
      .filter((entry) => entry.text.length > 0);
  }, [magazineData, layoutState, generatedTOC]);

  const handleToggleMusic = (playing: boolean) => {
    if (
      playing &&
      !selectedTrackId &&
      musicLibrary.length > 0
    ) {
      setSelectedTrackId(musicLibrary[0].id);
    }

    setIsMusicPlaying(playing);
  };

  const handleToggleRepeatCurrentTrack = () => {
    setIsRepeatingCurrentTrack((current) => !current);
  };

  const getTrackIndex = (trackId: string | null) =>
    musicLibrary.findIndex((track) => track.id === trackId);

  const getPreviousTrackId = () => {
    if (musicLibrary.length === 0) return null;

    const currentIndex = getTrackIndex(selectedTrackId);
    const previousIndex =
      currentIndex > 0
        ? currentIndex - 1
        : musicLibrary.length - 1;

    return musicLibrary[previousIndex]?.id || null;
  };

  const getNextTrackId = () => {
    if (musicLibrary.length === 0) return null;

    const currentIndex = getTrackIndex(selectedTrackId);
    const nextIndex =
      currentIndex >= 0
        ? (currentIndex + 1) % musicLibrary.length
        : 0;

    return musicLibrary[nextIndex]?.id || null;
  };

  const handlePreviousMusicTrack = () => {
    const previousTrackId = getPreviousTrackId();
    if (!previousTrackId) return;

    lastPlayedTrackIdRef.current = selectedTrackId;
    setSelectedTrackId(previousTrackId);
    setIsMusicPlaying(true);
  };

  const handleNextMusicTrack = () => {
    const nextTrackId = getNextTrackId();
    if (!nextTrackId) return;

    lastPlayedTrackIdRef.current = selectedTrackId;
    setSelectedTrackId(nextTrackId);
    setIsMusicPlaying(true);
  };

  const handleSelectMusicTrack = (trackId: string | null) => {
    if (!trackId) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      setSelectedTrackId(null);
      setIsMusicPlaying(false);
      return;
    }

    lastPlayedTrackIdRef.current = selectedTrackId;
    setSelectedTrackId(trackId);
    setIsMusicPlaying(true);
  };

  useEffect(() => {
    if (musicLibrary.length === 0) {
      setSelectedTrackId(null);
      setIsMusicPlaying(false);
      return;
    }

    const trackIds = musicLibrary.map((track) => track.id);

    if (
      !selectedTrackId ||
      !trackIds.includes(selectedTrackId)
    ) {
      setSelectedTrackId(trackIds[0]);
    }
  }, [musicLibrary, selectedTrackId]);

  useEffect(() => {
    const selectedTrack = musicLibrary.find(
      (track) => track.id === selectedTrackId,
    );

    if (!selectedTrack) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute("src");
        audioRef.current.load();
      }
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;
    audio.loop = false;
    audio.volume = musicVolume;
    audio.preload = "auto";

    const resolvedAudioUrl = new URL(
      selectedTrack.url,
      window.location.href,
    ).href;

    if (audio.src !== resolvedAudioUrl) {
      audio.pause();
      audio.src = selectedTrack.url;
      audio.currentTime = 0;
      audio.load();
    }

    audio.onended = () => {
      if (isRepeatingCurrentTrack) {
        audio.currentTime = 0;
        audio.play().catch((err) => {
          console.error("Error replaying audio:", err);
          setIsMusicPlaying(false);
        });
        return;
      }

      const trackIds = musicLibrary.map((track) => track.id);

      if (trackIds.length === 0) {
        setIsMusicPlaying(false);
        return;
      }

      const currentIndex = trackIds.indexOf(selectedTrack.id);
      const nextIndex =
        currentIndex >= 0
          ? (currentIndex + 1) % trackIds.length
          : 0;
      const nextTrackId = trackIds[nextIndex];

      lastPlayedTrackIdRef.current = selectedTrack.id;
      setSelectedTrackId(nextTrackId);
      setIsMusicPlaying(true);
    };

    if (isMusicPlaying) {
      audio.play().catch((err) => {
        console.error("Error playing audio:", err);
        setIsMusicPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [
    selectedTrackId,
    isMusicPlaying,
    musicLibrary,
    musicVolume,
    isRepeatingCurrentTrack,
  ]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.onended = null;
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const fetchGithubData = async () => {
      try {
        const [articlesRes, chaptersRes] = await Promise.all([
          fetch(ARTICLES_URL),
          fetch(CHAPTERS_URL),
        ]);

        if (articlesRes.ok && chaptersRes.ok) {
          const articlesRaw = await articlesRes.json();
          const chaptersRaw = await chaptersRes.json();

          const articles = Array.isArray(articlesRaw)
            ? articlesRaw
            : articlesRaw.articles || [];
          const chapters = Array.isArray(chaptersRaw)
            ? chaptersRaw
            : chaptersRaw.chapters || [];

          const newPages: MagazinePage[] = [];
          const newToc: TOCEntry[] = [];
          const newLayoutState: Record<
            string,
            { blocks: ContentBlock[] }
          > = {};

          // Inside cover + TOC + maybe a generic intro?
          // Let's preserve the cover info from FALLBACK_MAGAZINE_DATA, but generate dynamic pages.
          let pageNum = 1;
          let articleIndex = 0;

          const getChapterDividerData = (
            articleRecord: any,
          ) => {
            const chapterTitle =
              articleRecord.chapter ||
              articleRecord.chapterTitle ||
              articleRecord.chapterSlug ||
              "";

            const chapterSlug =
              articleRecord.chapterSlug ||
              String(chapterTitle)
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "");

            if (chapterSlug === "the-phlip-side") {
              return {
                slug: chapterSlug,
                title: "The PHlip-side",
                subtitle: "",
                eyebrow:
                  "Pulmonary Hypertension News (Bionews)",
              };
            }

            if (
              chapterSlug ===
              "scleroderma-foundation-of-greater-chicago"
            ) {
              return {
                slug: chapterSlug,
                title: "Beyond the Column",
                subtitle: "",
                eyebrow: "",
              };
            }

            if (chapterSlug === "rants-of-the-psyche") {
              return {
                slug: chapterSlug,
                title: "Rants in Writing",
                subtitle: "",
                eyebrow: "Rants of the Psyche",
              };
            }

            if (chapterSlug === "tips-tricks") {
              return {
                slug: chapterSlug,
                title: "Tips & Tricks",
                subtitle: "Practical support for daily life",
                eyebrow: "Patient and caregiver support",
              };
            }

            return {
              slug: chapterSlug || `chapter-${articleIndex}`,
              title: chapterTitle || "Chapter",
              subtitle: "Jolie Lizana",
              eyebrow: "",
            };
          };

          // Inside front cover / back of the front cover.
          // This uses pageNumber 0 so it appears on the LEFT side of the first open spread,
          // directly behind the front cover. Page 1 remains the first right-side magazine page.
          const reservedPageId = "inside-front-cover-page";
          newPages.push({
            id: reservedPageId,
            pageNumber: 0,
            type: "layout",
            layoutId: "inside-cover",
            alt: "Editorial notice, disclaimer, publication information, and copyright",
          });
          newLayoutState[reservedPageId] = {
            blocks: [],
          };

          const frontOpenerPageId = "front-opener-page";
          newPages.push({
            id: frontOpenerPageId,
            pageNumber: pageNum,
            type: "layout",
            layoutId: "article-text-layout",
            alt: "Breathtaking Awareness: The Words We Carry opening page",
          });
          newLayoutState[frontOpenerPageId] = {
            blocks: [
              {
                type: "markdown",
                content: `# Breathtaking Awareness

## The Words We Carry

### Volume I

#### 2025-2026

A collected volume of advocacy, reflection, education, and lived experience.`,
                _id: `md-${frontOpenerPageId}`,
              },
            ],
          };
          newToc.push({
            id: "toc-front-opener",
            title: "The Words We Carry",
            pageNumber: pageNum,
            level: 0,
          });
          pageNum++;

          const blankPageTwoId = "blank-page-two";
          newPages.push({
            id: blankPageTwoId,
            pageNumber: pageNum,
            type: "layout",
            layoutId: "article-text-layout",
            alt: "Blank page",
          });
          newLayoutState[blankPageTwoId] = {
            blocks: [
              {
                type: "markdown",
                content: ``,
                _id: `md-${blankPageTwoId}`,
              },
            ],
          };
          pageNum++;

          const welcomePageId =
            "welcome-to-breathtaking-awareness";
          newPages.push({
            id: welcomePageId,
            pageNumber: pageNum,
            type: "layout",
            layoutId: "article-text-layout",
            alt: "Welcome to Breathtaking Awareness",
          });

          newLayoutState[welcomePageId] = {
            blocks: [
              {
                type: "markdown",
                content: `# Welcome to Breathtaking Awareness

This volume brings together stories of advocacy, resilience, education, and lived experience from across rare disease, chronic illness, and patient advocacy communities.

Within these pages, readers will find personal essays, editorials, advocacy-focused writing, patient perspectives, practical support, and community-centered reflections. Each section highlights a different part of the patient experience, from navigating healthcare systems and daily life with chronic illness to finding purpose through advocacy, storytelling, and connection.

This publication was created to inform, encourage, and remind readers that meaningful understanding often begins when people are willing to share what they have carried.

Thank you for being part of the Breathtaking Awareness community.`,
                _id: `md-${welcomePageId}`,
              },
            ],
          };
          newToc.push({
            id: "toc-welcome",
            title: "Welcome to Breathtaking Awareness",
            pageNumber: pageNum,
            level: 0,
          });
          pageNum++;

          const aboutPageId =
            "about-breathtaking-awareness-page";
          newPages.push({
            id: aboutPageId,
            pageNumber: pageNum,
            type: "layout",
            layoutId: "article-text-layout",
            alt: "About Breathtaking Awareness",
          });
          newLayoutState[aboutPageId] = {
            blocks: [
              {
                type: "markdown",
                content: `Breathtaking Awareness is a patient-led advocacy and education platform founded by Jolie Lizana to support awareness, understanding, and connection within the pulmonary hypertension (PH), rare disease, and chronic illness communities.

Through writing, interviews, educational projects, community resources, and creative advocacy, Breathtaking Awareness centers lived experience while helping people feel less isolated in complex health journeys.

Its purpose is simple: to turn experience into understanding, and understanding into meaningful connections and medical reform.`,
                _id: `md-${aboutPageId}`,
              },
            ],
          };
          newToc.push({
            id: "toc-about-breathtaking-awareness",
            title: "About Breathtaking Awareness",
            pageNumber: pageNum,
            level: 0,
          });
          pageNum++;

          const missionPageId = "mission-statement-page";
          newPages.push({
            id: missionPageId,
            pageNumber: pageNum,
            type: "layout",
            layoutId: "article-text-layout",
            alt: "Mission Statement",
          });
          newLayoutState[missionPageId] = {
            blocks: [
              {
                type: "markdown",
                content: `# Mission Statement

Breathtaking Awareness empowers the pulmonary hypertension (PH) community through awareness, advocacy, education, and support.

Our mission is to help people find the resources, guidance, and community they need while recognizing their potential to advocate, connect, and support others by sharing their experiences, skills, and passions.

# About *The Words We Carry*

*The Words We Carry* is the first collected volume from Breathtaking Awareness. It brings together advocacy writing, personal reflection, patient perspective, practical support, and community-centered storytelling in one preserved collection.

This volume honors the words carried through diagnosis, uncertainty, resilience, grief, humor, identity, and hope. It is a record of what we notice, what we learn, what we question, and what we pass forward together.`,
                _id: `md-${missionPageId}`,
              },
            ],
          };
          newToc.push({
            id: "toc-mission-statement",
            title: "Mission Statement",
            pageNumber: pageNum,
            level: 0,
          });
          pageNum++;

          const howToUsePageId = "how-to-use-this-volume-page";
          newPages.push({
            id: howToUsePageId,
            pageNumber: pageNum,
            type: "layout",
            layoutId: "article-text-layout",
            alt: "How to Use This Volume",
          });
          newLayoutState[howToUsePageId] = {
            blocks: [
              {
                type: "markdown",
                content: `# How to Use This Volume

This volume can be read from beginning to end, or opened by section when you are looking for a specific kind of support, perspective, or resource.

Move through the major sections when you are looking for a specific kind of support, perspective, or resource. Some pieces are personal reflections. Some are advocacy articles. Some offer practical support for daily life. Together, they create a record of what people learn, notice, question, and share while living with or caring about chronic and rare disease.

The content in this volume is informational and reflective. It is not a substitute for medical care, diagnosis, treatment, or professional advice. When a topic relates to your health or care plan, use it as a starting point for a conversation with your healthcare team.`,
                _id: `md-${howToUsePageId}`,
              },
            ],
          };
          newToc.push({
            id: "toc-how-to-use-this-volume",
            title: "How to Use This Volume",
            pageNumber: pageNum,
            level: 0,
          });
          pageNum++;

          const volumeOnePageId = "volume-one-page";
          newPages.push({
            id: volumeOnePageId,
            pageNumber: pageNum,
            type: "layout",
            layoutId: "volume-one-page",
            alt: "Volume I introduction page",
          });
          newLayoutState[volumeOnePageId] = {
            blocks: [],
          };
          pageNum++;

          const whatsInsideLeftPageId =
            "whats-inside-left-page";
          newPages.push({
            id: whatsInsideLeftPageId,
            pageNumber: pageNum,
            type: "layout",
            layoutId: "whats-inside-left-page",
            alt: "What's Inside left page",
          });
          newLayoutState[whatsInsideLeftPageId] = {
            blocks: [],
          };
          pageNum++;

          const whatsInsideRightPageId =
            "whats-inside-right-page";
          newPages.push({
            id: whatsInsideRightPageId,
            pageNumber: pageNum,
            type: "layout",
            layoutId: "whats-inside-right-page",
            alt: "What's Inside contents page",
          });
          newLayoutState[whatsInsideRightPageId] = {
            blocks: [],
          };
          pageNum++;
          const getChapterDescriptionData = (
            chapterSlug: string,
          ) => {
            if (chapterSlug === "the-phlip-side") {
              return {
                title: "What is The PHlip-side?",
                body: "**The PHlip-side** brings together published columns and editorials originally written for Pulmonary Hypertension News (Bionews). These pieces explore life with pulmonary hypertension, chronic illness, advocacy, healthcare experiences, identity, grief, resilience, and the complicated reality of learning to live in a body that does not always cooperate.",
              };
            }

            if (
              chapterSlug ===
              "scleroderma-foundation-of-greater-chicago"
            ) {
              return {
                title: "What is Beyond the Column?",
                body: "Beyond the Column brings together selected articles, features, and contributed pieces written beyond the regular column space for healthcare, nonprofit, and advocacy communities.",
              };
            }

            if (chapterSlug === "rants-of-the-psyche") {
              return {
                title: "What You'll Find Inside:",
                body: "Rants in Writing is a collection of personal reflections that explore identity, resilience, mental health, grief, growth, advocacy, and the emotional realities that often accompany chronic and rare disease.",
              };
            }

            if (chapterSlug === "tips-tricks") {
              return {
                title: "What You'll Find Inside:",
                body: "Tips & Tricks is a collection of practical lessons, lived-experience insights, and everyday strategies gathered through years of navigating healthcare, advocacy, and life with chronic illness.",
              };
            }

            return null;
          };

          let lastChapterSlug = "";

          const addChapterDividerPage = (chapterData: {
            slug: string;
            title: string;
            subtitle: string;
            eyebrow: string;
          }) => {
            const dividerPageId = `chapter-${chapterData.slug}-divider`;

            newPages.push({
              id: dividerPageId,
              pageNumber: pageNum,
              type: "layout",
              layoutId: "article-text-layout",
              alt: `${chapterData.title} chapter divider`,
            });

            newLayoutState[dividerPageId] = {
              blocks: [
                {
                  type: "chapter-divider",
                  title: chapterData.title,
                  subtitle: chapterData.subtitle,
                  eyebrow: chapterData.eyebrow,
                  _id: `chapter-${chapterData.slug}`,
                },
              ],
            };

            newToc.push({
              id: `toc-chapter-${chapterData.slug}`,
              title: chapterData.title,
              pageNumber: pageNum,
              level: 0,
            });

            pageNum++;
          };

          const addChapterDescriptionPage = (chapterData: {
            slug: string;
            title: string;
          }) => {
            const chapterDescription =
              getChapterDescriptionData(chapterData.slug);

            if (!chapterDescription) return;

            const descriptionPageId = `chapter-${chapterData.slug}-description`;

            newPages.push({
              id: descriptionPageId,
              pageNumber: pageNum,
              type: "layout",
              layoutId: "article-text-layout",
              alt: `${chapterData.title} chapter description`,
            });

            newLayoutState[descriptionPageId] = {
              blocks: [
                {
                  type: "markdown",
                  content: `# ${chapterDescription.title}

${chapterDescription.body}`,
                  _id: `md-${descriptionPageId}`,
                },
              ],
            };

            pageNum++;
          };

          const getTitleHeadingPrefix = (
            title: string,
            subtitle: string,
          ) => {
            const totalLength = `${title} ${subtitle}`.trim()
              .length;
            const titleLength = title.trim().length;

            // Use a real stepped title scale instead of only two sizes.
            // Every returned heading is still larger than normal story copy.
            if (titleLength <= 42 && totalLength <= 90)
              return "#";
            if (titleLength <= 72 && totalLength <= 125)
              return "##";
            if (titleLength <= 105 && totalLength <= 165)
              return "###";
            return "####";
          };

          const getSubtitleMarkdown = (subtitle: string) => {
            if (!subtitle) return "";
            // Slightly larger than story copy, but clearly secondary to the title.
            return `##### **${subtitle}**`;
          };

          const resolveAssetUrl = (
            src: string,
            articleRecord?: any,
          ) => {
            let assetUrl = (src || "").trim();
            if (!assetUrl) return assetUrl;

            if (
              /the[_-]weight[_-]of[_-]staying[_-]well/i.test(
                assetUrl,
              )
            ) {
              return "https://raw.githubusercontent.com/Joliel21/Magazine/main/public/images/articles/scleroderma-foundation-of-greater-chicago/the_weight_of_staying_well_8x11_5.jpg";
            }

            // Local imports are already resolved by the bundler.
            if (articleRecord?.isLocalImport) return assetUrl;

            if (
              assetUrl.startsWith("http") ||
              assetUrl.startsWith("data:") ||
              assetUrl.startsWith("blob:") ||
              assetUrl.startsWith("/src/")
            ) {
              return encodeURI(assetUrl);
            }

            if (assetUrl.startsWith("/")) {
              return resolvePublicUrl(assetUrl);
            }

            // Article Markdown can use paths relative to public/content/articles.
            // GitHub article metadata uses paths relative to public/.
            // Both should resolve to raw.githubusercontent.com/.../public/<path>.
            assetUrl = assetUrl
              .replace(/^public\//, "")
              .replace(/^(\.\.\/)+/, "");

            // Article image metadata in articles.json often stores filenames as
            // "phlip-side/file.jpg" or "scleroderma-foundation-of-greater-chicago/file.jpg".
            // Those live in public/images/articles/<folder>/<file>.
            if (
              !assetUrl.startsWith("images/") &&
              !assetUrl.startsWith("content/") &&
              /\.(png|jpe?g|gif|webp|svg)$/i.test(assetUrl)
            ) {
              assetUrl = "images/articles/" + assetUrl;
            }

            // Bare non-image filenames still fall back to the original content/images location.
            if (!assetUrl.includes("/")) {
              assetUrl = "content/images/" + assetUrl;
            }

            return resolvePublicUrl(assetUrl);
          };

          const getFirstImageMetadata = (markdown: string) => {
            const imageMatch = markdown.match(
              /^\s*Image(?:\s+\d+)?:\s*([^\n]+)/im,
            );
            if (!imageMatch || !imageMatch[1]) return null;

            const captionMatch = markdown.match(
              /^\s*Caption:\s*([^\n]+)/im,
            );
            const altMatch = markdown.match(
              /^\s*Alt text:\s*([^\n]+)/im,
            );

            return {
              src: imageMatch[1].trim(),
              caption: captionMatch?.[1]?.trim() || "",
              alt: altMatch?.[1]?.trim() || "",
            };
          };

          const getArticleDateCandidates = (
            articleRecord: any,
            markdownText = "",
          ) => {
            const normalizedId = normalizeArticleKey(
              articleRecord.id || "",
            );
            const normalizedTitle = normalizeArticleKey(
              articleRecord.title || "",
            );

            return [
              ARTICLE_DATE_OVERRIDES[normalizedId],
              ARTICLE_DATE_OVERRIDES[normalizedTitle],
              articleRecord.date,
              articleRecord.publishedDate,
              articleRecord.publishDate,
              articleRecord.publicationDate,
              articleRecord.articleDate,
              articleRecord.createdAt,
              articleRecord.updatedAt,
              articleRecord.markdownPath,
              articleRecord.path,
              articleRecord.filename,
              markdownText.match(
                /(?:Editorial|Published|Posted|Updated|Written by[^|\n]*)\s*\|\s*([^*\n<]+)/i,
              )?.[1],
              markdownText.match(
                /(?:Editorial|Published|Posted|Updated|Publication date)\s*[:—-]\s*([^*\n<]+)/i,
              )?.[1],
              markdownText.match(
                /\b(?:January|February|March|April|May|June|July|August|Aug\.|September|October|November|December)\s+\d{1,2},\s+\d{4}\b/i,
              )?.[0],
              markdownText.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0],
            ].filter(Boolean);
          };

          const parseArticleDateValue = (
            articleRecord: any,
            markdownText = "",
          ) => {
            const candidateValues = getArticleDateCandidates(
              articleRecord,
              markdownText,
            );

            for (const value of candidateValues) {
              const text = String(value).trim();
              if (!text) continue;

              const isoMatch = text.match(
                /\b\d{4}-\d{2}-\d{2}\b/,
              );
              const monthMatch = text.match(
                /\b(?:January|February|March|April|May|June|July|August|Aug\.|September|October|November|December)\s+\d{1,2},\s+\d{4}\b/i,
              );
              const normalized =
                isoMatch?.[0] ||
                monthMatch?.[0]?.replace(/^Aug\./i, "August") ||
                text.replace(/^Aug\./i, "August");
              const parsed = Date.parse(normalized);
              if (!Number.isNaN(parsed)) return parsed;
            }

            return 0;
          };

          const getArticlePublicationDateLabel = (
            articleRecord: any,
            markdownText = "",
          ) => {
            const candidateValues = getArticleDateCandidates(
              articleRecord,
              markdownText,
            );

            for (const value of candidateValues) {
              const text = String(value).trim();
              if (!text) continue;

              const monthMatch = text.match(
                /\b(?:January|February|March|April|May|June|July|August|Aug\.|September|October|November|December)\s+\d{1,2},\s+\d{4}\b/i,
              );
              if (monthMatch?.[0]) {
                return monthMatch[0].replace(
                  /^Aug\./i,
                  "August",
                );
              }

              const isoMatch = text.match(
                /\b\d{4}-\d{2}-\d{2}\b/,
              );
              const normalized =
                isoMatch?.[0] ||
                text.replace(/^Aug\./i, "August");
              const parsed = Date.parse(normalized);

              if (!Number.isNaN(parsed)) {
                return new Intl.DateTimeFormat("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                }).format(new Date(parsed));
              }
            }

            return "";
          };

          const loadArticleMarkdown = async (
            articleRecord: any,
          ) => {
            if (articleRecord.markdownContent) {
              return articleRecord.markdownContent;
            }

            let mdUrl = articleRecord.markdownPath || "";
            if (!mdUrl) return "Error loading content.";

            if (!mdUrl.startsWith("http")) {
              mdUrl = resolvePublicUrl(mdUrl);
            }

            const mdRes = await fetch(encodeURI(mdUrl));
            return mdRes.ok
              ? await mdRes.text()
              : "Error loading content.";
          };

          const resolvedArticles = await Promise.all(
            articles.map(async (article, originalIndex) => {
              const resolvedMarkdownContent =
                await loadArticleMarkdown(article);
              const chapterData =
                getChapterDividerData(article);

              return {
                ...article,
                __originalIndex: originalIndex,
                __chapterSlug: chapterData.slug,
                __resolvedMarkdownContent:
                  resolvedMarkdownContent,
                __dateValue: parseArticleDateValue(
                  article,
                  resolvedMarkdownContent,
                ),
                __publicationDateLabel:
                  getArticlePublicationDateLabel(
                    article,
                    resolvedMarkdownContent,
                  ),
              };
            }),
          );

          const preferredChapterOrder = [
            "scleroderma-foundation-of-greater-chicago",
            "the-phlip-side",
            "rants-of-the-psyche",
            "tips-tricks",
          ];

          const getNormalizedChapterSlug = (
            chapter: any,
            index: number,
          ) =>
            String(
              chapter.slug ||
                chapter.title ||
                `chapter-${index}`,
            )
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "");

          const orderedChapters = [...chapters].sort(
            (a: any, b: any) => {
              const slugA = getNormalizedChapterSlug(a, 0);
              const slugB = getNormalizedChapterSlug(b, 0);
              const preferredA =
                preferredChapterOrder.indexOf(slugA);
              const preferredB =
                preferredChapterOrder.indexOf(slugB);

              if (preferredA !== -1 || preferredB !== -1) {
                if (preferredA === -1) return 1;
                if (preferredB === -1) return -1;
                return preferredA - preferredB;
              }

              return chapters.indexOf(a) - chapters.indexOf(b);
            },
          );

          const chapterOrder = new Map<string, number>();
          orderedChapters.forEach(
            (chapter: any, index: number) => {
              const chapterSlug = getNormalizedChapterSlug(
                chapter,
                index,
              );

              if (!chapterOrder.has(chapterSlug)) {
                chapterOrder.set(chapterSlug, index);
              }
            },
          );

          const articleById = new Map<string, any>();
          resolvedArticles.forEach((article) => {
            articleById.set(String(article.id || ""), article);
          });

          const sortedArticles: any[] = [];
          const usedArticleIds = new Set<string>();

          orderedChapters.forEach((chapter: any) => {
            const chapterArticleIds = Array.isArray(
              chapter.articleIds,
            )
              ? chapter.articleIds
              : [];

            chapterArticleIds.forEach((articleId: string) => {
              const article = articleById.get(
                String(articleId),
              );
              if (!article) return;

              sortedArticles.push(article);
              usedArticleIds.add(String(article.id || ""));
            });
          });

          resolvedArticles
            .filter(
              (article) =>
                !usedArticleIds.has(String(article.id || "")),
            )
            .sort((a, b) => {
              const chapterA =
                a.__chapterSlug || "uncategorized";
              const chapterB =
                b.__chapterSlug || "uncategorized";
              const chapterCompare =
                (chapterOrder.get(chapterA) ?? 999) -
                (chapterOrder.get(chapterB) ?? 999);

              if (chapterCompare !== 0) return chapterCompare;

              return a.__originalIndex - b.__originalIndex;
            })
            .forEach((article) => sortedArticles.push(article));

          for (const article of sortedArticles) {
            const chapterData = getChapterDividerData(article);

            if (
              chapterData.slug &&
              chapterData.slug !== lastChapterSlug
            ) {
              addChapterDividerPage(chapterData);
              addChapterDescriptionPage(chapterData);

              lastChapterSlug = chapterData.slug;
            }

            const mdContent =
              article.__resolvedMarkdownContent ||
              "Error loading content.";

            // Convert custom Image/caption placement blocks to standard markdown images
            let processedMd = mdContent;

            const blockRegex =
              /Image\/caption placement[\s\S]*?<!-- BTA_IMAGE_END -->\s*/gi;
            processedMd = processedMd.replace(
              blockRegex,
              (match) => {
                const imgMatch = match.match(
                  /Image(?:\s+\d+)?:\s*([^\n]+)/i,
                );
                const altMatch = match.match(
                  /Alt text:\s*([^\n]+)/i,
                );
                if (imgMatch && imgMatch[1]) {
                  let imgPath = imgMatch[1].trim();
                  if (!imgPath.startsWith("http")) {
                    imgPath = resolvePublicUrl(imgPath);
                  }
                  imgPath = encodeURI(imgPath);
                  const altText =
                    altMatch && altMatch[1]
                      ? altMatch[1].trim()
                      : "Image";
                  return `\n\n![${altText}](${imgPath})\n\n`;
                }
                return "";
              },
            );

            // Clean up any stray BTA image markers just in case.
            // Keep the markdown image inside the block so it can become its own image page.
            processedMd = processedMd
              .replace(/<!--\s*BTA_IMAGE_START\s*-->/gi, "")
              .replace(/<!--\s*BTA_IMAGE_END\s*-->/gi, "");

            // Fix Shopping and Errands ordering
            if (
              processedMd.toLowerCase().includes("shopping") &&
              processedMd.toLowerCase().includes("errands")
            ) {
              let mdLines = processedMd.split("\n");
              const shoppingLineIdx = mdLines.findIndex(
                (line) =>
                  line.toLowerCase().includes("shopping"),
              );

              if (shoppingLineIdx !== -1) {
                // Extract shopping block: starts at shoppingLineIdx, ends when we hit a non-empty, non-indented line that isn't a bullet
                // To be safe, just collect until the next line that starts with a letter/number and no indentation, or another header
                let endIdx = shoppingLineIdx;
                while (endIdx + 1 < mdLines.length) {
                  const nextLine = mdLines[endIdx + 1];
                  // If it's empty, or starts with space/tab, or starts with a bullet, it's part of the block
                  if (
                    nextLine.trim() === "" ||
                    nextLine.match(/^[ \t]/) ||
                    nextLine.match(/^[-*]/) ||
                    nextLine.match(/^\d+\./)
                  ) {
                    // wait, if it's another top-level bullet like "- Work", we might grab it too if we allow any bullet.
                    // Let's assume if it starts with a bullet AND it's not indented, it might be a new section.
                    // But list items can be sibling bullets.
                    // If the user wants Shopping below Errands, and Shopping has sibling bullets, we might grab them too if they are part of Shopping.
                    // Let's just say a block ends when we see a word character at the start of the line, or a `#` header.
                    if (
                      nextLine.match(/^[A-Za-z#]/) &&
                      !nextLine
                        .toLowerCase()
                        .includes("shopping") &&
                      !nextLine
                        .toLowerCase()
                        .includes("errands")
                    ) {
                      break;
                    }
                    if (
                      nextLine.toLowerCase().includes("errands")
                    ) {
                      break;
                    }
                    endIdx++;
                  } else {
                    if (nextLine.match(/^[A-Za-z#]/)) break;
                    endIdx++; // safely include it if it's weird punctuation
                  }
                }

                const shoppingBlock = mdLines.splice(
                  shoppingLineIdx,
                  endIdx - shoppingLineIdx + 1,
                );

                // Re-find errands
                const newErrandsIdx = mdLines.findIndex(
                  (line) =>
                    line.toLowerCase().includes("errands"),
                );
                if (newErrandsIdx !== -1) {
                  let errEndIdx = newErrandsIdx;
                  while (errEndIdx + 1 < mdLines.length) {
                    const nextLine = mdLines[errEndIdx + 1];
                    if (
                      nextLine.trim() === "" ||
                      nextLine.match(/^[ \t]/) ||
                      nextLine.match(/^[-*]/) ||
                      nextLine.match(/^\d+\./)
                    ) {
                      if (
                        nextLine.match(/^[A-Za-z#]/) &&
                        !nextLine
                          .toLowerCase()
                          .includes("errands")
                      )
                        break;
                      errEndIdx++;
                    } else {
                      if (nextLine.match(/^[A-Za-z#]/)) break;
                      errEndIdx++;
                    }
                  }

                  // We will also nest the shopping block under Errands by adding 4 spaces to it (strict markdown parsing)
                  const nestedShoppingBlock = shoppingBlock.map(
                    (line) => {
                      if (line.trim() === "") return line;
                      // If it's a header, make it a bullet
                      if (line.startsWith("#"))
                        return (
                          "    - " + line.replace(/^#+\s*/, "")
                        );
                      // If it's already a bullet or text, indent it with 4 spaces
                      return (
                        "    " + line.replace(/^[ \t]*/, "")
                      );
                    },
                  );

                  mdLines.splice(
                    errEndIdx + 1,
                    0,
                    ...nestedShoppingBlock,
                  );
                  processedMd = mdLines.join("\n");
                } else {
                  // Put it back if Errands not found
                  mdLines.splice(
                    shoppingLineIdx,
                    0,
                    ...shoppingBlock,
                  );
                  processedMd = mdLines.join("\n");
                }
              }
            }

            // Extract article subtitle from the first bold/deck-style line, when present.
            const subtitleMatch = processedMd.match(
              /^\s*(?:\*\*([^*\n]+)\*\*|__([^_\n]+)__|#{2,3}\s+([^\n]+))\s*$/m,
            );
            const articleSubtitle = (
              subtitleMatch?.[1] ||
              subtitleMatch?.[2] ||
              subtitleMatch?.[3] ||
              ""
            ).trim();

            // Extract the first image from Markdown, Image/caption metadata, or the article record.
            const imgMatch = processedMd.match(
              /!\[.*?\]\((.*?)\)/,
            );
            const imageMetadata =
              getFirstImageMetadata(processedMd);
            const articleImageRecord =
              Array.isArray(article.images) &&
              article.images.length > 0
                ? article.images[0]
                : null;

            const normalizedArticleId = normalizeArticleKey(
              article.id || "",
            );
            const normalizedArticleTitle = normalizeArticleKey(
              article.title || "",
            );

            const suppressArticleImage =
              ARTICLE_IMAGE_SUPPRESSIONS.has(
                normalizedArticleId,
              ) ||
              ARTICLE_IMAGE_SUPPRESSIONS.has(
                normalizedArticleTitle,
              );

            const imageOverride = suppressArticleImage
              ? null
              : ARTICLE_IMAGE_OVERRIDES[normalizedArticleId] ||
                ARTICLE_IMAGE_OVERRIDES[
                  normalizedArticleTitle
                ] ||
                null;

            let imageUrl = suppressArticleImage
              ? null
              : imageOverride ||
                (imgMatch
                  ? imgMatch[1]
                  : imageMetadata?.src ||
                    article.image ||
                    article.imageUrl ||
                    article.coverImage ||
                    articleImageRecord?.filename ||
                    null);
            const imageAlt =
              imageMetadata?.alt ||
              articleImageRecord?.alt ||
              article.title ||
              "Article image";
            const hasArticleImage = !!imageUrl;

            if (imageUrl && typeof imageUrl === "string") {
              imageUrl = resolveAssetUrl(imageUrl, article);
            }

            const extraImageUrls = suppressArticleImage
              ? []
              : (
                  ARTICLE_EXTRA_IMAGE_OVERRIDES[
                    normalizedArticleId
                  ] ||
                  ARTICLE_EXTRA_IMAGE_OVERRIDES[
                    normalizedArticleTitle
                  ] ||
                  []
                ).map((src) => resolveAssetUrl(src, article));

            const getShareExcerpt = (markdownText = "") => {
              const cleanedShareText = markdownText
                .replace(/!\[.*?\]\(.*?\)/g, "")
                .replace(
                  /<!--\s*BTA_IMAGE_START\s*-->[\s\S]*?<!--\s*BTA_IMAGE_END\s*-->/gi,
                  "",
                )
                .replace(/<!--\s*PAGE_BREAK\s*-->/gi, "")
                .replace(/^\s*#+\s+/gm, "")
                .replace(/\*\*(.*?)\*\*/g, "$1")
                .replace(/__(.*?)__/g, "$1")
                .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
                .replace(
                  /^\s*(?:Editorial|Published|Posted|Updated|Written by[^|\n]*)(?:\s*\|\s*[^\n]+)?\s*$/gim,
                  "",
                )
                .replace(/^\s*By\s+[^\n]+$/gim, "")
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean)
                .filter((line) => line !== article.title)
                .filter((line) => line !== articleSubtitle)
                .join(" ");

              return cleanedShareText.length > 155
                ? `${cleanedShareText.slice(0, 152).trim()}…`
                : cleanedShareText;
            };

            const articleShareExcerpt =
              article.excerpt ||
              article.description ||
              article.summary ||
              articleSubtitle ||
              getShareExcerpt(processedMd);

            // Story pages should start clean: no repeated image, image metadata, title, subtitle/deck,
            // Editorial/date line, or manual page-break marker.
            const stripEditorialSignoffs = (value: string) =>
              value
                .replace(
                  /(?:^|\n)\s*For\s+more\s+advocacy,?\s+follow\s+me\s+(?:at|on)\s+@?(?:Breathtaking\s*Awareness|BreathtakingAwareness)\.?\s*(?=\n|$)/gim,
                  "\n",
                )
                .replace(
                  /(?:^|\n)\s*You\s+can\s+also\s+follow\s+me\s+(?:at|on)\s+@?(?:Breathtaking\s*Awareness|BreathtakingAwareness)\.?\s*(?=\n|$)/gim,
                  "\n",
                )
                .replace(
                  /(?:^|\n)\s*Leave\s+a\s+comment\s+or\s+follow\s+me\s+on\s+Instagram\s+at\s+@?(?:Breathtaking\s*Awareness|BreathtakingAwareness)\.?\s*(?=\n|$)/gim,
                  "\n",
                )
                .replace(
                  /(?:^|\n)\s*Please\s+share\s+in\s+the\s+comments\s+below\.\s*You\s+can\s+also\s+follow\s+me\s+on\s+Instagram\s+at\s+@?(?:Breathtaking\s*Awareness|BreathtakingAwareness)\.?\s*(?=\n|$)/gim,
                  "\n",
                )
                .replace(
                  /(?:^|\n)\s*Please\s+share\s+your\s+thoughts\s+in\s+the\s+comments\s+below\.\s*Follow\s+me\s+at\s+@?(?:Breathtaking\s*Awareness|BreathtakingAwareness)\.?\s*(?=\n|$)/gim,
                  "\n",
                )
                .replace(
                  /(?:^|\n)\s*To\s+learn\s+more\s+about\s+me\s+and\s+my\s+journey,?\s+follow\s+me\s+on\s+(?:Facebook|Instagram)(?:\s+or\s+(?:Facebook|Instagram))?\.?\s*(?=\n|$)/gim,
                  "\n",
                )
                .replace(
                  /(?:^|\n)\s*For\s+more\s+of\s+my\s+journey,?\s+follow\s+me\s+(?:at|on)\s+@?(?:Breathtaking\s*Awareness|BreathtakingAwareness)\.?\s*(?=\n|$)/gim,
                  "\n",
                )
                .replace(
                  /(?:^|\n)\s*(?:For\s+more|To\s+learn\s+more|You\s+can\s+also|Leave\s+a\s+comment|Please\s+share)\b[^\n]*(?:follow\s+me|comments?|Facebook|Instagram|Breathtaking\s*Awareness|BreathtakingAwareness)[^\n]*\.?\s*(?=\n|$)/gim,
                  "\n",
                )
                .replace(/[ \t]+\n/g, "\n")
                .replace(/\n{3,}/g, "\n\n")
                .trim();

            let cleanMd = processedMd.replace(
              /!\[.*?\]\(.*?\)/,
              "",
            );
            cleanMd = cleanMd.replace(
              /^\s*#{0,6}\s*Image\/caption placement\s*$/gim,
              "",
            );
            cleanMd = cleanMd.replace(
              /^\s*Image(?:\s+\d+)?:\s*[^\n]*$/gim,
              "",
            );
            cleanMd = cleanMd.replace(
              /^\s*Caption:\s*[^\n]*$/gim,
              "",
            );
            cleanMd = cleanMd.replace(
              /^\s*Alt text:\s*[^\n]*$/gim,
              "",
            );
            cleanMd = cleanMd.replace(/^\s*#\s+.*$/m, ""); // remove the first h1 title/header
            if (articleSubtitle) {
              // Remove only a duplicated deck/subtitle line from the body copy.
              // Do NOT remove Markdown subheads such as "## Acute Survival Mode";
              // those are in-article section headers and should render in the magazine.
              cleanMd = cleanMd.replace(
                /^\s*(?:\*\*[^*\n]+\*\*|__[^_\n]+__)\s*$/m,
                "",
              );
            }
            cleanMd = cleanMd.replace(
              /^\s*[\*_]?\s*Editorial(?:\s*\|\s*[^*\n]+)?\s*[\*_]?\s*$/gim,
              "",
            );
            cleanMd = cleanMd.replace(
              /^\s*[\*_]?\s*By\s+[^*\n]+\s*[\*_]?\s*$/gim,
              "",
            );
            cleanMd = cleanMd.replace(
              /^\s*[\*_]?\s*Written by\s+[^|\n]+(?:\s*\|\s*[^*\n]+)?\s*[\*_]?\s*$/gim,
              "",
            );
            cleanMd = cleanMd.replace(
              /<!--\s*PAGE_BREAK\s*-->/gi,
              "",
            );
            cleanMd = cleanMd.replace(
              /^\s*(?:[\w-]+\/)*i-learn-a-hard-lesson-about-traveling-with-pulmonary-hypertension\.md\s*$/gim,
              "",
            );
            cleanMd = cleanMd.replace(
              /^\s*(?:[\w-]+\/)*[\w-]+\.md\s*$/gim,
              "",
            );
            cleanMd = cleanMd.replace(
              /^\s*(?:Follow|Connect with|Find|Visit)\s+(?:me|us)?\s*(?:for\s+more\s+(?:insights|updates|stories|information)\s+)?(?:on\s+)?(?:Instagram|Facebook|LinkedIn|Twitter|X|social media)\b[^\n]*$/gim,
              "",
            );
            cleanMd = cleanMd.replace(
              /^\s*(?:Follow|Connect with|Find|Visit)\s+(?:me|us)?[^\n]*(?:BreathtakingAwareness|Breathtaking\s+Awareness|Instagram|Facebook|LinkedIn|Twitter|X)[^\n]*$/gim,
              "",
            );
            cleanMd = cleanMd.replace(
              /^\s*(?:Instagram|Facebook|LinkedIn|Twitter|X)\s*:?\s*@?Breathtaking\s*Awareness\b[^\n]*$/gim,
              "",
            );
            cleanMd = cleanMd.replace(
              /^\s*To\s+learn\s+more\s+about\s+me\s+and\s+my\s+journey,?\s+follow\s+me\s+on\s+(?:Facebook|Instagram|social\s+media)(?:\s+or\s+(?:Facebook|Instagram|social\s+media))?\.?\s*$/gim,
              "",
            );
            cleanMd = cleanMd.replace(
              /^\s*For\s+more\s+of\s+my\s+journey,?\s+follow\s+me\s+(?:at|on)\s+@?(?:BreathtakingAwareness|Breathtaking\s+Awareness|Facebook|Instagram)\.?\s*$/gim,
              "",
            );
            cleanMd = cleanMd.replace(
              /^\s*(?:To\s+learn\s+more|For\s+more)\b[^\n]*(?:follow\s+me|my\s+journey|Facebook|Instagram|BreathtakingAwareness|Breathtaking\s+Awareness)[^\n]*\.?\s*$/gim,
              "",
            );
            cleanMd = cleanMd.replace(
              /^\s*For\s+more\s+advocacy,?\s+follow\s+me\s+(?:at|on)\s+@?(?:BreathtakingAwareness|Breathtaking\s+Awareness)\.?\s*$/gim,
              "",
            );
            cleanMd = cleanMd.replace(
              /^\s*You\s+can\s+also\s+follow\s+me\s+(?:at|on)\s+@?(?:BreathtakingAwareness|Breathtaking\s+Awareness)\.?\s*$/gim,
              "",
            );
            cleanMd = cleanMd.replace(
              /^\s*Leave\s+a\s+comment\s+or\s+follow\s+me\s+on\s+Instagram\s+at\s+@?(?:BreathtakingAwareness|Breathtaking\s+Awareness)\.?\s*$/gim,
              "",
            );
            cleanMd = cleanMd.replace(
              /^\s*Please\s+share\s+(?:in|your\s+thoughts\s+in)\s+the\s+comments\s+below\.\s*(?:You\s+can\s+also\s+)?Follow\s+me\s+(?:at|on\s+Instagram\s+at)\s+@?(?:BreathtakingAwareness|Breathtaking\s+Awareness)\.?\s*$/gim,
              "",
            );
            cleanMd = cleanMd.replace(
              /^\s*(?:Please\s+share|Leave\s+a\s+comment|You\s+can\s+also\s+follow|For\s+more\s+advocacy)\b[^\n]*(?:comments?|follow\s+me|Instagram|Facebook|BreathtakingAwareness|Breathtaking\s+Awareness)[^\n]*\.?\s*$/gim,
              "",
            );
            cleanMd = cleanMd.replace(
              /(?:^|\n)\s*For\s+more\s+advocacy,?\s+follow\s+me\s+(?:at|on)\s+@?(?:BreathtakingAwareness|Breathtaking\s+Awareness)\.?(?=\s*(?:\n|$))/gim,
              "\n",
            );
            cleanMd = cleanMd.replace(
              /(?:^|\n)\s*You\s+can\s+also\s+follow\s+me\s+(?:at|on)\s+@?(?:BreathtakingAwareness|Breathtaking\s+Awareness)\.?(?=\s*(?:\n|$))/gim,
              "\n",
            );
            cleanMd = cleanMd.replace(
              /(?:^|\n)\s*Leave\s+a\s+comment\s+or\s+follow\s+me\s+on\s+Instagram\s+at\s+@?(?:BreathtakingAwareness|Breathtaking\s+Awareness)\.?(?=\s*(?:\n|$))/gim,
              "\n",
            );
            cleanMd = cleanMd.replace(
              /(?:^|\n)\s*Please\s+share\s+in\s+the\s+comments\s+below\.\s*You\s+can\s+also\s+follow\s+me\s+on\s+Instagram\s+at\s+@?(?:BreathtakingAwareness|Breathtaking\s+Awareness)\.?(?=\s*(?:\n|$))/gim,
              "\n",
            );
            cleanMd = cleanMd.replace(
              /(?:^|\n)\s*Please\s+share\s+your\s+thoughts\s+in\s+the\s+comments\s+below\.\s*Follow\s+me\s+at\s+@?(?:BreathtakingAwareness|Breathtaking\s+Awareness)\.?(?=\s*(?:\n|$))/gim,
              "\n",
            );
            cleanMd = cleanMd.replace(
              /(?:^|\n)\s*(?:For\s+more\s+(?:advocacy|of\s+my\s+journey)|To\s+learn\s+more\s+about\s+me\s+and\s+my\s+journey|You\s+can\s+also\s+follow\s+me|Leave\s+a\s+comment|Please\s+share)\b[^\n]*(?:follow\s+me|comments?|Instagram|Facebook|BreathtakingAwareness|Breathtaking\s+Awareness)[^\n]*\.?(?=\s*(?:\n|$))/gim,
              "\n",
            );
            // Keep publication dates and external links off story/body pages.
            // Dates now appear on each article title page instead.
            cleanMd = cleanMd.replace(
              /^\s*[\*_]?\s*(?:(?:Editorial|Published|Posted|Updated|Publication date)\s*(?:\||:|—|-)?\s*)?(?:\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b|\b\d{4}-\d{2}-\d{2}\b)(?:\s*;\s*(?:updated|revised)\s*(?:\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b|\b\d{4}-\d{2}-\d{2}\b))?\s*[\*_]?\s*$/gim,
              "",
            );
            cleanMd = cleanMd.replace(
              /^\s*[\*_]?\s*(?:Updated|Revised)\s+(?:\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b|\b\d{4}-\d{2}-\d{2}\b)\s*[\*_]?\s*$/gim,
              "",
            );
            cleanMd = cleanMd.replace(
              /^\s*(?:[\w-]+\/)*i-learn-a-hard-lesson-about-traveling-with-pulmonary-hypertension\.md\s*$/gim,
              "",
            );
            cleanMd = cleanMd.replace(
              /^\s*(?:[\w-]+\/)*[\w-]+\.md\s*$/gim,
              "",
            );
            cleanMd = cleanMd.replace(
              /\[([^\]]+)\]\((?:https?:\/\/|mailto:)[^)]+\)/g,
              "$1",
            );
            cleanMd = cleanMd.replace(
              /<https?:\/\/[^>\s]+>/g,
              "",
            );
            cleanMd = cleanMd.replace(/https?:\/\/\S+/g, "");
            cleanMd = cleanMd.replace(
              /^\s*(?:Read more|Source|Sources|Link|Links|Original article|References?)\s*:?\s*$/gim,
              "",
            );
            // Keep Markdown subheadings (##, ###, ####, etc.) so article section headers render in the magazine.
            // The article H1/title is already removed above because it has its own title page.
            cleanMd = cleanMd.replace(/^\s*>+\s*/gm, ""); // force blockquotes to be normal paragraphs
            cleanMd = cleanMd.replace(/^\s*[=-]{3,}\s*$/gm, ""); // remove alternative heading underlines / hrs
            // Remove stray markdown emphasis marker lines, such as a standalone "**"
            // that can be left after a bold/deck line is stripped.
            cleanMd = cleanMd.replace(
              /^\s*(?:\*\*|__|\*|_)\s*$/gm,
              "",
            );

            cleanMd = stripEditorialSignoffs(cleanMd);
            cleanMd = cleanMd.replace(/[ \t]+\n/g, "\n");
            cleanMd = cleanMd.replace(/\n{3,}/g, "\n\n").trim();

            // PHlip-side spread alignment:
            // Work from the generated sequence, not fixed page numbers.
            // Add a blank page only when the next PHlip-side title page would land
            // on a right-side/odd page. The blank page is placed before that title,
            // which means it sits after the previous article/share page in the book.
            // This keeps the title page and its image page together on the same spread.
            if (
              chapterData.slug === "the-phlip-side" &&
              hasArticleImage &&
              pageNum % 2 !== 0
            ) {
              const spreadAlignBlankPageId = `article-${article.id}-spread-align-blank-before-title`;

              newPages.push({
                id: spreadAlignBlankPageId,
                pageNumber: pageNum,
                type: "layout",
                layoutId: "article-text-layout",
                alt: "Blank page",
              });

              newLayoutState[spreadAlignBlankPageId] = {
                blocks: [
                  {
                    type: "markdown",
                    content: ``,
                    _id: `md-${spreadAlignBlankPageId}`,
                  },
                ],
              };

              pageNum++;
            }

            // Page 1 for every article: title + subtitle + Editorial + byline.
            const titlePageId = `article-${article.id}-title`;
            const titleHeadingPrefix = getTitleHeadingPrefix(
              article.title,
              articleSubtitle,
            );
            const titlePageMarkdown = [
              `${titleHeadingPrefix} **${article.title}**`,
              getSubtitleMarkdown(articleSubtitle),
              "Editorial",
              "By Jolie Lizana",
              article.__publicationDateLabel
                ? `Published ${article.__publicationDateLabel}`
                : "",
            ]
              .filter(Boolean)
              .join("\n\n");

            newPages.push({
              id: titlePageId,
              pageNumber: pageNum,
              type: "layout",
              layoutId: "article-text-layout",
              alt: article.title + " Title",
            });
            newLayoutState[titlePageId] = {
              blocks: [
                {
                  type: "markdown",
                  content: titlePageMarkdown,
                  _id: `md-${titlePageId}`,
                },
              ],
            };

            newToc.push({
              id: `toc-article-${article.id}`,
              title: article.title,
              pageNumber: pageNum,
              level: 0,
            });
            pageNum++;

            // Page 2, only when the piece has a real image. Pieces without images go straight to story text.
            if (hasArticleImage) {
              const imagePageId = `article-${article.id}-image`;
              newPages.push({
                id: imagePageId,
                pageNumber: pageNum,
                type: "layout",
                layoutId: "article-image-layout",
                alt: article.title + " Image",
              });
              newLayoutState[imagePageId] = {
                blocks: [
                  {
                    type: "image",
                    src: imageUrl,
                    alt: imageAlt,
                    _id: `img-${imagePageId}`,
                  },
                ],
              };
              pageNum++;
            }

            extraImageUrls.forEach(
              (extraImageUrl, extraImageIndex) => {
                const extraImagePageId = `article-${article.id}-extra-image-${extraImageIndex + 1}`;

                newPages.push({
                  id: extraImagePageId,
                  pageNumber: pageNum,
                  type: "layout",
                  layoutId: "article-image-layout",
                  alt: `${article.title} Image ${extraImageIndex + 2}`,
                });

                newLayoutState[extraImagePageId] = {
                  blocks: [
                    {
                      type: "image",
                      src: extraImageUrl,
                      alt: `${article.title} image ${extraImageIndex + 2}`,
                      _id: `img-${extraImagePageId}`,
                    },
                  ],
                };

                pageNum++;
              },
            );

            // Story text always begins on a new page after the title page and optional image page.
            let currentChunk = "";
            let currentWeight = 0;

            // These weight limits intentionally stop article text before the lower safe margin.
            // Paragraphs may split across pages, so the generator can use the available space
            // without letting text run too close to the bottom edge.
            const TARGET_WEIGHT_PER_PAGE = 1160;
            const HARD_WEIGHT_PER_PAGE = 1240;

            const getWeight = (
              text: string,
              isContinuation = false,
            ) => {
              const normalized = text
                .replace(/\s+/g, " ")
                .trim();
              let weight = normalized.length;

              if (!isContinuation) {
                // Paragraph spacing costs vertical room. Keep this lower than before so pages do not under-fill.
                weight += 28;
              }

              const lines = text.split("\n");
              for (const line of lines) {
                const trimmed = line.trim();
                const headingMatch =
                  trimmed.match(/^(#{2,6})\s+/);

                if (headingMatch) {
                  // Markdown section headings take more vertical room than their character count suggests.
                  // Count that top/bottom heading space so generated article pages stop before the lower margin.
                  const headingLevel = headingMatch[1].length;
                  weight +=
                    headingLevel <= 2
                      ? 160
                      : headingLevel === 3
                        ? 135
                        : 115;
                }

                if (
                  trimmed.startsWith("- ") ||
                  trimmed.startsWith("* ") ||
                  trimmed.match(/^\d+\.\s/)
                ) {
                  weight += 28;
                }
                if (trimmed.length > 0 && trimmed.length < 45) {
                  weight += 18;
                }
              }

              // Extra cost for explicit line breaks inside list-like sections.
              weight += Math.max(0, lines.length - 1) * 24;
              return weight;
            };

            const splitLongSentence = (sentence: string) => {
              const cleanSentence = sentence.trim();
              if (cleanSentence.length <= 260)
                return [cleanSentence];

              const commaPieces = cleanSentence
                .split(/(?<=[,;:])\s+/)
                .filter(Boolean);

              if (
                commaPieces.length > 1 &&
                commaPieces.every(
                  (piece) => piece.length <= 320,
                )
              ) {
                return commaPieces;
              }

              const words = cleanSentence
                .split(/\s+/)
                .filter(Boolean);
              const chunks: string[] = [];
              let chunk = "";

              for (const word of words) {
                const next = chunk ? `${chunk} ${word}` : word;
                if (next.length > 230 && chunk) {
                  chunks.push(chunk);
                  chunk = word;
                } else {
                  chunk = next;
                }
              }

              if (chunk) chunks.push(chunk);
              return chunks;
            };

            // Split paragraphs finely enough that leftover bottom whitespace can be filled,
            // including safe paragraph splits when a paragraph is too large for the remaining page.
            const splitIntoPieces = (text: string) => {
              if (text.includes("\n")) {
                return text
                  .split("\n")
                  .map((line) => line.trim())
                  .filter(Boolean);
              }

              const sentencePieces = text.match(
                /[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g,
              ) || [text];
              return sentencePieces
                .flatMap(splitLongSentence)
                .filter(Boolean);
            };

            const appendText = (
              text: string,
              forceParagraphBreak = false,
            ) => {
              const trimmed = text.trim();
              if (!trimmed) return;

              const addition = currentChunk
                ? `${forceParagraphBreak ? "\n\n" : " "}${trimmed}`
                : trimmed;

              currentChunk += addition;
            };

            const flushTextPage = () => {
              const strippedChunk =
                stripEditorialSignoffs(currentChunk);

              if (strippedChunk.trim().length > 0) {
                articlePages.push({
                  type: "text",
                  content: strippedChunk.trim(),
                });
              }

              currentChunk = "";
              currentWeight = 0;
            };

            const paragraphs = cleanMd.split("\n\n");
            const articlePages: {
              type: "text" | "image";
              content?: string;
              src?: string;
              alt?: string;
            }[] = [];

            for (const p of paragraphs) {
              if (p.trim() === "<!-- PAGE_BREAK -->") {
                flushTextPage();
                continue;
              }

              // Split paragraph by images so any image still receives its own page.
              const parts = p.split(/(!\[.*?\]\(.*?\))/);

              for (const part of parts) {
                if (!part) continue;

                const imgMatch = part.match(
                  /^!\[(.*?)\]\((.*?)\)$/,
                );
                if (imgMatch) {
                  flushTextPage();

                  const src = resolveAssetUrl(
                    imgMatch[2],
                    article,
                  );
                  articlePages.push({
                    type: "image",
                    src: src,
                    alt: imgMatch[1] || article.title,
                  });
                } else {
                  const text = part.trim();
                  if (text.length === 0) continue;

                  const pWeight = getWeight(text, false);

                  // If the whole paragraph fits inside the safe target, keep it together.
                  if (
                    currentWeight + pWeight <=
                    TARGET_WEIGHT_PER_PAGE
                  ) {
                    appendText(text, currentChunk.length > 0);
                    currentWeight += pWeight;
                    continue;
                  }

                  // Otherwise split it. This is intentional to reduce large blank areas at page bottoms.
                  const pieces = splitIntoPieces(text);
                  let firstPieceInParagraph = true;

                  for (const piece of pieces) {
                    const pieceWeight = getWeight(
                      piece,
                      !firstPieceInParagraph,
                    );
                    const limit =
                      currentWeight >= TARGET_WEIGHT_PER_PAGE
                        ? HARD_WEIGHT_PER_PAGE
                        : TARGET_WEIGHT_PER_PAGE;

                    if (
                      currentWeight > 0 &&
                      currentWeight + pieceWeight > limit
                    ) {
                      flushTextPage();
                    }

                    appendText(
                      piece,
                      firstPieceInParagraph &&
                        currentChunk.length > 0,
                    );
                    currentWeight += pieceWeight;
                    firstPieceInParagraph = false;

                    // Hard safety flush after adding a large split piece. This prevents bleed while
                    // still allowing enough text to fill the page before the split.
                    if (currentWeight >= HARD_WEIGHT_PER_PAGE) {
                      flushTextPage();
                    }
                  }
                }
              }
            }
            flushTextPage();

            articlePages.forEach((pageData, idx) => {
              if (pageData.type === "text") {
                const textPageId = `article-${article.id}-text-${idx}`;
                newPages.push({
                  id: textPageId,
                  pageNumber: pageNum,
                  type: "layout",
                  layoutId: "article-text-layout",
                  alt: article.title + ` Part ${idx + 1}`,
                });

                newLayoutState[textPageId] = {
                  blocks: [
                    {
                      type: "markdown",
                      content: stripEditorialSignoffs(
                        pageData.content || "",
                      ),
                      _id: `md-${textPageId}`,
                    },
                  ],
                };
              } else if (pageData.type === "image") {
                const imagePageId = `article-${article.id}-inline-img-${idx}`;
                newPages.push({
                  id: imagePageId,
                  pageNumber: pageNum,
                  type: "layout",
                  layoutId: "article-image-layout",
                  alt: pageData.alt || article.title,
                });

                newLayoutState[imagePageId] = {
                  blocks: [
                    {
                      type: "image",
                      src: pageData.src || "",
                      alt: pageData.alt || "",
                      _id: `img-${imagePageId}`,
                    },
                  ],
                };
              }
              pageNum++;
            });

            // Add a generated share page after every editorial/article.
            // This keeps share controls out of the GitHub article Markdown so future articles inherit it automatically.
            const sharePageId = `article-${article.id}-share`;
            newPages.push({
              id: sharePageId,
              pageNumber: pageNum,
              type: "layout",
              layoutId: "article-text-layout",
              alt: `Share ${article.title}`,
            });
            newLayoutState[sharePageId] = {
              blocks: [
                {
                  type: "share",
                  articleId: String(article.id || articleIndex),
                  articleTitle:
                    article.title || "this editorial",
                  articleUrl: getPublicArticleShareUrl(
                    article.id || articleIndex,
                  ),
                  articleExcerpt: articleShareExcerpt,
                  articleImage: imageUrl || "",
                  _id: `share-${sharePageId}`,
                },
              ],
            };
            pageNum++;

            // Insert the editable/code-designed Breathtaking Awareness sign-up ad
            // after selected PHlip-side article share pages.
            // This is article-ID based, not page-number based, so each ad stays with
            // its assigned story even as new material is added to the front of the magazine.
            const breathtakingAwarenessAdArticleIds = new Set([
              "my-delayed-ph-diagnosis-reveals-a-lesson-in-claiming-victory-over-loss",
              "the-pandoras-box-of-making-plans-and-managing-friendships-with-ph",
              "how-flashing-the-boobs-is-helping-to-save-womens-lives",
              "a-ph-advocate-finds-hope-in-new-research-anxiety-at-the-airport",
              "getting-through-the-fog-of-grief-to-see-clearly-on-the-other-side",
              "the-high-cost-of-time-spent-managing-a-chronic-illness",
              "being-mindful-of-good-moments-helps-me-through-difficult-times",
              "when-coexisting-conditions-complicate-our-health-strategy",
              "how-to-explain-the-complexities-of-pulmonary-hypertension-to-others",
              "grieving-the-mom-i-used-to-be-before-ph-entered-my-life",
              "how-i-transitioned-from-an-iv-therapy-pump-to-oral-meds",
              "im-learning-how-to-live-fully-not-just-survive-with-pulmonary-hypertension",
            ]);

            if (
              breathtakingAwarenessAdArticleIds.has(
                normalizeArticleKey(article.id || ""),
              )
            ) {
              const websiteAdPageId = `article-${article.id}-breathtaking-awareness-ad`;

              newPages.push({
                id: websiteAdPageId,
                pageNumber: pageNum,
                type: "layout",
                layoutId: "breathtaking-awareness-ad",
                alt: "Breathtaking Awareness sign-up advertisement",
              });

              newLayoutState[websiteAdPageId] = {
                blocks: [],
              };

              pageNum++;
            }

            articleIndex++;
          }

          // Finalize generated pages without page-number-specific deletions or moves.
          // Articles, images, title pages, story pages, and share pages are tied to article records,
          // not to fixed visible page numbers. Only the inside front cover keeps pageNumber 0.
          let finalPages = [...newPages];

          let currentNum = 1;
          const oldToNewPageMap: Record<number, number> = {};

          finalPages.forEach((p) => {
            if (p.id === reservedPageId) {
              oldToNewPageMap[p.pageNumber] = 0;
              p.pageNumber = 0;
              return;
            }

            oldToNewPageMap[p.pageNumber] = currentNum;
            p.pageNumber = currentNum++;
          });

          newToc.forEach((entry) => {
            if (oldToNewPageMap[entry.pageNumber]) {
              entry.pageNumber =
                oldToNewPageMap[entry.pageNumber];
            }
          });

          // Insert two blank pages after the last generated print/content page.
          // These are not tied to fixed page numbers. They always follow the current
          // final printed page, even when articles, ads, blanks, or chapters move.
          const lastPrintPageNumber = Math.max(
            ...finalPages
              .filter((p) => p.id !== reservedPageId)
              .map((p) => p.pageNumber),
          );
          const afterLastPrintBlankPageIds = [
            "after-last-print-blank-page-1",
            "after-last-print-blank-page-2",
          ];

          afterLastPrintBlankPageIds.forEach(
            (blankPageId, index) => {
              finalPages.push({
                id: blankPageId,
                pageNumber: lastPrintPageNumber + index + 1,
                type: "layout",
                layoutId: "article-text-layout",
                alt: "Blank page",
              });

              newLayoutState[blankPageId] = {
                blocks: [
                  {
                    type: "markdown",
                    content: ``,
                    _id: `md-${blankPageId}`,
                  },
                ],
              };
            },
          );

          finalPages.sort(
            (a, b) => a.pageNumber - b.pageNumber,
          );

          // Give the in-magazine "What's Inside" page live chapter targets only.
          // The full story list belongs in the top-bar/sidebar Table of Contents.
          // Page numbers are pulled from the final rendered chapter-divider pages,
          // so they update automatically whenever chapters, stories, ads, or blanks shift.
          const whatsInsideChapterTargets = [
            {
              title: "Beyond the Column",
              pageId:
                "chapter-scleroderma-foundation-of-greater-chicago-divider",
            },
            {
              title: "The PHlip-side",
              pageId: "chapter-the-phlip-side-divider",
            },
            {
              title: "Rants in Writing",
              pageId: "chapter-rants-of-the-psyche-divider",
            },
            {
              title: "Tips & Tricks",
              pageId: "chapter-tips-tricks-divider",
            },
          ];

          newLayoutState[whatsInsideRightPageId] = {
            blocks: whatsInsideChapterTargets
              .map((target) => {
                const targetPage = finalPages.find(
                  (page) => page.id === target.pageId,
                );

                if (!targetPage) return null;

                return {
                  type: "toc-entry" as const,
                  title: target.title,
                  pageNumber: String(
                    targetPage.pageNumber,
                  ).padStart(2, "0"),
                  showDivider: false,
                  _id: `whats-inside-link-${target.pageId}`,
                };
              })
              .filter(Boolean) as ContentBlock[],
          };

          // Final content cleanup runs across all generated markdown blocks after article splitting.
          // It is intentionally content-based, not visible-page-number-based.
          // Final hard cleanup for source filenames and unwanted social follow/comment text.
          // This runs across all generated markdown blocks after all page numbering,
          // article splitting, and page-specific cleanup has finished.
          Object.keys(newLayoutState).forEach((pageId) => {
            const pageState = newLayoutState[pageId];
            if (!pageState?.blocks) return;

            pageState.blocks = pageState.blocks.map((block) => {
              if (
                block.type !== "markdown" ||
                typeof block.content !== "string"
              ) {
                return block;
              }

              return {
                ...block,
                content: block.content
                  .replace(
                    /^\s*i-learn-a-hard-lesson-about-traveling-with-pulmonary-hypertension\.md\s*$/gim,
                    "",
                  )
                  .replace(
                    /i-learn-a-hard-lesson-about-traveling-with-pulmonary-hypertension\.md/g,
                    "",
                  )
                  .replace(
                    /^\s*To\s+read\s+more\s+about\s+my\s+journey\s+and\s+PH\s+awareness,\s+follow\s+me\s+at:\s*BreathtakingAwareness\.\s*$/gim,
                    "",
                  )
                  .replace(
                    /To\s+read\s+more\s+about\s+my\s+journey\s+and\s+PH\s+awareness,\s+follow\s+me\s+at:\s*BreathtakingAwareness\./gim,
                    "",
                  )
                  .replace(
                    /,?\s*["“]?Jolie\s+Lizana\s+sits\s+among\s+a\s+fall\s+pumpkin\s+display\.\s*\(Courtesy\s+of\s+Jolie\s+Lizana\)["”]?/gim,
                    "",
                  )
                  .replace(/^\s*[•·▪◦.]\s*$/gm, "")
                  .replace(
                    /Please\s+share\s+your\s+thoughts\s+in\s+the\s+comments\s+below\.\s*Follow\s+me\s+at\s+Breathtaking\s+Awareness\./gim,
                    "",
                  )
                  .replace(/[ \t]+\n/g, "\n")
                  .replace(/\n{3,}/g, "\n\n")
                  .trim(),
              };
            });
          });

          setViewerData({
            ...FALLBACK_MAGAZINE_DATA,
            totalPages: finalPages.length,
            issueTitle: "Breathtaking Awareness",
            spineText:
              "The Words We Carry • Volume I • 2025–2026",
          });
          setMagazineData(finalPages);
          setTocData(newToc);
          setLayoutState(newLayoutState);
          openSharedArticleIfPresent(finalPages);
        } else {
          throw new Error("Failed to fetch magazine content");
        }
      } catch (err) {
        console.error("Falling back to built-in magazine data:", err);
        setViewerData(FALLBACK_MAGAZINE_DATA);
        setMagazineData(FALLBACK_MAGAZINE_DATA.pages);
        setTocData(FALLBACK_MAGAZINE_DATA.toc);
        openSharedArticleIfPresent(
          FALLBACK_MAGAZINE_DATA.pages,
        );
      }

      try {
        const manifestRes = await fetch(
          getDataUrl("PUBLISH_MANIFEST_JSON"),
        );

        if (!manifestRes.ok) {
          throw new Error("Failed to fetch publish manifest");
        }

        const runtimeManifest =
          (await manifestRes.json()) as PublishManifest;
        const manifestTracks =
          runtimeManifest.music?.enabled &&
          Array.isArray(runtimeManifest.music.tracks)
            ? runtimeManifest.music.tracks
            : [];

        setManifest(runtimeManifest);
        setMusicLibrary(
          manifestTracks.length > 0
            ? manifestTracks
            : FALLBACK_MANIFEST.music.tracks,
        );
        setShowBranding(
          runtimeManifest.runtime?.brandingEnabled ?? true,
        );
      } catch (manifestErr) {
        console.error(
          "Falling back to built-in music manifest:",
          manifestErr,
        );
        setManifest(FALLBACK_MANIFEST);
        setMusicLibrary(
          FALLBACK_MANIFEST.music?.enabled &&
            Array.isArray(FALLBACK_MANIFEST.music.tracks)
            ? FALLBACK_MANIFEST.music.tracks
            : [],
        );
        setShowBranding(
          FALLBACK_MANIFEST.runtime.brandingEnabled,
        );
      }

      setIsDataLoaded(true);
    };

    fetchGithubData();

    // Load runtime.css if configured
    const loadRuntimeCss = async () => {
      try {
        const cssUrl = getDataUrl("RUNTIME_CSS");
        const response = await fetch(cssUrl);
        if (
          response.ok &&
          response.headers
            .get("content-type")
            ?.includes("text/css")
        ) {
          const cssText = await response.text();
          if (cssText && cssText.trim().length > 0) {
            const styleElement =
              document.createElement("style");
            styleElement.id = "runtime-css";
            styleElement.textContent = cssText;
            document.head.appendChild(styleElement);
          }
        }
      } catch (error) {
        // Runtime CSS is optional, silently fail
      }
    };

    // Load runtime.js if configured
    const loadRuntimeJs = async () => {
      try {
        const jsUrl = getDataUrl("RUNTIME_JS");
        const response = await fetch(jsUrl);
        if (
          response.ok &&
          (response.headers
            .get("content-type")
            ?.includes("javascript") ||
            response.headers
              .get("content-type")
              ?.includes("text/plain"))
        ) {
          const jsText = await response.text();
          // Validate that it's actually JavaScript, not HTML
          if (
            jsText &&
            jsText.trim().length > 0 &&
            !jsText.trim().startsWith("<")
          ) {
            const scriptElement =
              document.createElement("script");
            scriptElement.id = "runtime-js";
            scriptElement.textContent = jsText;
            document.body.appendChild(scriptElement);
          }
        }
      } catch (error) {
        // Runtime JS is optional, silently fail
      }
    };

    loadRuntimeCss();
    loadRuntimeJs();
  }, []);

  const WOOD_BACKGROUND_URL =
    "https://breathtakingawareness.com/wp-content/uploads/2025/12/Wood-Digital-Scrapbook-Paper-9.png";
  const backgroundImage =
    manifest?.runtime.background || WOOD_BACKGROUND_URL;

  // Preload Background Image
  useEffect(() => {
    if (!backgroundImage) {
      setIsBackgroundLoaded(true);
      return;
    }

    // Safety timeout in case image hangs
    const timeout = setTimeout(() => {
      setIsBackgroundLoaded(true);
    }, 3000);

    const img = new Image();
    img.src = backgroundImage;
    img.onload = () => {
      setIsBackgroundLoaded(true);
      clearTimeout(timeout);
    };
    img.onerror = () => {
      setIsBackgroundLoaded(true);
      clearTimeout(timeout);
    };

    return () => clearTimeout(timeout);
  }, [backgroundImage]);

  // Delayed Book Entry Logic
  useEffect(() => {
    if (isBackgroundLoaded) {
      const timer = setTimeout(() => {
        setShowIntroAnimation(true);
      }, 1200); // 1.2s delay after background loads
      return () => clearTimeout(timer);
    }
  }, [isBackgroundLoaded]);

  const coverImageUrl = viewerData?.coverImageUrl || "";
  const displayTitle = viewerData?.issueTitle || "";
  const backCoverImageUrl = viewerData?.backCoverImageUrl;
  const spineText = viewerData?.spineText || "";
  const backCoverText = viewerData?.backCoverText || "";
  const publisher = viewerData?.publisher;
  const issueNumber = viewerData?.issueNumber;
  const publicationDate = viewerData?.publicationDate;

  // Determine if we should allow scrolling based on view mode.
  const isSpread = isDesktop && !effectiveSinglePageMode;
  // Scroll mode is only for ordinary single-page reading. A turned page must fit fully.
  const isScrollMode =
    appState === "reading" && !isSpread && !isMagazineTurn;

  // Render variables to handle the scrolling container wrapper.
  // During a turn, the visible page is rotated inside ReadingView, so the
  // wrapper must use the rotated bounding-box size. Otherwise the page can clip.
  const turnRadians = (Math.abs(tiltAngle) * Math.PI) / 180;
  const turnedContentWidth =
    Math.abs(Math.cos(turnRadians)) * magazineSize.width +
    Math.abs(Math.sin(turnRadians)) * magazineSize.height;
  const turnedContentHeight =
    Math.abs(Math.sin(turnRadians)) * magazineSize.width +
    Math.abs(Math.cos(turnRadians)) * magazineSize.height;

  const contentWidth = isMagazineTurn
    ? turnedContentWidth
    : isSpread
      ? magazineSize.width * 2 + PAGE_STACK_OUTSIDE_WIDTH * 2
      : magazineSize.width;
  const contentHeight = isMagazineTurn
    ? turnedContentHeight
    : magazineSize.height;

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        className="h-full w-full overflow-hidden relative"
        style={{ backgroundColor: "#2C241B" }}
      >
        <div
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isBackgroundLoaded ? "opacity-100" : "opacity-0"}`}
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            backgroundPosition: "center center",
          }}
          aria-hidden="true"
        />

        {appState === "reading" && (
          <>
            <TopBar
              issueTitle={displayTitle}
              currentPage={currentPage}
              totalPages={magazineData.length - 1}
              isSpread={isSpread}
              showBranding={showBranding}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onBackToCover={handleBackToCover}
              onToggleTOC={handleToggleTOC}
              onToggleThumbnails={handleToggleThumbnails}
              onPageJump={handlePageJump}
              bookmarkedPages={bookmarkedPages}
              isCurrentPageBookmarked={isCurrentPageBookmarked}
              onToggleBookmark={handleToggleBookmark}
              onGoToBookmark={handleGoToBookmark}
              onClearBookmarks={handleClearBookmarks}
              canGoPrevious={canGoPrevious}
              canGoNext={canGoNext}
              isEditMode={isEditMode}
              onToggleEditMode={setIsEditMode}
              isPageLocked={isPageLocked}
              onToggleLock={setIsPageLocked}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onSave={handleSave}
              canUndo={history.length > 0}
              canRedo={future.length > 0}
              onResetLeft={() =>
                leftPageId && handleResetPage(leftPageId)
              }
              onResetRight={() =>
                rightPageId && handleResetPage(rightPageId)
              }
              onResetBoth={() => {
                if (leftPageId && rightPageId) {
                  handleResetBoth(leftPageId, rightPageId);
                } else if (leftPageId) {
                  handleResetPage(leftPageId);
                }
              }}
              canResetLeft={!!leftPageId}
              canResetRight={!!rightPageId}
              currentTilt={tiltAngle}
              onTiltChange={setTiltAngle}
              isSinglePage={effectiveSinglePageMode}
              onViewModeChange={(newMode) => {
                setIsSinglePageMode(newMode);
                setTiltAngle(0);

                // When returning to two-page spread, normalize the current page to
                // the left page of the spread so the current spread recenters cleanly.
                if (!newMode && currentPage !== "cover") {
                  const pageNumber = currentPage as number;
                  if (pageNumber > 1 && pageNumber % 2 !== 0) {
                    setCurrentPage(pageNumber - 1);
                  }
                }
              }}
              isMusicPlaying={isMusicPlaying}
              onToggleMusic={handleToggleMusic}
              musicVolume={musicVolume}
              onMusicVolumeChange={setMusicVolume}
              musicLibrary={musicLibrary}
              selectedTrackId={selectedTrackId}
              onSelectTrack={handleSelectMusicTrack}
              onPreviousTrack={handlePreviousMusicTrack}
              onNextTrack={handleNextMusicTrack}
              isRepeatingCurrentTrack={isRepeatingCurrentTrack}
              onToggleRepeatTrack={
                handleToggleRepeatCurrentTrack
              }
            />

            <LeftPanel
              isOpen={openPanel !== null}
              type={openPanel}
              tocEntries={generatedTOC}
              thumbnails={thumbnails}
              onClose={() => setOpenPanel(null)}
              onNavigate={handlePageJump}
              searchEntries={searchEntries}
              searchQuery={searchQuery}
              onSearchQueryChange={handleSearchQueryChange}
            />
          </>
        )}

        <main
          className={`absolute inset-0 flex justify-center ${
            appState === "reading" ? "pt-16" : ""
          } ${
            isScrollMode
              ? "items-start overflow-y-auto overflow-x-hidden"
              : "items-center overflow-hidden"
          }`}
          role="main"
        >
          <div
            style={{
              // If scroll mode, we set explicit dimensions to force scrollability
              // If not scroll mode (center fit), we let it be auto
              width: isScrollMode
                ? contentWidth * layoutScale
                : "auto",
              height: isScrollMode
                ? contentHeight * layoutScale
                : "auto",
              display: "flex",
              justifyContent: "center",
              alignItems: isScrollMode
                ? "flex-start"
                : "center",
              flexShrink: 0,
              // Add some padding at bottom for scroll mode so it doesn't cut off right at edge
              paddingBottom: isScrollMode ? "40px" : "0",
            }}
          >
            <div
              style={{
                transform: `scale(${layoutScale})`,
                transformOrigin: isScrollMode
                  ? "top center"
                  : "center center",
                transition: "transform 0.2s ease-out",
                // Force explicit dimensions on the transformed element so the wrapper knows what to wrap
                width: contentWidth,
                height: contentHeight,
                flexShrink: 0,
              }}
            >
              {appState === "loading" && (
                <PlaceMagazineAnimation
                  coverImageUrl={coverImageUrl}
                  isActive={showIntroAnimation}
                  issueTitle={displayTitle}
                  onComplete={handlePlaceMagazineComplete}
                  spineText={spineText}
                  backCoverImageUrl={backCoverImageUrl}
                  backCoverText={backCoverText}
                  publisher={publisher}
                  issueNumber={issueNumber}
                  publicationDate={publicationDate}
                  width={magazineSize.width}
                  height={magazineSize.height}
                />
              )}

              {appState === "closed-cover" && (
                <ClosedCover
                  coverImageUrl={coverImageUrl}
                  issueTitle={displayTitle}
                  onOpen={handleOpenMagazine}
                  spineText={spineText}
                  backCoverImageUrl={backCoverImageUrl}
                  backCoverText={backCoverText}
                  publisher={publisher}
                  issueNumber={issueNumber}
                  publicationDate={publicationDate}
                  width={magazineSize.width}
                  height={magazineSize.height}
                />
              )}

              {appState === "closed-back" && (
                <ClosedBackCover
                  coverImageUrl={coverImageUrl}
                  issueTitle={displayTitle}
                  onOpen={handleOpenMagazine}
                  width={magazineSize.width}
                  height={magazineSize.height}
                />
              )}

              {appState === "first-open" && (
                <FirstOpenAnimation
                  coverImageUrl={coverImageUrl}
                  onComplete={handleFirstOpenComplete}
                  width={magazineSize.width}
                  height={magazineSize.height}
                />
              )}

              {appState === "reading" &&
                currentPage !== "cover" && (
                  <ReadingView
                    currentPage={
                      typeof currentPage === "number"
                        ? currentPage
                        : 1
                    }
                    pages={magazineData}
                    onPrevious={handlePrevious}
                    onNext={handleNext}
                    onNavigate={handlePageJump}
                    canGoPrevious={canGoPrevious}
                    canGoNext={canGoNext}
                    tiltAngle={tiltAngle}
                    isSinglePageMode={effectiveSinglePageMode}
                    width={magazineSize.width}
                    height={magazineSize.height}
                    isPageLocked={isPageLocked}
                    isEditMode={isEditMode}
                    layoutState={layoutState}
                    onUpdateLayout={handleUpdateLayout}
                  />
                )}
            </div>
          </div>
        </main>
      </div>
    </DndProvider>
  );
}

export default App;