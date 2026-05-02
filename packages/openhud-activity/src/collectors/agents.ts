import { createSignal } from "solid-js"
import type { TuiPluginApi } from "@opencode-ai/plugin/tui"
import type { SessionStatus } from "@opencode-ai/sdk/v2"
import type { AgentEvent } from "../types.js"

export function createAgentsCollector(api: TuiPluginApi) {
  const [agents, setAgents] = createSignal<AgentEvent[]>([])
  const MAX_AGENTS = 5
  const COMPLETED_TTL = 30 * 1000 // 30 seconds

  const unsub = api.event.on("session.status", (e) => {
    const p = e.properties as {
      sessionID: string
      status: SessionStatus
      type?: string
      model?: string
      description?: string
      progress?: string
    }
    const sessionID = p.sessionID
    const statusObj = p.status
    const statusType = typeof statusObj === "object" && statusObj !== null
      ? (statusObj as { type: string }).type
      : String(statusObj)
    const now = Date.now()

    setAgents((prev) => {
      // Remove completed/error entries older than the TTL
      const aged = prev.filter((a) => {
        if (a.status === "completed" || a.status === "error") {
          return now - a.timestamp < COMPLETED_TTL
        }
        return true
      })

      // Only track sessions that carry agent metadata (sub-agents)
      if (p.type) {
        const existingIdx = aged.findIndex((a) => a.sessionID === sessionID)

        if (statusType === "busy") {
          // New or updated sub-agent (running)
          const agent: AgentEvent = {
            type: p.type,
            model: p.model,
            description: p.description,
            progress: p.progress,
            sessionID,
            status: "running",
            timestamp: now,
          }

          if (existingIdx >= 0) {
            // Update existing entry
            const updated = [...aged]
            updated[existingIdx] = agent
            return updated
          }

          // Add new entry, cap at MAX_AGENTS
          const result = [...aged, agent]
          return result.length > MAX_AGENTS ? result.slice(-MAX_AGENTS) : result
        }

        if ((statusType === "idle" || statusType === "completed" || statusType === "error") && existingIdx >= 0) {
          // Mark as completed or error
          const updated = [...aged]
          updated[existingIdx] = {
            ...updated[existingIdx],
            status: statusType === "error" ? "error" : "completed",
            timestamp: now,
          }
          return updated
        }
      }

      return aged
    })
  })

  return { agents, cleanup: () => unsub() }
}
