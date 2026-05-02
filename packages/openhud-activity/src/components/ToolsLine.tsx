import type { ToolCallEvent } from "../types.js"

interface ToolsLineProps {
  tools: () => ToolCallEvent[]
}

function getStatusIcon(status: string): string {
  switch (status) {
    case "running":
      return "◐" // ◐
    case "completed":
      return "✓" // ✓
    case "error":
      return "✗" // ✗
    default:
      return "?"
  }
}

export function ToolsLine(props: ToolsLineProps) {
  const tools = props.tools()
  if (tools.length === 0) return null

  // Take up to 3 most recent entries
  const recent = tools.slice(-3)

  // Deduplicate consecutive identical tools (oldest to newest)
  const groups: { tool: string; target?: string; status: string; count: number }[] = []

  for (const t of recent) {
    const last = groups[groups.length - 1]
    if (last && last.tool === t.tool) {
      last.count++
      last.status = t.status
      last.target = t.target ?? last.target
    } else {
      groups.push({ tool: t.tool, target: t.target, status: t.status, count: 1 })
    }
  }

  // Build display line
  const parts = groups.map((g) => {
    const icon = getStatusIcon(g.status)
    let text = `${icon} ${g.tool}`
    if (g.target) text += `: ${g.target}`
    if (g.count > 1) text += ` ×${g.count}` // ×
    return text
  })

  let line = parts.join(" │ ") // │

  // Truncate to ~60 characters
  if (line.length > 60) {
    line = line.slice(0, 57) + "…" // …
  }

  return <>{line}</>
}
