import { AUTOCOMPACT_BUFFER_PERCENT, DEFAULT_CONTEXT_WINDOW } from './constants.js'

export function getContextPercent(
  totalTokens: number,
  contextWindowSize: number = DEFAULT_CONTEXT_WINDOW
): number {
  if (!contextWindowSize || contextWindowSize <= 0) return 0
  return Math.min(100, Math.round((totalTokens / contextWindowSize) * 100))
}

export function getBufferedPercent(
  totalTokens: number,
  contextWindowSize: number = DEFAULT_CONTEXT_WINDOW
): number {
  if (!contextWindowSize || contextWindowSize <= 0) return 0
  const rawRatio = totalTokens / contextWindowSize
  const LOW = 0.05
  const HIGH = 0.50
  const scale = Math.min(1, Math.max(0, (rawRatio - LOW) / (HIGH - LOW)))
  const buffer = contextWindowSize * AUTOCOMPACT_BUFFER_PERCENT * scale
  return Math.min(100, Math.round(((totalTokens + buffer) / contextWindowSize) * 100))
}

export function stripContextSuffix(name: string): string {
  return name.replace(/\s*\([^)]*\bcontext\b[^)]*\)/i, '').trim()
}

export function formatModelName(name: string): string {
  return stripContextSuffix(name).replace(/^Claude\s+/i, '')
}