import React from 'react';
import ReactDOM from 'react-dom/client';
import { BookOpen, ChevronLeft, ChevronRight, Grid3X3, Home, Music, RotateCcw, RotateCw, X } from 'lucide-react';
import './styles.css';

type Page = {
  pageNumber: number;
  title?: string;
  imageUrl: string;
  alt?: string;
};

type TocEntry = {
  id: string;
  title: string;
  pageNumber: number;
  pageRange?: string;
};

type ViewerJson = {
  schemaVersion: string;
  issueId: string;
  issueTitle: string;
  spineText?: string;
  publisher?: string;
  issueNumber?: string;
  publicationDate?: string;
  coverImageUrl: string;
  backCoverImageUrl?: string;
  backCoverText?: string;
  toc: TocEntry[];
  pages: Page[];
};

type MusicTrack = {
  id: string;
  name: string;
  type?: string;
  url: string;
};

type PublishManifest = {
  schemaVersion: string;
  issueId: string;
  publication: {
    displayTitle: string;
    publicationDate?: string;
    publicUrl?: string;
  };
  runtime: {
    brandingEnabled: boolean;
    brandName: string;
    background: string;
    primaryColor: string;
    analyticsEnabled?: boolean;
  };
  music: {
    enabled: boolean;
    tracks: MusicTrack[];
  };
  features: {
    toc: boolean;
    thumbnails: boolean;
    pageJump: boolean;
    tiltControls: boolean;
    singlePageToggle: boolean;
    keyboardNavigation: boolean;
    swipeNavigation: boolean;
  };
};

type ReaderState = 'loading' | 'closed-cover' | 'reading' | 'closed-back' | 'error';

const DEFAULT_ISSUE_ID = '2026-05-26';
const FALLBACK_BACKGROUND = 'https://breathtakingawareness.com/wp-content/uploads/2025/12/Wood-Digital-Scrapbook-Paper-9.png';

function getIssueId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('issue') || DEFAULT_ISSUE_ID;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.json() as Promise<T>;
}

function ScreenReaderStatus({ message }: { message: string }) {
  return (
    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {message}
    </div>
  );
}

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }>(
  ({ children, className = '', ...props }, ref) => (
    <button ref={ref} className={`btn ${className}`} {...props}>
      {children}
    </button>
  )
);
Button.displayName = 'Button';

function Header({
  title,
  brandName,
  brandingEnabled,
  currentPage,
  totalPages,
  spread,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
  onBackToCover,
  onToggleToc,
  onToggleThumbnails,
  onPageJump
}: {
  title: string;
  brandName: string;
  brandingEnabled: boolean;
  currentPage: number;
  totalPages: number;
  spread: boolean;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onBackToCover: () => void;
  onToggleToc: () => void;
  onToggleThumbnails: () => void;
  onPageJump: (page: number) => void;
}) {
  const [jumpValue, setJumpValue] = React.useState('');
  const [jumpError, setJumpError] = React.useState('');
  const label = spread && currentPage < totalPages ? `Pages ${currentPage}-${currentPage + 1} of ${totalPages}` : `Page ${currentPage} of ${totalPages}`;

  function submitJump(event: React.FormEvent) {
    event.preventDefault();
    const page = Number.parseInt(jumpValue, 10);
    if (!Number.isFinite(page) || page < 1 || page > totalPages) {
      setJumpError(`Enter 1-${totalPages}`);
      return;
    }
    setJumpError('');
    setJumpValue('');
    onPageJump(page);
  }

  return (
    <header className="reader-header" role="banner">
      <div className="header-left">
        {brandingEnabled && (
          <div className="brand-pill" aria-label={brandName}>
            <BookOpen size={16} />
            <span>{brandName}</span>
          </div>
        )}
        <h1>{title}</h1>
      </div>
      <div className="page-status" aria-live="polite">{label}</div>
      <div className="header-actions">
        <Button onClick={onPrevious} disabled={!canGoPrevious} aria-label="Previous page"><ChevronLeft size={20} /></Button>
        <Button onClick={onNext} disabled={!canGoNext} aria-label="Next page"><ChevronRight size={20} /></Button>
        <form className="page-jump" onSubmit={submitJump}>
          <label className="sr-only" htmlFor="page-jump">Jump to page</label>
          <input
            id="page-jump"
            value={jumpValue}
            onChange={(event) => {
              setJumpValue(event.target.value);
              setJumpError('');
            }}
            placeholder="Go to..."
            aria-invalid={jumpError ? 'true' : 'false'}
          />
          {jumpError && <span role="alert">{jumpError}</span>}
        </form>
        <Button onClick={onToggleToc} aria-label="Toggle table of contents"><BookOpen size={20} /></Button>
        <Button onClick={onToggleThumbnails} aria-label="Toggle thumbnails"><Grid3X3 size={20} /></Button>
        <Button onClick={onBackToCover} aria-label="Back to cover"><Home size={20} /></Button>
      </div>
    </header>
  );
}

