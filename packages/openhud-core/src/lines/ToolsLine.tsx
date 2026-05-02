import type { HudStore } from '../vendor/adapters/store.js'

interface ToolsLineProps {
  store: HudStore
  config: () => { showToolActivity: boolean }
}

export function ToolsLine(props: ToolsLineProps): string {
  if (!props.config().showToolActivity) return ''
  const tools = props.store.tools()
  if (tools.length === 0) return ''

  const latest = tools.slice(-5)
  const parts = latest.map((tool) => {
    const icon = tool.status === 'running' ? '>' : tool.status === 'error' ? '!' : '\u2713'
    const target = tool.target ? ` ${tool.target}` : ''
    return `${icon} ${tool.name}${target}`
  })

  return parts.join(' \u2502 ')
}