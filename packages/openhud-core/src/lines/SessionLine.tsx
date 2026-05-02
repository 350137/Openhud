import { type HudConfig } from '@openhud/config'
import type { HudStore } from '../vendor/adapters/store.js'

interface SessionLineProps {
  store: HudStore
  config: () => HudConfig
}

export function SessionLine(props: SessionLineProps): string {
  const parts: string[] = []
  const cfg = props.config()

  const dir = props.store.directory()
  if (dir) {
    const p = dir.replace(/\\/g, '/').split('/').filter(Boolean)
    const levels = Math.min(cfg.pathLevels, p.length)
    parts.push(p.slice(-levels).join('/'))
  }

  const git = props.store.git()
  if (cfg.showGitBranch && git?.branch) {
    let label = `git:(${git.branch})`
    if (cfg.showGitDirty && git.isDirty) {
      label += ' *'
    }
    parts.push(label)
  }

  if (cfg.showModel) {
    const model = props.store.modelName()
    const prov = props.store.provider()
    if (prov) {
      parts.push(`[${prov}${model ? `:${model}` : ''}]`)
    }
  }

  if (cfg.showEffort) {
    const ei = props.store.effortInfo()
    if (ei) {
      parts.push(ei.symbol)
    }
  }

  return parts.length > 0 ? parts.join(' \u2502 ') : ''
}