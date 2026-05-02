import { createSignal } from "solid-js"
import type { TuiPluginApi } from "@opencode-ai/plugin/tui"
import type { ToolCallEvent } from "../types.js"

export function createToolsCollector(api: TuiPluginApi) {
  const [tools, setTools] = createSignal<ToolCallEvent[]>([])
  const MAX_TOOLS = 10
  const TTL = 5 * 60 * 1000 // 5 minutes

  const unsub = api.event.on("command.executed", (e) => {
    const p = e.properties as { name: string; arguments: string; status?: string; sessionID: string }
    const now = Date.now()

    const event: ToolCallEvent = {
      tool: p.name || p.arguments || "command",
      target: p.arguments || undefined,
      status: p.status ?? "completed",
      sessionID: p.sessionID,
      timestamp: now,
    }

    setTools((prev) => {
      // Prune entries beyond TTL
      const cutoff = now - TTL
      const filtered = prev.filter((t) => t.timestamp > cutoff)
      // Add new event
      const updated = [...filtered, event]
      // Keep only the last MAX_TOOLS entries (ring buffer)
      return updated.length > MAX_TOOLS ? updated.slice(-MAX_TOOLS) : updated
    })
  })

  return { tools, cleanup: () => unsub() }
}
