// ==========================================
// IN-MEMORY CACHE & NETWORK FETCH HELPERS
// ==========================================
export const apiCache = new Map();
const cacheTimestamps = new Map();
const TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Concurrently fetch JSON with in-memory caching, 10-minute TTL, sessionStorage sync, timeout, and safe error boundary.
 */
export async function cachedFetch(url, timeoutMs = 3000, externalSignal = null) {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return null;
  }

  const cleanUrl = url.trim();

  // 1. Check in-memory cache with 10-minute TTL
  if (apiCache.has(cleanUrl)) {
    const timestamp = cacheTimestamps.get(cleanUrl);
    if (!timestamp || Date.now() - timestamp < TTL_MS) {
      return apiCache.get(cleanUrl);
    }
    // Expired
    apiCache.delete(cleanUrl);
    cacheTimestamps.delete(cleanUrl);
  }

  // 2. Check sessionStorage
  try {
    if (typeof sessionStorage !== 'undefined') {
      const stored = sessionStorage.getItem(`hd_npm:${cleanUrl}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed.t === 'number' && Date.now() - parsed.t < TTL_MS) {
          const resolvedPromise = Promise.resolve(parsed.d);
          apiCache.set(cleanUrl, resolvedPromise);
          cacheTimestamps.set(cleanUrl, parsed.t);
          return parsed.d;
        }
      }
    }
  } catch {
    // Ignore sessionStorage errors
  }

  const promise = (async () => {
    let timer = null;
    let controller = null;
    try {
      controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      if (controller) {
        timer = setTimeout(() => {
          try {
            controller.abort();
          } catch {
            // ignore abort failure
          }
        }, timeoutMs);
      }

      // Chain external abort signal if provided
      if (externalSignal) {
        if (externalSignal.aborted) {
          if (timer) clearTimeout(timer);
          return null;
        }
        externalSignal.addEventListener('abort', () => {
          try {
            controller?.abort();
          } catch {
            // ignore
          }
        }, { once: true });
      }

      const res = await fetch(cleanUrl, {
        signal: controller?.signal,
        headers: {
          Accept: 'application/json'
        }
      });

      if (timer) clearTimeout(timer);

      if (!res || !res.ok) {
        return null;
      }

      const text = await res.text();
      if (!text || !text.trim()) {
        return null;
      }

      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    } catch {
      if (timer) clearTimeout(timer);
      return null;
    }
  })();

  apiCache.set(cleanUrl, promise);

  return promise
    .then((data) => {
      if (data === null || data === undefined) {
        apiCache.delete(cleanUrl);
        cacheTimestamps.delete(cleanUrl);
      } else {
        const now = Date.now();
        cacheTimestamps.set(cleanUrl, now);
        try {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem(`hd_npm:${cleanUrl}`, JSON.stringify({ t: now, d: data }));
          }
        } catch {
          // Ignore sessionStorage quota or access errors
        }
      }
      return data;
    })
    .catch(() => {
      apiCache.delete(cleanUrl);
      cacheTimestamps.delete(cleanUrl);
      return null;
    });
}

/**
 * Fallback multi-url hedged fetcher.
 * Starts URL 0; if unanswered after 800ms, starts URL 1 in parallel.
 * Returns whichever succeeds first (ignores failures, aborts losers).
 */
export async function fetchWithFallback(urls, defaultData = null, timeoutMs = 3000, signal = null) {
  try {
    const urlList = (Array.isArray(urls) ? urls : [urls]).filter(
      (u) => Boolean(u) && typeof u === 'string' && u.trim().length > 0
    );

    if (urlList.length === 0 || signal?.aborted) {
      return defaultData;
    }

    if (urlList.length === 1) {
      const res = await cachedFetch(urlList[0], timeoutMs, signal);
      return res !== null && res !== undefined ? res : defaultData;
    }

    return await new Promise((resolve) => {
      let resolved = false;
      let completedCount = 0;
      const controllers = [];
      const timers = [];
      const startedTiers = new Set();

      const cleanup = () => {
        timers.forEach((t) => clearTimeout(t));
        controllers.forEach((c) => {
          try {
            c.abort();
          } catch {
            // ignore
          }
        });
      };

      if (signal) {
        if (signal.aborted) {
          resolve(defaultData);
          return;
        }
        signal.addEventListener('abort', () => {
          if (!resolved) {
            resolved = true;
            cleanup();
            resolve(defaultData);
          }
        }, { once: true });
      }

      function startTier(index) {
        if (resolved || index >= urlList.length || startedTiers.has(index)) return;
        startedTiers.add(index);

        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        if (controller) controllers.push(controller);

        const url = urlList[index];

        cachedFetch(url, timeoutMs, controller ? controller.signal : signal)
          .then((res) => {
            if (resolved) return;
            if (res !== null && res !== undefined) {
              resolved = true;
              cleanup();
              resolve(res);
            } else {
              completedCount++;
              // If tier failed fast and next tier hasn't started, start next tier immediately
              if (index + 1 < urlList.length && !startedTiers.has(index + 1)) {
                startTier(index + 1);
              }
              if (completedCount >= urlList.length) {
                resolved = true;
                cleanup();
                resolve(defaultData);
              }
            }
          })
          .catch(() => {
            if (resolved) return;
            completedCount++;
            if (index + 1 < urlList.length && !startedTiers.has(index + 1)) {
              startTier(index + 1);
            }
            if (completedCount >= urlList.length) {
              resolved = true;
              cleanup();
              resolve(defaultData);
            }
          });

        // Hedge: start next tier after 800ms if current tier has not answered
        if (index + 1 < urlList.length) {
          const hedgeTimer = setTimeout(() => {
            if (!resolved && !startedTiers.has(index + 1)) {
              startTier(index + 1);
            }
          }, 800);
          timers.push(hedgeTimer);
        }
      }

      startTier(0);
    });
  } catch {
    return defaultData;
  }
}
