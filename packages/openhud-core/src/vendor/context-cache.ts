interface CacheEntry {
  percent: number
  savedAt: number
}

const cache = new Map<string, CacheEntry>()
const MAX_ENTRIES = 50
const TTL_MS = 30_000

function cacheKey(sessionName: string, sessionStart: number): string {
  return `${sessionName}::${sessionStart}`
}

export function readCachedPercent(sessionName: string, sessionStart: number): number | null {
  const entry = cache.get(cacheKey(sessionName, sessionStart))
  if (!entry) return null
  if (Date.now() - entry.savedAt > TTL_MS) {
    cache.delete(cacheKey(sessionName, sessionStart))
    return null
  }
  return entry.percent
}

export function writeCachedPercent(sessionName: string, sessionStart: number, percent: number): void {
  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.entries().next()
    if (oldest.value) cache.delete(oldest.value[0])
  }
  cache.set(cacheKey(sessionName, sessionStart), { percent, savedAt: Date.now() })
}