const KNOWN_SYMBOLS: Record<string, string> = {
  low: '\u25CB',
  medium: '\u25D4',
  high: '\u25D1',
  xhigh: '\u25D5',
  max: '\u25CF',
}

export interface EffortInfo {
  level: string
  symbol: string
}

export function resolveEffortLevel(effort?: string | null): EffortInfo | null {
  if (!effort) return null
  const normalized = effort.toLowerCase().trim()
  const symbol = KNOWN_SYMBOLS[normalized] ?? ''
  if (!symbol) return null
  return { level: normalized, symbol }
}