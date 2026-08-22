const RRM_PUBLIC_BASE =
  "https://raw.githubusercontent.com/Joliel21/RRM/main/magazine-source/public/";
const OLD_MAGAZINE_PUBLIC_BASE =
  "https://raw.githubusercontent.com/Joliel21/Magazine/main/public/";

const PATH_ALIASES: Record<string, string> = {
  "images/bsyndro.png": "images/bardet_biedl_syndrome.png",
  "images/previous-and-spotlight-editions.png":
    "images/rare-pages/previous-and-spotlight-editions.png",
  "images/charity-partners-spread.png":
    "images/rare-pages/charity-partners-spread.png",
  "images/media-centre-spread.png":
    "images/rare-pages/media-centre-spread.png",
};

const RRM_DATA_ROUTES: Record<string, string> = {
  "/branding.json": `${RRM_PUBLIC_BASE}branding.json`,
  "/publish_manifest.json": `${RRM_PUBLIC_BASE}publish_manifest.json`,
  "/content/front-matter.json": `${RRM_PUBLIC_BASE}content/front-matter.json`,
};

const EMPTY_JSON_ROUTES: Record<string, unknown> = {
  "/viewer.json": {},
  "/content/articles.json": [],
  "/content/chapters.json": [],
  "/content/chapter-descriptions.json": {},
  "/content/magazine-manifest.json": {},
};

function normalizeRepositoryPath(path: string): string {
  const cleanPath = path.replace(/^public\//i, "").replace(/^\/+/, "");
  return PATH_ALIASES[cleanPath] || cleanPath;
}

function isRepositoryAssetPath(path: string): boolean {
  return /^(?:images|magazine-assets|series)\//i.test(path);
}

function pathFromUrl(value: string): string {
  try {
    return new URL(value, window.location.href).pathname;
  } catch {
    const clean = value.split(/[?#]/, 1)[0] || "";
    return clean.startsWith("/") ? clean : `/${clean}`;
  }
}

function routeForRrmData(value: string): string | null {
  const pathname = pathFromUrl(value);
  return RRM_DATA_ROUTES[pathname] || null;
}

function emptyJsonForRoute(value: string): unknown | undefined {
  const pathname = pathFromUrl(value);
  return EMPTY_JSON_ROUTES[pathname];
}

export function resolveRrmRepositoryUrl(value?: string | null): string {
  const rawValue = String(value || "").trim();
  if (!rawValue) return "";

  const dataRoute = routeForRrmData(rawValue);
  if (dataRoute) return dataRoute;

  if (rawValue.startsWith(OLD_MAGAZINE_PUBLIC_BASE)) {
    const relativePath = normalizeRepositoryPath(
      rawValue.slice(OLD_MAGAZINE_PUBLIC_BASE.length),
    );

    const legacyDataRoute = routeForRrmData(`/${relativePath}`);
    if (legacyDataRoute) return legacyDataRoute;

    if (isRepositoryAssetPath(relativePath)) {
      return `${RRM_PUBLIC_BASE}${relativePath}`;
    }

    return rawValue;
  }

  if (/^(?:data:|blob:)/i.test(rawValue) || rawValue.startsWith("//")) {
    return rawValue;
  }

  if (/^https?:/i.test(rawValue)) {
    return rawValue;
  }

  const normalizedPath = normalizeRepositoryPath(rawValue);
  if (!isRepositoryAssetPath(normalizedPath)) return rawValue;

  return `${RRM_PUBLIC_BASE}${normalizedPath}`;
}

function rewriteStyleValue(styleValue: string): string {
  return styleValue.replace(/url\((['"]?)([^)'"\s]+)\1\)/gi, (_match, quote, url) => {
    const resolved = resolveRrmRepositoryUrl(url);
    return `url(${quote}${resolved}${quote})`;
  });
}

function rewriteElementAssets(element: Element): void {
  for (const attribute of ["src", "poster"]) {
    const currentValue = element.getAttribute(attribute);
    if (!currentValue) continue;
    const resolvedValue = resolveRrmRepositoryUrl(currentValue);
    if (resolvedValue !== currentValue) {
      element.setAttribute(attribute, resolvedValue);
    }
  }

  const srcset = element.getAttribute("srcset");
  if (srcset) {
    const resolvedSrcset = srcset
      .split(",")
      .map((candidate) => {
        const trimmed = candidate.trim();
        if (!trimmed) return trimmed;
        const [url, ...descriptor] = trimmed.split(/\s+/);
        return [resolveRrmRepositoryUrl(url), ...descriptor].join(" ");
      })
      .join(", ");
    if (resolvedSrcset !== srcset) element.setAttribute("srcset", resolvedSrcset);
  }

  const style = element.getAttribute("style");
  if (style && style.includes("url(")) {
    const resolvedStyle = rewriteStyleValue(style);
    if (resolvedStyle !== style) element.setAttribute("style", resolvedStyle);
  }
}

function rewriteSubtree(root: ParentNode): void {
  if (root instanceof Element) rewriteElementAssets(root);
  root.querySelectorAll?.("[src], [srcset], [poster], [style*='url(']").forEach(
    rewriteElementAssets,
  );
}

function syntheticJsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function installFetchRewrite(): void {
  const originalFetch = window.fetch.bind(window);

  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const originalUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    const emptyPayload = emptyJsonForRoute(originalUrl);
    if (emptyPayload !== undefined) {
      return Promise.resolve(syntheticJsonResponse(emptyPayload));
    }

    const pathname = pathFromUrl(originalUrl);
    if (pathname === "/runtime.css") {
      return Promise.resolve(
        new Response("", {
          status: 200,
          headers: { "Content-Type": "text/css; charset=utf-8" },
        }),
      );
    }
    if (pathname === "/runtime.js") {
      return Promise.resolve(
        new Response("", {
          status: 200,
          headers: { "Content-Type": "text/javascript; charset=utf-8" },
        }),
      );
    }

    const resolvedUrl = resolveRrmRepositoryUrl(originalUrl);

    if (typeof input === "string") {
      return originalFetch(resolvedUrl, init);
    }

    if (input instanceof URL) {
      return originalFetch(new URL(resolvedUrl), init);
    }

    if (resolvedUrl !== input.url) {
      return originalFetch(new Request(resolvedUrl, input), init);
    }

    return originalFetch(input, init);
  }) as typeof window.fetch;
}

/**
 * Keeps the current reader source intact while making standalone RRM builds
 * resolve repository-owned content and media from Joliel21/RRM. Missing legacy
 * feeds return valid empty payloads instead of Vite's index.html fallback.
 */
export function installRrmRuntime(): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const runtimeWindow = window as Window & { __rrmRuntimeInstalled?: boolean };
  if (runtimeWindow.__rrmRuntimeInstalled) return;
  runtimeWindow.__rrmRuntimeInstalled = true;

  installFetchRewrite();
  rewriteSubtree(document);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "attributes" && mutation.target instanceof Element) {
        rewriteElementAssets(mutation.target);
      }

      for (const node of mutation.addedNodes) {
        if (node instanceof Element) rewriteSubtree(node);
      }
    }
  });

  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["src", "srcset", "poster", "style"],
  });
}
