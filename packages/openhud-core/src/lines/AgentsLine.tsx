import type { HudStore } from '../vendor/adapters/store.js'

interface AgentsLineProps {
  store: HudStore
  config: () => { showAgentActivity: boolean }
}

export function AgentsLine(props: AgentsLineProps): string {
  if (!props.config().showAgentActivity) return ''
  const agents = props.store.agents()
  if (agents.length === 0) return ''

  const latest = agents.slice(-3)
  const parts = latest.map((a) => {
    const icon = a.status === 'running' ? '@' : '\u2713'
    const desc = a.description ? `: ${a.description.slice(0, 20)}` : ''
    return `${icon}${a.type}${desc}`
  })

  return parts.join(' \u2502 ')
}