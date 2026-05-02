import { t, type HudConfig } from '@openhud/config'
import type { HudStore } from '../vendor/adapters/store.js'

interface ContextLineProps {
  store: HudStore
  config: () => HudConfig
}

export function ContextLine(props: ContextLineProps): string {
  const cfg = props.config()
  const lang = cfg.language
  const info: string[] = []

  if (cfg.showContextBar) {
    const pct = props.store.contextPercent()
    const barWidth = 8
    const filled = Math.min(Math.round((pct / 100) * barWidth), barWidth)
    const empty = barWidth - filled
    const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(empty)
    info.push(`${t(lang, 'context')} ${bar} ${pct}%`)
  }

  if (cfg.showSessionCount) {
    info.push('S1')
  }

  if (cfg.showSessionDuration) {
    const start = props.store.sessionStart()
    if (start) {
      const ms = Date.now() - start.getTime()
      const mins = Math.floor(ms / 60000)
      if (mins < 1) info.push('<1m')
      else if (mins < 60) info.push(`${mins}m`)
      else info.push(`${Math.floor(mins / 60)}h ${mins % 60}m`)
    }
  }

  if (cfg.showSessionName) {
    const name = props.store.sessionName()
    if (name) info.push(name)
  }

  return info.length > 0 ? info.join(' \u2502 ') : ''
}