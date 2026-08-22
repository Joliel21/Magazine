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

function normalizeRepositoryPath(path: string): string {
  const cleanPath = path.replace(/^public\//i, "").replace(/^\/+/, "");
  return PATH_ALIASES[cleanPath] || cleanPath;
}

function isRepositoryAssetPath(path: string): boolean {
  return /^(?:images|magazine-assets|series)\//i.test(path);
}

export function resolveRrmRepositoryUrl(value?: string | null): string {
  const rawValue = String(value || "").trim();
  if (!rawValue) return "";

  if (rawValue.startsWith(OLD_MAGAZINE_PUBLIC_BASE)) {
    return `${RRM_PUBLIC_BASE}${normalizeRepositoryPath(
      rawValue.slice(OLD_MAGAZINE_PUBLIC_BASE.length),
    )}`;
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

function installFetchRewrite(): void {
  const originalFetch = window.fetch.bind(window);

  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === "string") {
      return originalFetch(resolveRrmRepositoryUrl(input), init);
    }

    if (input instanceof URL) {
      return originalFetch(new URL(resolveRrmRepositoryUrl(input.toString())), init);
    }

    const resolvedUrl = resolveRrmRepositoryUrl(input.url);
    if (resolvedUrl !== input.url) {
      return originalFetch(new Request(resolvedUrl, input), init);
    }

    return originalFetch(input, init);
  }) as typeof window.fetch;
}

/**
 * Keeps the current reader source intact while making standalone RRM builds
 * resolve repository-owned media from Joliel21/RRM. WordPress-localized URLs
 * remain untouched unless they explicitly point at the old Magazine public repo.
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
