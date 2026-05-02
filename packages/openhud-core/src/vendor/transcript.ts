import type { TranscriptData, ToolEntry, AgentEntry, TodoItem, SessionTokenUsage } from './types.js'

function normalizeTokenCount(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0
  return Math.max(0, Math.trunc(value))
}

export function parseTranscriptFromMessages(
  messages: unknown[]
): TranscriptData {
  const result: TranscriptData = { tools: [], agents: [], todos: [] }
  const toolMap = new Map<string, ToolEntry>()
  const agentMap = new Map<string, AgentEntry>()
  let latestTodos: TodoItem[] = []
  const sessionTokens: SessionTokenUsage = {
    inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0,
  }

  for (const msg of messages) {
    const m = msg as Record<string, unknown>
    const role = m.role as string | undefined

    if (role === 'assistant') {
      const usage = (m.usage ?? m.tokens) as Record<string, unknown> | undefined
      if (usage) {
        sessionTokens.inputTokens += normalizeTokenCount(usage.input_tokens ?? usage.inputTokens)
        sessionTokens.outputTokens += normalizeTokenCount(usage.output_tokens ?? usage.outputTokens)
        sessionTokens.cacheCreationTokens += normalizeTokenCount(usage.cache_creation_input_tokens ?? 0)
        sessionTokens.cacheReadTokens += normalizeTokenCount(usage.cache_read_input_tokens ?? 0)
      }
    }

    const content = m.content
    if (!Array.isArray(content)) continue

    for (const block of content) {
      const b = block as Record<string, unknown>
      if (b.type === 'tool_use' && b.id && b.name) {
        const toolEntry: ToolEntry = {
          id: b.id as string,
          name: b.name as string,
          target: extractTarget(b.name as string, b.input as Record<string, unknown> | undefined),
          status: 'running',
          startTime: new Date(),
        }

        if (b.name === 'Task' || b.name === 'Agent') {
          const input = b.input as Record<string, unknown> | undefined
          agentMap.set(b.id as string, {
            id: b.id as string,
            type: (input?.subagent_type as string) ?? 'agent',
            model: (input?.model as string) ?? undefined,
            description: (input?.description as string) ?? undefined,
            status: 'running',
            startTime: new Date(),
          })
        } else if (b.name === 'TodoWrite') {
          const input = b.input as { todos?: TodoItem[] } | undefined
          if (input?.todos) {
            latestTodos = [...input.todos]
          }
        } else {
          toolMap.set(b.id as string, toolEntry)
        }
      }

      if (b.type === 'tool_result' && b.tool_use_id) {
        const tool = toolMap.get(b.tool_use_id as string)
        if (tool) {
          tool.status = b.is_error ? 'error' : 'completed'
          tool.endTime = new Date()
        }
        const agent = agentMap.get(b.tool_use_id as string)
        if (agent) {
          agent.status = 'completed'
          agent.endTime = new Date()
        }
      }
    }
  }

  result.tools = Array.from(toolMap.values()).slice(-20)
  result.agents = Array.from(agentMap.values()).slice(-10)
  result.todos = latestTodos
  result.sessionTokens = sessionTokens

  return result
}

function extractTarget(toolName: string, input?: Record<string, unknown>): string | undefined {
  if (!input) return undefined
  switch (toolName) {
    case 'Read': case 'Write': case 'Edit':
      return (input.file_path as string) ?? (input.path as string)
    case 'Glob': case 'Grep':
      return input.pattern as string
    case 'Bash':
      const cmd = input.command as string
      return cmd?.slice(0, 30) + (cmd?.length > 30 ? '...' : '')
  }
  return undefined
}