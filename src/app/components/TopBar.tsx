import {
  ChevronLeft,
  ChevronRight,
  Bookmark,
  BookOpen,
  Grid3x3,
  Lock,
  LockOpen,
  Undo,
  Redo,
  Save,
  RotateCcw,
  Music,
  List,
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Repeat,
} from "lucide-react";

import { Button } from "@/app/components/ui/button";

import { PageJumpInput } from "./PageJumpInput";

import { useState } from "react";

import type { MusicTrack } from "@/app/components/MusicControl";

interface TopBarProps {
  issueTitle: string;

  currentPage: number | "cover";

  totalPages: number;

  isSpread: boolean;

  showBranding?: boolean;

  onPrevious: () => void;

  onNext: () => void;

  onBackToCover: () => void;

  onToggleTOC: () => void;

  onToggleThumbnails: () => void;

  onPageJump: (page: number) => void;

  bookmarkedPages?: number[];

  isCurrentPageBookmarked?: boolean;

  onToggleBookmark?: () => void;

  onGoToBookmark?: (page: number) => void;

  onClearBookmarks?: () => void;

  canGoPrevious: boolean;

  canGoNext: boolean;

  isEditMode: boolean;

  onToggleEditMode: (enabled: boolean) => void;

  isPageLocked: boolean;

  onToggleLock: (locked: boolean) => void;

  onUndo: () => void;

  onRedo: () => void;

  onSave: () => void;

  canUndo: boolean;

  canRedo: boolean;

  onResetLeft?: () => void;

  onResetRight?: () => void;

  onResetBoth?: () => void;

  canResetLeft?: boolean;

  canResetRight?: boolean;

  isMusicPlaying: boolean;

  onToggleMusic: (playing: boolean) => void;

  musicVolume: number;

  onMusicVolumeChange: (volume: number) => void;

  musicLibrary: MusicTrack[];

  selectedTrackId: string | null;

  onSelectTrack: (id: string | null) => void;

  onPreviousTrack?: () => void;

  onNextTrack?: () => void;

  isRepeatingCurrentTrack?: boolean;

  onToggleRepeatTrack?: () => void;

  isSinglePage: boolean;

  onViewModeChange: (isSinglePage: boolean) => void;

  currentTilt: number;

  onTiltChange: (tilt: number) => void;
}

