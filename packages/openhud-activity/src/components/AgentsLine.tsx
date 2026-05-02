import type { AgentEvent } from "../types.js"

interface AgentsLineProps {
  agents: () => AgentEvent[]
}

export function AgentsLine(props: AgentsLineProps) {
  const agents = props.agents()
  if (agents.length === 0) return null

  // Only show running (active) agents
  const running = agents.filter((a) => a.status === "running")
  if (running.length === 0) return null

  // Show at most 2 active agents
  const visible = running.slice(0, 2)

  const parts = visible.map((a) => {
    let text = `▸ ${a.type}` // ▸
    if (a.model) text += ` [${a.model}]`
    if (a.description) text += `: ${a.description}`
    if (a.progress) text += ` (${a.progress})`
    return text
  })

  let line = parts.join(" │ ") // │

  if (running.length > 2) {
    line += ` │ +${running.length - 2} more`
  }

  return <>{line}</>
}
