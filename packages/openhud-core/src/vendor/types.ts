export interface ToolEntry {
  id: string
  name: string
  target?: string
  status: 'running' | 'completed' | 'error'
  startTime: Date
  endTime?: Date
}

export interface AgentEntry {
  id: string
  type: string
  model?: string
  description?: string
  status: 'running' | 'completed'
  startTime: Date
  endTime?: Date
}

export interface TodoItem {
  content: string
  status: 'pending' | 'in_progress' | 'completed'
}

export interface SessionTokenUsage {
  inputTokens: number
  outputTokens: number
  cacheCreationTokens: number
  cacheReadTokens: number
}

export interface TranscriptData {
  tools: ToolEntry[]
  agents: AgentEntry[]
  todos: TodoItem[]
  sessionStart?: Date
  sessionName?: string
  lastAssistantResponseAt?: Date
  sessionTokens?: SessionTokenUsage
  lastCompactBoundaryAt?: Date
  lastCompactPostTokens?: number
}

export interface GitBranchInfo {
  branch: string
  isDirty: boolean
}

export interface HudSnapshot {
  modelName: string
  provider: string
  directory: string
  git: GitBranchInfo | null
  contextPercent: number
  contextTokens: number
  contextMax: number
  effortLevel: string | null
  effortSymbol: string | null
  tools: ToolEntry[]
  agents: AgentEntry[]
  todos: TodoItem[]
  sessionStart: Date | null
  sessionDuration: number
  sessionName: string | null
}