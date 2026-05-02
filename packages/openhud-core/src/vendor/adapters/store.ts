import { createSignal, createMemo } from 'solid-js'
import type { TuiPluginApi } from '@opencode-ai/plugin/tui'
import type { ToolEntry, AgentEntry, TodoItem, GitBranchInfo } from '../types.js'
import { getContextPercent } from '../stdin.js'
import { getGitStatus } from '../git.js'
import { resolveEffortLevel } from '../effort.js'
import { parseTranscriptFromMessages } from '../transcript.js'

export function createHudStore(api: TuiPluginApi) {
  const [directory, setDirectory] = createSignal('')
  const [modelName, setModelName] = createSignal('')
  const [provider, setProvider] = createSignal('')
  const [git, setGit] = createSignal<GitBranchInfo | null>(null)
  const [contextTokens, setContextTokens] = createSignal(0)
  const [contextMax, setContextMax] = createSignal(200000)
  const [effort, setEffort] = createSignal<string | null>(null)
  const [tools, setTools] = createSignal<ToolEntry[]>([])
  const [agents, setAgents] = createSignal<AgentEntry[]>([])
  const [todos, setTodos] = createSignal<TodoItem[]>([])
  const [sessionStart, setSessionStart] = createSignal<Date | null>(null)
  const [sessionName, setSessionName] = createSignal<string | null>(null)

  const contextPercent = createMemo(() =>
    getContextPercent(contextTokens(), contextMax())
  )

  const effortInfo = createMemo(() =>
    resolveEffortLevel(effort())
  )

  function refreshFromApi() {
    const dir = api.state.path.directory ?? ''
    setDirectory(dir)

    const prov = api.state.provider
    if (prov && prov.length > 0) {
      setProvider(prov[0].name || prov[0].id || '')
      const modelKeys = prov[0].models ? Object.keys(prov[0].models) : []
      setModelName(modelKeys[0] ?? '')
    }

    setGit(getGitStatus(api.state.vcs as { branch?: string } | undefined))

    try {
      const route = api.route.current as { name?: string; params?: Record<string, string> }
      if (route?.name === 'session' && route.params?.sessionID) {
        const msgs = api.state.session.messages(route.params.sessionID) as unknown[]
        if (msgs) {
          const transcript = parseTranscriptFromMessages(msgs)
          setTools(transcript.tools)
          setAgents(transcript.agents)
          setTodos(transcript.todos)
          if (transcript.sessionStart) setSessionStart(transcript.sessionStart)
          if (transcript.sessionName) setSessionName(transcript.sessionName)

          let total = 0
          for (const m of msgs) {
            const pid = (m as Record<string, unknown>).id as string
            const p = (api.state as Record<string, unknown>).part as ((id: string) => unknown[]) | undefined
            if (!p) break
            const parts = p(pid)
            if (parts) {
              for (const part of parts) {
                const tk = (part as Record<string, unknown>).tokens
                total += typeof tk === 'number' ? tk : 0
              }
            }
          }
          setContextTokens(total)
        }
      }
    } catch {
      // Silent fail when route/session not available
    }
  }

  refreshFromApi()

  return {
    directory, modelName, provider, git,
    contextTokens, contextMax, contextPercent,
    effort, effortInfo,
    tools, agents, todos,
    sessionStart, sessionName,
    refreshFromApi,
  }
}

export type HudStore = ReturnType<typeof createHudStore>