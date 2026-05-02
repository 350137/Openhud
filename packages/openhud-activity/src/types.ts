export interface ToolCallEvent {
  tool: string        // e.g. "edit", "read", "bash"
  target?: string     // e.g. "file.ts", "src/index.ts"
  status: string      // e.g. "running", "completed", "error"
  sessionID: string
  timestamp: number
}

export interface AgentEvent {
  type: string        // e.g. "explore", "plan", "code-reviewer"
  model?: string      // e.g. "haiku", "sonnet"
  description?: string // e.g. "Finding auth code"
  progress?: string   // e.g. "2/5"
  sessionID: string
  status: string      // "running" | "completed" | "error"
  timestamp: number
}

export interface TodoItem {
  content: string
  status: string      // "pending" | "completed"
  sessionID: string
}