export function TopBar({
  issueTitle,

  currentPage,

  totalPages,

  isSpread,

  showBranding = true,

  onPrevious,

  onNext,

  onBackToCover,

  onToggleTOC,

  onToggleThumbnails,

  onPageJump,

  bookmarkedPages = [],

  isCurrentPageBookmarked = false,

  onToggleBookmark,

  onGoToBookmark,

  onClearBookmarks,

  canGoPrevious,

  canGoNext,

  isEditMode,

  onToggleEditMode,

  isPageLocked,

  onToggleLock,

  onUndo,

  onRedo,

  onSave,

  canUndo,

  canRedo,

  onResetLeft,

  onResetRight,

  onResetBoth,

  canResetLeft,

  canResetRight,

  isMusicPlaying,

  onToggleMusic,

  musicVolume,

  onMusicVolumeChange,

  musicLibrary,

  selectedTrackId,

  onSelectTrack,

  onPreviousTrack,

  onNextTrack,

  isRepeatingCurrentTrack = false,

  onToggleRepeatTrack,

  isSinglePage,

  onViewModeChange,

  currentTilt,

  onTiltChange,
}: TopBarProps) {
  const [showMusicDropdown, setShowMusicDropdown] =
    useState(false);
  const [showBookmarksDropdown, setShowBookmarksDropdown] =
    useState(false);

  // Any non-zero tilt is a magazine turn. The reader should show one page first,
  // then rotate that one page. Do not wait until 90 degrees to leave spread view.
  const isMagazineTurn = currentTilt !== 0;

  const getPageIndicator = () => {
    if (currentPage === "cover") {
      return "Cover";
    }

    if (isSpread && !isMagazineTurn) {
      const pageNum = currentPage as number;

      const isEven = pageNum % 2 === 0;

      const leftNum = isEven ? pageNum : pageNum - 1;

      const rightNum = leftNum + 1;

      if (leftNum > 0 && rightNum <= totalPages) {
        return `Pages ${leftNum}–${rightNum} of ${totalPages}`;
      } else if (leftNum > 0) {
        return `Page ${leftNum} of ${totalPages}`;
      } else {
        return `Page ${rightNum} of ${totalPages}`;
      }
    }

    return `Page ${currentPage} of ${totalPages}`;
  };

  const getBookmarkLabel = (page: number) => {
    if (page <= 0) return "Inside cover";
    return `Page ${page}`;
  };

  const sortedBookmarkedPages = [...bookmarkedPages].sort(
    (a, b) => a - b,
  );

  const commonButtonClasses =
    "text-[#AF9355] hover:bg-[#113143]/50 hover:text-[#D1B880] disabled:opacity-30 disabled:hover:bg-transparent";

  const selectedTrack = musicLibrary.find(
    (track) => track.id === selectedTrackId,
  );

  const groupedMusicTracks = musicLibrary.reduce(
    (groups, track) => {
      const groupName = track.type || "Music";

      if (!groups[groupName]) {
        groups[groupName] = [];
      }

      groups[groupName].push(track);
      return groups;
    },
    {} as Record<string, MusicTrack[]>,
  );

  const musicGroupNames = Object.keys(groupedMusicTracks).sort(
    (a, b) => a.localeCompare(b),
  );

  const handleSelectTrack = (trackId: string) => {
    onSelectTrack(trackId);
    onToggleMusic(true);
    setShowMusicDropdown(false);
  };

  const handleMusicOff = () => {
    onToggleMusic(false);
    onSelectTrack(null);
    setShowMusicDropdown(false);
  };

  const handleMusicClick = () => {
    // Keep the music note as the dropdown opener.
    // Play/pause is handled inside the dropdown so track selection remains visible.
    setShowBookmarksDropdown(false);
    setShowMusicDropdown(!showMusicDropdown);
  };

  const handleViewModeClick = () => {
    // Keep this control available at all times. If the reader is tilted,
    // clicking this exits the forced one-page turn and returns to spread mode.
    onViewModeChange(!isSinglePage);
  };

  const handleTiltClick = () => {
    let nextTilt = 0;

    if (currentTilt === 0) {
      nextTilt = 45;
    } else if (currentTilt === 45) {
      nextTilt = 90;
    } else if (currentTilt === 90) {
      nextTilt = -45;
    } else if (currentTilt === -45) {
      nextTilt = -90;
    } else {
      nextTilt = 0;
    }

    onTiltChange(nextTilt);
  };

  return (
    <header
      className="absolute top-0 left-0 right-0 z-40 transition-colors duration-300 bg-[#0A1C27] border-b border-[#267999]/30"
      role="banner"
    >
      <div className="flex items-center h-16 px-4 gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {showBranding && (
            <button
              type="button"
              onClick={onBackToCover}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-transparent rounded-md select-none border-none shrink-0 hover:bg-[#113143]/50 transition-colors"
              title="Back to Cover"
              aria-label="Go to magazine cover"
            >
              <span
                className="text-sm md:text-lg truncate select-none font-semibold tracking-wider"
                style={{ color: "#F8F3E8" }}
              >
                Breathtaking Awareness
              </span>
            </button>
          )}

          {issueTitle &&
            issueTitle !== "Breathtaking Awareness" && (
              <h1 className="hidden xl:block text-sm md:text-base text-[#D1B880] truncate select-none font-medium max-w-[220px]">
                {issueTitle}
              </h1>
            )}

          <div className="hidden md:flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleTOC}
              aria-label="Toggle table of contents"
              title="Table of Contents"
              className="text-[#AF9355] hover:bg-[#113143]/50 hover:text-[#D1B880]"
            >
              <List className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleThumbnails}
              aria-label="Toggle thumbnails"
              title="Thumbnails"
              className="text-[#AF9355] hover:bg-[#113143]/50 hover:text-[#D1B880]"
            >
              <Grid3x3 className="w-5 h-5" />
            </Button>

            <button
              onClick={handleTiltClick}
              className="relative p-2 rounded-full bg-transparent text-[#AF9355] hover:bg-[#113143]/50 transition-all duration-200"
              title={`Tilt: ${currentTilt}°`}
              aria-label={`Tilt magazine view. Current tilt is ${currentTilt} degrees.`}
            >
              <RotateCcw
                className="w-4 h-4"
                style={{
                  transform: `rotate(${currentTilt}deg)`,
                }}
              />

              {currentTilt !== 0 && (
                <span className="absolute -top-1 -right-1 text-[9px] font-bold text-[#0A1C27] bg-[#AF9355] rounded-full w-4 h-4 flex items-center justify-center">
                  {Math.abs(currentTilt)}
                </span>
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => {
                  setShowMusicDropdown(false);
                  setShowBookmarksDropdown(
                    !showBookmarksDropdown,
                  );
                }}
                className={`relative p-2 rounded-full transition-all duration-200 ${
                  isCurrentPageBookmarked
                    ? "bg-[#AF9355] text-[#0A1C27] hover:bg-[#D1B880]"
                    : "bg-transparent text-[#AF9355] hover:bg-[#113143]/50"
                }`}
                title="Save or open bookmarks"
                aria-label="Save or open bookmarks"
                aria-pressed={isCurrentPageBookmarked}
              >
                <Bookmark
                  className={`w-4 h-4 ${
                    isCurrentPageBookmarked
                      ? "fill-current"
                      : ""
                  }`}
                />

                {sortedBookmarkedPages.length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#AF9355] text-[#0A1C27] text-[9px] font-bold leading-4 text-center">
                    {sortedBookmarkedPages.length}
                  </span>
                )}
              </button>

              {showBookmarksDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() =>
                      setShowBookmarksDropdown(false)
                    }
                  />

                  <div
                    className="absolute top-full left-0 mt-2 w-56 bg-[#0A1C27]/95 backdrop-blur-lg rounded-lg shadow-2xl border border-[#267999]/30 overflow-hidden z-40"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-2 border-b border-[#267999]/20 bg-white/5">
                      <h3 className="text-[#AF9355] font-medium text-xs">
                        Bookmarks
                      </h3>
                    </div>

                    <button
                      onClick={() => {
                        onToggleBookmark?.();
                      }}
                      disabled={
                        currentPage === "cover" ||
                        !onToggleBookmark
                      }
                      className="w-full text-left px-3 py-2 border-b border-[#267999]/20 text-[#AF9355] hover:bg-white/10 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
                    >
                      <div className="text-sm font-medium">
                        {isCurrentPageBookmarked
                          ? "Remove this bookmark"
                          : "Bookmark this page"}
                      </div>
                      <div className="text-xs mt-0.5 text-[#AF9355]/60">
                        {currentPage === "cover"
                          ? "Open the magazine to save a page"
                          : getBookmarkLabel(currentPage)}
                      </div>
                    </button>

                    <div className="max-h-56 overflow-y-auto">
                      {sortedBookmarkedPages.length > 0 ? (
                        sortedBookmarkedPages.map((page) => (
                          <button
                            key={page}
                            onClick={() => {
                              onGoToBookmark?.(page);
                              setShowBookmarksDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 text-[#AF9355] hover:bg-white/10 transition-colors"
                          >
                            <div className="text-sm font-medium">
                              {getBookmarkLabel(page)}
                            </div>
                            <div className="text-xs mt-0.5 text-[#AF9355]/60">
                              Go to saved place
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center text-[#AF9355]/60 text-xs leading-relaxed">
                          No saved bookmarks yet.
                        </div>
                      )}
                    </div>

                    {sortedBookmarkedPages.length > 0 && (
                      <button
                        onClick={() => {
                          onClearBookmarks?.();
                          setShowBookmarksDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 border-t border-[#267999]/20 text-[#AF9355]/80 hover:bg-white/10 transition-colors"
                      >
                        Clear all bookmarks
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {currentPage !== "cover" && (
          <div
            className="sm:hidden absolute top-full left-0 right-0 py-1 px-4 text-center text-xs text-[#AF9355] select-none bg-[#0A1C27]/95 border-b border-[#267999]/30"
            aria-live="polite"
            aria-atomic="true"
          >
            {getPageIndicator()}
          </div>
        )}

        <div className="absolute left-1/2 -translate-x-1/2 hidden lg:flex items-center justify-center gap-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrevious}
            disabled={!canGoPrevious}
            aria-label="Previous page"
            className={`${commonButtonClasses} px-1.5`}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div
            className="flex-shrink-0 min-w-[142px] text-center text-sm text-[#AF9355] select-none"
            aria-live="polite"
            aria-atomic="true"
          >
            {getPageIndicator()}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onNext}
            disabled={!canGoNext}
            aria-label="Next page"
            className={`${commonButtonClasses} px-1.5`}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-1">
            {currentPage !== "cover" && (
              <div className="text-white hidden sm:block">
                <PageJumpInput
                  totalPages={totalPages}
                  onPageJump={onPageJump}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 px-1 py-1 bg-transparent">
            {currentPage !== "cover" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackToCover}
                aria-label="Back to cover"
                title="Back to Cover"
                className="text-[#AF9355] hover:bg-[#113143]/50 hover:text-[#D1B880]"
              >
                <img
                  src="https://raw.githubusercontent.com/Joliel21/Magazine/main/public/images/brand/gold-logo.png"
                  alt=""
                  aria-hidden="true"
                  className="h-[72px] w-auto max-w-[112px] object-contain"
                />
              </Button>
            )}

            <button
              onClick={handleViewModeClick}
              className="p-2 rounded-full bg-transparent text-[#AF9355] hover:bg-[#113143]/50 transition-all duration-200"
              title={
                isSinglePage
                  ? "Single Page View — click for Two Page Spread"
                  : "Two Page Spread — click for Single Page View"
              }
              aria-label={
                isSinglePage
                  ? "Switch to two page spread"
                  : "Switch to single page view"
              }
            >
              <BookOpen
                className={`w-4 h-4 ${isSinglePage ? "opacity-60" : ""}`}
              />
            </button>
          </div>

          <div className="h-8 w-px bg-[#AF9355]/40 mx-1" />

          <div
            className="relative flex items-center gap-1 rounded-full px-2 py-1 bg-transparent"
            style={{ backgroundColor: "transparent" }}
          >
            {showMusicDropdown && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowMusicDropdown(false)}
                />

                <div
                  className="absolute top-full right-0 mt-2 w-56 bg-[#0A1C27]/95 backdrop-blur-lg rounded-lg shadow-2xl border border-[#267999]/30 overflow-hidden z-40"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-2 border-b border-[#267999]/20 bg-white/5">
                    <h3 className="text-[#AF9355] font-medium text-xs">
                      Select Music
                    </h3>
                  </div>

                  <div className="flex items-center justify-center gap-4 border-b border-[#267999]/20 bg-[#113143]/30 px-3 py-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          !selectedTrackId &&
                          musicLibrary.length > 0
                        ) {
                          onSelectTrack(musicLibrary[0].id);
                        }

                        onToggleMusic(true);
                      }}
                      disabled={musicLibrary.length === 0}
                      className="p-2 rounded-full text-[#AF9355] hover:bg-white/10 hover:text-[#D1B880] transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
                      title="Play music"
                      aria-label="Play music"
                    >
                      <Play className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleMusic(false)}
                      disabled={!selectedTrackId}
                      className="p-2 rounded-full text-[#AF9355] hover:bg-white/10 hover:text-[#D1B880] transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
                      title="Pause music"
                      aria-label="Pause music"
                    >
                      <Pause className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={handleMusicOff}
                      disabled={
                        !selectedTrackId && !isMusicPlaying
                      }
                      className="p-2 rounded-full text-[#AF9355] hover:bg-white/10 hover:text-[#D1B880] transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
                      title="Stop music"
                      aria-label="Stop music"
                    >
                      <Square className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="border-b border-[#267999]/20 bg-[#113143]/30 px-3 py-2">
                    <div className="flex items-center justify-between gap-3 text-xs text-[#AF9355]">
                      <span className="select-none">
                        Volume
                      </span>
                      <span className="select-none text-[#AF9355]/70">
                        {Math.round(musicVolume * 100)}%
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={Math.round(musicVolume * 100)}
                      onChange={(e) =>
                        onMusicVolumeChange(
                          Number(e.target.value) / 100,
                        )
                      }
                      className="mt-2 w-full accent-[#AF9355]"
                      aria-label="Music volume"
                    />
                  </div>

                  <div className="max-h-64 overflow-y-auto">
                    {musicLibrary.length > 0 ? (
                      musicGroupNames.map((groupName) => (
                        <div key={groupName}>
                          <div className="px-3 pt-3 pb-1 text-[10px] font-semibold tracking-wide text-[#F8F3E8]/80 select-none">
                            {groupName}
                          </div>

                          {groupedMusicTracks[groupName].map(
                            (track) => {
                              const isSelected =
                                track.id === selectedTrackId;

                              return (
                                <button
                                  key={track.id}
                                  onClick={() =>
                                    handleSelectTrack(track.id)
                                  }
                                  className={`w-full text-left px-3 py-2 hover:bg-white/10 transition-colors ${
                                    isSelected
                                      ? "bg-[#AF9355] text-[#0A1C27]"
                                      : "text-[#AF9355]"
                                  }`}
                                >
                                  <div className="text-sm font-medium">
                                    {track.name}
                                  </div>

                                  {track.attribution && (
                                    <div
                                      className={`text-xs mt-0.5 ${isSelected ? "text-[#0A1C27]/70" : "text-[#AF9355]/60"}`}
                                    >
                                      {track.attribution}
                                    </div>
                                  )}
                                </button>
                              );
                            },
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-[#AF9355]/60 text-xs leading-relaxed">
                        <div className="mb-2 font-medium">
                          No music configured
                        </div>

                        <div className="text-[#AF9355]/50">
                          Add tracks to publish_manifest.json
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {selectedTrack && (
              <div className="hidden xl:flex max-w-[150px] flex-col leading-tight select-none">
                <span className="text-[10px] uppercase tracking-wide text-[#AF9355]/60">
                  Now playing
                </span>
                <span className="truncate text-xs text-[#AF9355]">
                  {selectedTrack.name}
                </span>
              </div>
            )}

            <button
              onClick={onPreviousTrack}
              disabled={
                !onPreviousTrack || musicLibrary.length < 2
              }
              className="p-2 rounded-full bg-transparent text-[#AF9355] hover:bg-[#113143]/50 transition-all duration-200 disabled:opacity-30 disabled:hover:bg-transparent"
              title="Previous music track"
              aria-label="Previous music track"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={handleMusicClick}
              onContextMenu={(e) => {
                e.preventDefault();

                setShowMusicDropdown(!showMusicDropdown);
              }}
              className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 overflow-hidden ${
                isMusicPlaying
                  ? "bg-[#AF9355] text-[#0A1C27] hover:bg-[#D1B880]"
                  : "bg-transparent text-[#AF9355] hover:bg-[#113143]/50"
              }`}
              title="Open music menu"
              aria-label="Open music menu"
            >
              <Music className="w-4 h-4" />
            </button>

            <button
              onClick={onNextTrack}
              disabled={!onNextTrack || musicLibrary.length < 2}
              className="p-2 rounded-full bg-transparent text-[#AF9355] hover:bg-[#113143]/50 transition-all duration-200 disabled:opacity-30 disabled:hover:bg-transparent"
              title="Next music track"
              aria-label="Next music track"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={onToggleRepeatTrack}
              disabled={
                !onToggleRepeatTrack || !selectedTrackId
              }
              className={`p-2 rounded-full transition-all duration-200 disabled:opacity-30 disabled:hover:bg-transparent ${
                isRepeatingCurrentTrack
                  ? "bg-[#AF9355] text-[#0A1C27] hover:bg-[#D1B880]"
                  : "bg-transparent text-[#AF9355] hover:bg-[#113143]/50"
              }`}
              title={
                isRepeatingCurrentTrack
                  ? "Repeat current song is on"
                  : "Repeat current song"
              }
              aria-label={
                isRepeatingCurrentTrack
                  ? "Turn off repeat current song"
                  : "Repeat current song"
              }
              aria-pressed={isRepeatingCurrentTrack}
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1 ml-2">
            {isEditMode && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onUndo}
                  disabled={!canUndo}
                  aria-label="Undo"
                  title="Undo"
                  className={commonButtonClasses}
                >
                  <Undo className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRedo}
                  disabled={!canRedo}
                  aria-label="Redo"
                  title="Redo"
                  className={commonButtonClasses}
                >
                  <Redo className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSave}
                  aria-label="Save"
                  title="Save Changes"
                  className="text-[#AF9355] hover:bg-[#113143]/50 hover:text-[#D1B880]"
                >
                  <Save className="w-4 h-4" />
                </Button>

                {(canResetLeft || canResetRight) && (
                  <>
                    <div className="w-px h-6 bg-[#267999]/30 mx-1" />

                    {canResetLeft && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onResetLeft}
                        aria-label="Reset Left Page"
                        title="Reset Left Page Layout"
                        className="text-red-300 hover:text-red-200 hover:bg-red-900/30"
                      >
                        <div className="flex items-center">
                          <RotateCcw className="w-3 h-3 mr-1" />

                          <span className="text-[10px] font-bold">
                            L
                          </span>
                        </div>
                      </Button>
                    )}

                    {canResetLeft && canResetRight && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onResetBoth}
                        aria-label="Reset Both Pages"
                        title="Reset Both Pages"
                        className="text-red-300 hover:text-red-200 hover:bg-red-900/30"
                      >
                        <div className="flex items-center">
                          <RotateCcw className="w-3 h-3 mr-1" />

                          <span className="text-[10px] font-bold">
                            ALL
                          </span>
                        </div>
                      </Button>
                    )}

                    {canResetRight && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onResetRight}
                        aria-label="Reset Right Page"
                        title="Reset Right Page Layout"
                        className="text-red-300 hover:text-red-200 hover:bg-red-900/30"
                      >
                        <div className="flex items-center">
                          <RotateCcw className="w-3 h-3 mr-1" />

                          <span className="text-[10px] font-bold">
                            R
                          </span>
                        </div>
                      </Button>
                    )}
                  </>
                )}

                <div className="w-px h-6 bg-[#267999]/30 mx-1" />

                <Button
                  variant={
                    isPageLocked ? "destructive" : "outline"
                  }
                  size="sm"
                  onClick={() => onToggleLock(!isPageLocked)}
                  aria-label={
                    isPageLocked ? "Unlock Page" : "Lock Page"
                  }
                  title={
                    isPageLocked
                      ? "Unlock Page Navigation"
                      : "Lock Page Navigation (Enable Drag/Resize)"
                  }
                  className={
                    isPageLocked
                      ? "bg-red-600 hover:bg-red-700 text-white border-none"
                      : "text-[#AF9355] border-[#AF9355]/50 hover:bg-[#113143]/50 hover:text-[#D1B880] bg-transparent"
                  }
                >
                  {isPageLocked ? (
                    <Lock className="w-4 h-4" />
                  ) : (
                    <LockOpen className="w-4 h-4" />
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}