function ClosedMagazine({
  viewer,
  onOpen,
  endMode = false
}: {
  viewer: ViewerJson;
  onOpen: () => void;
  endMode?: boolean;
}) {
  const [rotation, setRotation] = React.useState(endMode ? { x: -8, y: 160 } : { x: 0, y: 0 });
  const drag = React.useRef<{ startX: number; startY: number; startRotX: number; startRotY: number; moved: boolean } | null>(null);

  React.useEffect(() => {
    function move(event: MouseEvent) {
      if (!drag.current) return;
      const dx = event.clientX - drag.current.startX;
      const dy = event.clientY - drag.current.startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) drag.current.moved = true;
      setRotation({ x: drag.current.startRotX - dy * 0.45, y: drag.current.startRotY + dx * 0.45 });
    }
    function up() {
      drag.current = null;
    }
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, []);

  function startDrag(event: React.MouseEvent) {
    drag.current = { startX: event.clientX, startY: event.clientY, startRotX: rotation.x, startRotY: rotation.y, moved: false };
  }

  function clickOpen() {
    if (!drag.current?.moved) onOpen();
  }

  return (
    <div className="closed-wrap">
      <div
        className="closed-stage"
        role="img"
        tabIndex={0}
        aria-label={endMode ? 'Closed magazine back cover' : 'Closed magazine cover'}
        onMouseDown={startDrag}
        onDoubleClick={clickOpen}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') onOpen();
        }}
      >
        <div className="closed-book" style={{ transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` }}>
          <div className="book-face book-front">
            <img src={viewer.coverImageUrl} alt={`${viewer.issueTitle} cover`} draggable={false} />
          </div>
          <div className="book-face book-back">
            {viewer.backCoverImageUrl ? (
              <img src={viewer.backCoverImageUrl} alt={`${viewer.issueTitle} back cover`} draggable={false} />
            ) : (
              <div className="back-cover-text">
                <strong>{viewer.issueTitle}</strong>
                <span>{endMode ? 'End of Issue' : viewer.backCoverText || viewer.publisher || 'Breathtaking Awareness'}</span>
              </div>
            )}
          </div>
          <div className="book-spine"><span>{(viewer.spineText || viewer.issueTitle).toUpperCase()}</span></div>
          <div className="book-pages book-pages-right" />
          <div className="book-pages book-pages-top" />
          <div className="book-pages book-pages-bottom" />
        </div>
      </div>
      <div className="cover-actions">
        <Button className="primary" onClick={onOpen}>{endMode ? 'Read Again' : 'Open Magazine'}</Button>
        <Button onClick={() => setRotation(endMode ? { x: -8, y: 160 } : { x: 0, y: 0 })}><RotateCw size={16} /> Reset Orientation</Button>
      </div>
    </div>
  );
}

function SidePanel({
  type,
  viewer,
  onClose,
  onNavigate
}: {
  type: 'toc' | 'thumbnails' | null;
  viewer: ViewerJson;
  onClose: () => void;
  onNavigate: (page: number) => void;
}) {
  const closeRef = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    if (!type) return;
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [type, onClose]);

  if (!type) return null;

  return (
    <>
      <div className="overlay" onClick={onClose} aria-hidden="true" />
      <aside className="side-panel" role="complementary" aria-label={type === 'toc' ? 'Table of contents' : 'Page thumbnails'}>
        <div className="panel-head">
          <h2>{type === 'toc' ? 'Table of Contents' : 'Thumbnails'}</h2>
          <Button ref={closeRef} onClick={onClose} aria-label="Close panel"><X size={20} /></Button>
        </div>
        {type === 'toc' ? (
          <nav aria-label="Magazine sections" className="toc-list">
            {viewer.toc.map((entry) => (
              <button key={entry.id} onClick={() => onNavigate(entry.pageNumber)}>
                <span>{entry.title}</span>
                <small>{entry.pageRange || `p${entry.pageNumber}`}</small>
              </button>
            ))}
          </nav>
        ) : (
          <div className="thumb-grid" role="list" aria-label="Page thumbnails">
            {viewer.pages.map((page) => (
              <button key={page.pageNumber} onClick={() => onNavigate(page.pageNumber)} role="listitem" aria-label={`Go to page ${page.pageNumber}`}>
                <img src={page.imageUrl} alt={`Page ${page.pageNumber}`} />
                <span>{page.pageNumber}</span>
              </button>
            ))}
          </div>
        )}
      </aside>
    </>
  );
}

function ReaderControls({
  manifest,
  musicOn,
  setMusicOn,
  selectedTrack,
  setSelectedTrack,
  singlePage,
  setSinglePage,
  tilt,
  setTilt
}: {
  manifest: PublishManifest;
  musicOn: boolean;
  setMusicOn: (value: boolean) => void;
  selectedTrack: string;
  setSelectedTrack: (id: string) => void;
  singlePage: boolean;
  setSinglePage: (value: boolean) => void;
  tilt: number;
  setTilt: (value: number) => void;
}) {
  const [musicMenu, setMusicMenu] = React.useState(false);
  const tracks = manifest.music.tracks || [];

  function cycleTilt() {
    const next = tilt === 0 ? 45 : tilt === 45 ? 90 : tilt === 90 ? -45 : tilt === -45 ? -90 : 0;
    setTilt(next);
  }

  return (
    <div className="floating-controls">
      {musicMenu && (
        <div className="music-menu">
          <h3>Select Music</h3>
          {tracks.length ? tracks.map((track) => (
            <button key={track.id} onClick={() => { setSelectedTrack(track.id); setMusicOn(true); setMusicMenu(false); }}>
              <strong>{track.type || track.name}</strong>
              <span>{track.name}</span>
            </button>
          )) : <p>No music configured.</p>}
        </div>
      )}
      {manifest.music.enabled && (
        <Button onClick={() => selectedTrack ? setMusicOn(!musicOn) : setMusicMenu(!musicMenu)} onContextMenu={(event) => { event.preventDefault(); setMusicMenu(!musicMenu); }} aria-label="Toggle music">
          <Music size={18} />
          {musicOn ? <span className="live-dot" /> : null}
        </Button>
      )}
      {manifest.features.singlePageToggle && (
        <Button onClick={() => { setSinglePage(!singlePage); setTilt(0); }} aria-label="Toggle single page view"><BookOpen size={18} /></Button>
      )}
      {manifest.features.tiltControls && (
        <Button onClick={cycleTilt} aria-label={`Current tilt ${tilt} degrees`}><RotateCcw size={18} /><span>{tilt}°</span></Button>
      )}
    </div>
  );
}

function MagazinePages({
  viewer,
  page,
  spread,
  singlePage,
  tilt,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext
}: {
  viewer: ViewerJson;
  page: number;
  spread: boolean;
  singlePage: boolean;
  tilt: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const touchStart = React.useRef<{ x: number; y: number } | null>(null);
  const first = viewer.pages.find((item) => item.pageNumber === page);
  const second = spread && !singlePage ? viewer.pages.find((item) => item.pageNumber === page + 1) : null;

  function touchBegin(event: React.TouchEvent) {
    touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }

  function touchEnd(event: React.TouchEvent) {
    if (!touchStart.current) return;
    const dx = event.changedTouches[0].clientX - touchStart.current.x;
    const dy = event.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx > 0 && canGoPrevious) onPrevious();
      if (dx < 0 && canGoNext) onNext();
    }
    touchStart.current = null;
  }

  return (
    <div className={`page-stage ${singlePage ? 'single' : 'spread'} tilt-${Math.abs(tilt)}`} onTouchStart={touchBegin} onTouchEnd={touchEnd}>
      <div className="page-stack" style={{ transform: `rotate(${tilt}deg)` }}>
        <div className="paper-stack left-stack" aria-hidden="true" />
        {first && (
          <article className="mag-page left-page">
            <img src={first.imageUrl} alt={first.alt || first.title || `Page ${first.pageNumber}`} />
            {canGoPrevious && <button className="page-hit previous" onClick={onPrevious} aria-label="Previous page" />}
          </article>
        )}
        {!singlePage && <div className="gutter" aria-hidden="true" />}
        {second && (
          <article className="mag-page right-page">
            <img src={second.imageUrl} alt={second.alt || second.title || `Page ${second.pageNumber}`} />
            {canGoNext && <button className="page-hit next" onClick={onNext} aria-label="Next page" />}
          </article>
        )}
        {!second && !singlePage && <div className="mag-page blank-page" aria-hidden="true" />}
        <div className="paper-stack right-stack" aria-hidden="true" />
      </div>
    </div>
  );
}

function App() {
  const [state, setState] = React.useState<ReaderState>('loading');
  const [viewer, setViewer] = React.useState<ViewerJson | null>(null);
  const [manifest, setManifest] = React.useState<PublishManifest | null>(null);
  const [error, setError] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [panel, setPanel] = React.useState<'toc' | 'thumbnails' | null>(null);
  const [singlePage, setSinglePage] = React.useState(false);
  const [tilt, setTilt] = React.useState(0);
  const [musicOn, setMusicOn] = React.useState(false);
  const [selectedTrack, setSelectedTrack] = React.useState('');
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    const issueId = getIssueId();
    const base = `./issues/${issueId}`;
    Promise.all([
      fetchJson<ViewerJson>(`${base}/viewer.json`),
      fetchJson<PublishManifest>(`${base}/publish_manifest.json`)
    ]).then(([viewerData, manifestData]) => {
      setViewer(viewerData);
      setManifest(manifestData);
      document.title = manifestData.publication.displayTitle || viewerData.issueTitle || 'BTA Magazine';
      setState('closed-cover');
    }).catch((loadError: Error) => {
      setError(loadError.message);
      setState('error');
    });
  }, []);

  React.useEffect(() => {
    if (!manifest?.features.keyboardNavigation) return;
    function onKey(event: KeyboardEvent) {
      if (state !== 'reading') return;
      if (event.key === 'ArrowLeft') goPrevious();
      if (event.key === 'ArrowRight') goNext();
      if (event.key === 'Home') backToCover();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  React.useEffect(() => {
    const track = manifest?.music.tracks.find((item) => item.id === selectedTrack);
    if (!track) {
      audioRef.current?.pause();
      audioRef.current = null;
      return;
    }
    if (!audioRef.current || audioRef.current.src !== track.url) {
      audioRef.current?.pause();
      audioRef.current = new Audio(track.url);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.45;
    }
    if (musicOn) {
      audioRef.current.play().catch(() => setMusicOn(false));
    } else {
      audioRef.current.pause();
    }
  }, [manifest, selectedTrack, musicOn]);

  const spread = window.innerWidth >= 768;
  const totalPages = viewer?.pages.length || 0;
  const canGoPrevious = state === 'reading';
  const canGoNext = state === 'reading';

  function openMagazine() {
    setPage(1);
    setState('reading');
  }

  function backToCover() {
    setPanel(null);
    setState('closed-cover');
  }

  function goPrevious() {
    setPage((current) => {
      if (current <= 1) {
        setState('closed-cover');
        return 1;
      }
      return spread && !singlePage ? Math.max(1, current - 2) : Math.max(1, current - 1);
    });
  }

  function goNext() {
    setPage((current) => {
      const next = spread && !singlePage ? current + 2 : current + 1;
      if (next > totalPages) {
        setState('closed-back');
        return current;
      }
      return next;
    });
  }

  function jumpToPage(targetPage: number) {
    const normalized = spread && !singlePage && targetPage % 2 === 0 ? targetPage - 1 : targetPage;
    setPage(Math.max(1, Math.min(totalPages, normalized)));
    setState('reading');
    setPanel(null);
  }

  if (state === 'error') {
    return (
      <main className="error-screen">
        <h1>BTA Magazine could not load.</h1>
        <p>{error}</p>
        <p>Check that the issue folder exists and contains `viewer.json` and `publish_manifest.json`.</p>
      </main>
    );
  }

  if (!viewer || !manifest) {
    return (
      <main className="loading-screen">
        <div>Loading BTA Magazine...</div>
      </main>
    );
  }

  const displayTitle = manifest.publication.displayTitle || viewer.issueTitle;
  const background = manifest.runtime.background || FALLBACK_BACKGROUND;

  return (
    <div className="app-shell" style={{ '--primary': manifest.runtime.primaryColor || '#7c3aed' } as React.CSSProperties}>
      <div className="reader-bg" style={{ backgroundImage: `url(${background})` }} aria-hidden="true" />
      {state === 'reading' && (
        <Header
          title={displayTitle}
          brandName={manifest.runtime.brandName}
          brandingEnabled={manifest.runtime.brandingEnabled}
          currentPage={page}
          totalPages={totalPages}
          spread={spread && !singlePage}
          canGoPrevious={canGoPrevious}
          canGoNext={canGoNext}
          onPrevious={goPrevious}
          onNext={goNext}
          onBackToCover={backToCover}
          onToggleToc={() => setPanel(panel === 'toc' ? null : 'toc')}
          onToggleThumbnails={() => setPanel(panel === 'thumbnails' ? null : 'thumbnails')}
          onPageJump={jumpToPage}
        />
      )}
      <ScreenReaderStatus message={state === 'reading' ? `Page ${page} of ${totalPages}` : displayTitle} />
      <main className={`reader-main ${state === 'reading' ? 'reading' : ''}`} role="main">
        {state === 'closed-cover' && <ClosedMagazine viewer={viewer} onOpen={openMagazine} />}
        {state === 'closed-back' && <ClosedMagazine viewer={viewer} onOpen={openMagazine} endMode />}
        {state === 'reading' && (
          <MagazinePages
            viewer={viewer}
            page={page}
            spread={spread}
            singlePage={singlePage}
            tilt={tilt}
            canGoPrevious={canGoPrevious}
            canGoNext={canGoNext}
            onPrevious={goPrevious}
            onNext={goNext}
          />
        )}
      </main>
      {state === 'reading' && (
        <>
          <SidePanel type={panel} viewer={viewer} onClose={() => setPanel(null)} onNavigate={jumpToPage} />
          <ReaderControls
            manifest={manifest}
            musicOn={musicOn}
            setMusicOn={setMusicOn}
            selectedTrack={selectedTrack}
            setSelectedTrack={setSelectedTrack}
            singlePage={singlePage}
            setSinglePage={setSinglePage}
            tilt={tilt}
            setTilt={setTilt}
          />
        </>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
