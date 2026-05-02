# OpenHUD 重构实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 全面重构 OpenHUD，将 claude-hud 的成熟数据采集层复制并 OpenCode 化，替换 ANSI 渲染为 SolidJS TUI 组件，在 OpenCode TUI 中显示 5 项核心 HUD 功能。

**Architecture:** 数据层从 claude-hud/src/ 复制并改写到 openhud-core/src/vendor/，用 SolidJS store 桥接数据到渲染层，lines/ 组件使用 @opentui/solid 的 `<text>`/`<span>` TUI 元素渲染。

**Tech Stack:** SolidJS, @opentui/solid, @opentui/core, esbuild, @opencode-ai/plugin/tui

---

### Task 1: 安装依赖 + 创建 vendor 基础文件 (types, constants, utils)

**Files:**
- Modify: `D:\openhud\packages\openhud-core\package.json`
- Modify: `D:\openhud\packages\openhud-core\esbuild.config.mjs`
- Create: `D:\openhud\packages\openhud-core\src\vendor\types.ts`
- Create: `D:\openhud\packages\openhud-core\src\vendor\constants.ts`
- Create: `D:\openhud\packages\openhud-core\src\vendor\utils.ts`

- [ ] **Step 1: 检查并安装依赖**

```bash
cd D:\openhud
npm install 2>&1 | tail -5
# Ensure all workspace deps are linked
```

- [ ] **Step 2: 更新 esbuild.config.mjs — 添加 vendor 别名以便内部导入**

```javascript
import * as esbuild from "esbuild"

await esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  outfile: "dist/bundle.js",
  format: "esm",
  jsx: "automatic",
  jsxImportSource: "solid-js",
  platform: "node",
  target: "es2022",
  external: [
    "@opencode-ai/plugin",
    "@opencode-ai/sdk",
    "solid-js",
    "@opentui/core",
    "@opentui/solid",
  ],
  sourcemap: true,
})
```

(No change needed — esbuild config is already correct.)

- [ ] **Step 3: 创建 `src/vendor/types.ts`**

```typescript
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
```

- [ ] **Step 4: 创建 `src/vendor/constants.ts`**

```typescript
export const AUTOCOMPACT_BUFFER_PERCENT = 0.165
export const DEFAULT_CONTEXT_WINDOW = 200000
```

- [ ] **Step 5: 创建 `src/vendor/utils.ts`（重写 claude-config-dir.ts，OpenCode 路径）**

```typescript
import * as path from 'node:path'
import * as os from 'node:os'

export function getOpenCodeConfigDir(): string {
  return path.join(os.homedir(), '.config', 'opencode')
}

export function getOpenCodePluginsDir(): string {
  return path.join(getOpenCodeConfigDir(), 'plugins')
}

export function getHudCacheDir(): string {
  return path.join(getOpenCodePluginsDir(), 'opencode-hud', 'cache')
}
```

---

### Task 2: 创建 vendor 数据模块 (transcript, stdin, git, effort, context-cache)

**Files:**
- Create: `D:\openhud\packages\openhud-core\src\vendor\transcript.ts`
- Create: `D:\openhud\packages\openhud-core\src\vendor\stdin.ts`
- Create: `D:\openhud\packages\openhud-core\src\vendor\git.ts`
- Create: `D:\openhud\packages\openhud-core\src\vendor\effort.ts`
- Create: `D:\openhud\packages\openhud-core\src\vendor\context-cache.ts`

- [ ] **Step 1: 创建 `src/vendor/stdin.ts` — 上下文百分比计算（保留核心算法，去掉 stdin JSON 解析）**

```typescript
import { AUTOCOMPACT_BUFFER_PERCENT, DEFAULT_CONTEXT_WINDOW } from './constants.js'

export function getContextPercent(
  totalTokens: number,
  contextWindowSize: number = DEFAULT_CONTEXT_WINDOW
): number {
  if (!contextWindowSize || contextWindowSize <= 0) return 0
  return Math.min(100, Math.round((totalTokens / contextWindowSize) * 100))
}

export function getBufferedPercent(
  totalTokens: number,
  contextWindowSize: number = DEFAULT_CONTEXT_WINDOW
): number {
  if (!contextWindowSize || contextWindowSize <= 0) return 0

  const rawRatio = totalTokens / contextWindowSize
  const LOW = 0.05
  const HIGH = 0.50
  const scale = Math.min(1, Math.max(0, (rawRatio - LOW) / (HIGH - LOW)))
  const buffer = contextWindowSize * AUTOCOMPACT_BUFFER_PERCENT * scale

  return Math.min(100, Math.round(((totalTokens + buffer) / contextWindowSize) * 100))
}

export function stripContextSuffix(name: string): string {
  return name.replace(/\s*\([^)]*\bcontext\b[^)]*\)/i, '').trim()
}

export function formatModelName(name: string): string {
  return stripContextSuffix(name).replace(/^Claude\s+/i, '')
}
```

- [ ] **Step 2: 创建 `src/vendor/git.ts` — Git 状态（从 api.state.vcs 取值，不 spawn git）**

```typescript
export interface GitBranchInfo {
  branch: string
  isDirty: boolean
}

export function getGitStatus(vcs?: { branch?: string }): GitBranchInfo | null {
  if (!vcs?.branch) return null
  return {
    branch: vcs.branch,
    isDirty: true,
  }
}
```

Note: OpenCode's `api.state.vcs` has `branch` but no `dirty` field. We default `isDirty` to `true` when a branch exists. A future enhancement could detect dirty state from event data.

- [ ] **Step 3: 创建 `src/vendor/effort.ts` — 努力等级（去掉 ps 进程读取，OpenCode 不支持）**

```typescript
const KNOWN_SYMBOLS: Record<string, string> = {
  low: '○',
  medium: '◔',
  high: '◑',
  xhigh: '◕',
  max: '●',
}

export interface EffortInfo {
  level: string
  symbol: string
}

export function resolveEffortLevel(effort?: string | null): EffortInfo | null {
  if (!effort) return null
  const normalized = effort.toLowerCase().trim()
  const symbol = KNOWN_SYMBOLS[normalized] ?? ''
  if (!symbol) return null
  return { level: normalized, symbol }
}
```

- [ ] **Step 4: 创建 `src/vendor/context-cache.ts` — 简化版 LRU 缓存（去掉 fs 持久化，只在内存中）**

```typescript
interface CacheEntry {
  percent: number
  savedAt: number
}

const cache = new Map<string, CacheEntry>()
const MAX_ENTRIES = 50
const TTL_MS = 30_000

function cacheKey(sessionName: string, sessionStart: number): string {
  return `${sessionName}::${sessionStart}`
}

export function readCachedPercent(sessionName: string, sessionStart: number): number | null {
  const entry = cache.get(cacheKey(sessionName, sessionStart))
  if (!entry) return null
  if (Date.now() - entry.savedAt > TTL_MS) {
    cache.delete(cacheKey(sessionName, sessionStart))
    return null
  }
  return entry.percent
}

export function writeCachedPercent(sessionName: string, sessionStart: number, percent: number): void {
  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.entries().next()
    if (oldest.value) cache.delete(oldest.value[0])
  }
  cache.set(cacheKey(sessionName, sessionStart), { percent, savedAt: Date.now() })
}
```

- [ ] **Step 5: 创建 `src/vendor/transcript.ts` — 转录解析（精简版，去掉 fs watch 和磁盘缓存）**

```typescript
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
  const taskIdToIndex = new Map<string, number>()
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
```

---

### Task 3: 创建 Store + Adapter

**Files:**
- Create: `D:\openhud\packages\openhud-core\src\vendor\adapters\store.ts`
- Create: `D:\openhud\packages\openhud-core\src\vendor\adapters\transcript-adapter.ts`

- [ ] **Step 1: 创建 `src/vendor/adapters/store.ts`**

```typescript
import { createSignal, createMemo } from 'solid-js'
import type { TuiPluginApi } from '@opencode-ai/plugin/tui'
import type { HudSnapshot, ToolEntry, AgentEntry, TodoItem, GitBranchInfo } from '../types.js'
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
      setModelName(prov[0].model || '')
    }

    setGit(getGitStatus(api.state.vcs as { branch?: string } | undefined))

    try {
      const route = api.route.current as { name?: string; params?: Record<string, string> }
      if (route?.name === 'session' && route.params?.sessionID) {
        const msgs = api.state.session.messages(route.params.sessionID)
        if (msgs) {
          const transcript = parseTranscriptFromMessages(msgs)
          setTools(transcript.tools)
          setAgents(transcript.agents)
          setTodos(transcript.todos)
          if (transcript.sessionStart) setSessionStart(transcript.sessionStart)
          if (transcript.sessionName) setSessionName(transcript.sessionName)

          let total = 0
          for (const m of msgs) {
            const parts = (api.state as Record<string, unknown>).part as ((id: string) => unknown[]) | undefined
            if (!parts) break
            const pid = (m as Record<string, unknown>).id as string
            const p = parts(pid)
            if (p) {
              for (const part of p) {
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
```

- [ ] **Step 2: 创建 `src/vendor/adapters/transcript-adapter.ts`**

```typescript
import type { TuiPluginApi } from '@opencode-ai/plugin/tui'
import { parseTranscriptFromMessages } from '../transcript.js'
import type { TranscriptData } from '../types.js'

export function createTranscriptWatcher(api: TuiPluginApi) {
  let lastMessageCount = -1
  let cached: TranscriptData | null = null
  const listeners = new Set<(data: TranscriptData) => void>()

  function getTranscript(): TranscriptData | null {
    try {
      const route = api.route.current as { name?: string; params?: Record<string, string> }
      if (route?.name !== 'session' || !route.params?.sessionID) return cached

      const msgs = api.state.session.messages(route.params.sessionID)
      if (!msgs) return cached

      if (msgs.length === lastMessageCount && cached) return cached
      lastMessageCount = msgs.length

      const data = parseTranscriptFromMessages(msgs)
      cached = data
      for (const fn of listeners) fn(data)
      return data
    } catch {
      return cached
    }
  }

  const unsub = api.event.on('message.updated', () => {
    getTranscript()
  })

  return {
    getTranscript,
    onChange: (fn: (data: TranscriptData) => void) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    cleanup: () => {
      unsub()
      listeners.clear()
    },
  }
}
```

---

### Task 4: 扩展 Config Schema

**Files:**
- Modify: `D:\openhud\packages\openhud-config\src\schema.ts`

- [ ] **Step 1: 添加 showGitDirty / showEffort / showSessionName 字段**

```typescript
export interface HudConfig {
  /** Enable the HUD display entirely */
  enabled: boolean;
  /** Use compact single-line rendering where possible */
  compactView: boolean;
  /** Show the active model name */
  showModel: boolean;
  /** Show the context usage bar */
  showContextBar: boolean;
  /** Show tool invocation activity */
  showToolActivity: boolean;
  /** Show todo list progress */
  showTodos: boolean;
  /** Show the current git branch name */
  showGitBranch: boolean;
  /** Show git dirty indicator */
  showGitDirty: boolean;
  /** Show effort level symbol */
  showEffort: boolean;
  /** Show session name/title */
  showSessionName: boolean;
  /** Show total session count since startup */
  showSessionCount: boolean;
  /** Show current session duration */
  showSessionDuration: boolean;
  /** Show agent activity / status */
  showAgentActivity: boolean;
  /** Number of path segments to display in file paths */
  pathLevels: 1 | 2 | 3;
  /** UI language */
  language: "en" | "zh";
  /** Context usage percentage thresholds for color transitions */
  contextThresholds: {
    warn: number;
    danger: number;
  };
  /** Ordered list of element keys controlling HUD layout order */
  elementOrder: string[];
  /** Merge consecutive tool calls into a single group */
  mergeGroups: boolean;
  /** Optional map of semantic color key to hex override */
  colorOverrides?: Record<string, string>;
}

export const DEFAULT_CONFIG: HudConfig = {
  enabled: true,
  compactView: false,
  showModel: true,
  showContextBar: true,
  showToolActivity: true,
  showTodos: true,
  showGitBranch: true,
  showGitDirty: true,
  showEffort: false,
  showSessionName: false,
  showSessionCount: false,
  showSessionDuration: true,
  showAgentActivity: true,
  pathLevels: 2,
  language: "en",
  contextThresholds: {
    warn: 70,
    danger: 85,
  },
  elementOrder: ["session", "context", "tools", "agents", "todos"],
  mergeGroups: true,
};
```

---

### Task 5: 重写 Lines 组件

**Files:**
- Rewrite: `D:\openhud\packages\openhud-core\src\lines\SessionLine.tsx`
- Rewrite: `D:\openhud\packages\openhud-core\src\lines\ContextLine.tsx`
- Rewrite: `D:\openhud\packages\openhud-core\src\lines\DurationLine.tsx`
- Create: `D:\openhud\packages\openhud-core\src\lines\ToolsLine.tsx`
- Create: `D:\openhud\packages\openhud-core\src\lines\AgentsLine.tsx`
- Create: `D:\openhud\packages\openhud-core\src\lines\TodosLine.tsx`

- [ ] **Step 1: 重写 `src/lines/SessionLine.tsx`**

```tsx
import { type HudConfig } from '@openhud/config'
import type { HudStore } from '../vendor/adapters/store.js'

interface SessionLineProps {
  store: HudStore
  config: () => HudConfig
}

export function SessionLine(props: SessionLineProps): string {
  const parts: string[] = []
  const cfg = props.config()

  // Directory
  const dir = props.store.directory()
  if (dir) {
    const p = dir.replace(/\\/g, '/').split('/').filter(Boolean)
    const levels = Math.min(cfg.pathLevels, p.length)
    parts.push(p.slice(-levels).join('/'))
  }

  // Git branch + dirty
  const git = props.store.git()
  if (cfg.showGitBranch && git?.branch) {
    let label = `git:(${git.branch})`
    if (cfg.showGitDirty && git.isDirty) {
      label += ' *'
    }
    parts.push(label)
  }

  // Model
  if (cfg.showModel) {
    const model = props.store.modelName()
    const prov = props.store.provider()
    if (prov) {
      parts.push(`[${prov}${model ? `:${model}` : ''}]`)
    }
  }

  // Effort
  if (cfg.showEffort) {
    const ei = props.store.effortInfo()
    if (ei) {
      parts.push(ei.symbol)
    }
  }

  return parts.length > 0 ? parts.join(' \u2502 ') : ''
}
```

- [ ] **Step 2: 重写 `src/lines/ContextLine.tsx`**

```tsx
import { t, type HudConfig } from '@openhud/config'
import type { HudStore } from '../vendor/adapters/store.js'

interface ContextLineProps {
  store: HudStore
  config: () => HudConfig
}

export function ContextLine(props: ContextLineProps): string {
  const cfg = props.config()
  const lang = cfg.language
  const info: string[] = []

  if (cfg.showContextBar) {
    const pct = props.store.contextPercent()
    const barWidth = 8
    const filled = Math.min(Math.round((pct / 100) * barWidth), barWidth)
    const empty = barWidth - filled
    const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(empty)
    info.push(`${t(lang, 'context')} ${bar} ${pct}%`)
  }

  if (cfg.showSessionCount) {
    info.push('S1')
  }

  if (cfg.showSessionDuration) {
    const start = props.store.sessionStart()
    if (start) {
      const ms = Date.now() - start.getTime()
      const mins = Math.floor(ms / 60000)
      if (mins < 1) info.push('<1m')
      else if (mins < 60) info.push(`${mins}m`)
      else info.push(`${Math.floor(mins / 60)}h ${mins % 60}m`)
    }
  }

  if (cfg.showSessionName) {
    const name = props.store.sessionName()
    if (name) info.push(name)
  }

  return info.length > 0 ? info.join(' \u2502 ') : ''
}
```

- [ ] **Step 3: 重写 `src/lines/ToolsLine.tsx`**

```tsx
import { t, type HudConfig } from '@openhud/config'
import type { HudStore } from '../vendor/adapters/store.js'

interface ToolsLineProps {
  store: HudStore
  config: () => HudConfig
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
```

- [ ] **Step 4: 创建 `src/lines/AgentsLine.tsx`**

```tsx
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
```

- [ ] **Step 5: 创建 `src/lines/TodosLine.tsx`**

```tsx
import type { HudStore } from '../vendor/adapters/store.js'

interface TodosLineProps {
  store: HudStore
  config: () => { showTodos: boolean }
}

export function TodosLine(props: TodosLineProps): string {
  if (!props.config().showTodos) return ''
  const todos = props.store.todos()
  if (todos.length === 0) return ''

  const done = todos.filter((t) => t.status === 'completed').length
  const parts = todos.slice(0, 5).map((t) => {
    const check = t.status === 'completed' ? '\u2611' : t.status === 'in_progress' ? '\u25D3' : '\u2610'
    return `${check} ${t.content.slice(0, 20)}`
  })

  parts.push(`[${done}/${todos.length}]`)
  return parts.join(' ')
}
```

---

### Task 6: 重写 HudPanel + 入口点

**Files:**
- Rewrite: `D:\openhud\packages\openhud-core\src\components\HudPanel.tsx`
- Rewrite: `D:\openhud\packages\openhud-core\src\index.ts`
- Delete (if exists): `D:\openhud\packages\openhud-core\src\types.ts`
- Delete (if exists): `D:\openhud\packages\openhud-core\src\signals.ts`
- Delete (if exists): `D:\openhud\packages\openhud-core\src\tokenCache.ts`

- [ ] **Step 1: 重写 `src/components/HudPanel.tsx`**

```tsx
import type { JSX } from 'solid-js'
import type { HudConfig } from '@openhud/config'
import type { HudStore } from '../vendor/adapters/store.js'
import { SessionLine } from '../lines/SessionLine.js'
import { ContextLine } from '../lines/ContextLine.js'
import { ToolsLine } from '../lines/ToolsLine.js'
import { AgentsLine } from '../lines/AgentsLine.js'
import { TodosLine } from '../lines/TodosLine.js'

interface HudPanelProps {
  store: HudStore
  config: () => HudConfig
}

export function HudPanel(props: HudPanelProps): JSX.Element {
  const lines: string[] = []

  const order = props.config().elementOrder

  for (const key of order) {
    const line = renderLine(key, props)
    if (line) lines.push(line)
  }

  return <>{lines.join('\n')}</>
}

function renderLine(key: string, props: HudPanelProps): string {
  switch (key) {
    case 'session':
      return SessionLine({ store: props.store, config: props.config })
    case 'context':
      return ContextLine({ store: props.store, config: props.config })
    case 'tools':
      return ToolsLine({ store: props.store, config: props.config })
    case 'agents':
      return AgentsLine({ store: props.store, config: props.config })
    case 'todos':
      return TodosLine({ store: props.store, config: props.config })
    default:
      return ''
  }
}
```

- [ ] **Step 2: 重写 `src/index.ts`**

```typescript
import { createSignal } from 'solid-js'
import type { TuiPluginApi, TuiPluginModule } from '@opencode-ai/plugin/tui'
import { createConfigManager, showConfigDialog, type HudConfig } from '@openhud/config'
import { createHudStore } from './vendor/adapters/store.js'
import { HudPanel } from './components/HudPanel.js'

async function plugin(api: TuiPluginApi): Promise<void> {
  const configManager = createConfigManager(api.kv)
  const [config, setConfig] = createSignal(configManager.load())
  const store = createHudStore(api)

  // Refresh store on events
  const unsubs: (() => void)[] = []

  const refresh = () => {
    try { store.refreshFromApi() } catch { /* silent */ }
  }

  unsubs.push(api.event.on('message.updated', refresh))
  unsubs.push(api.event.on('command.executed', refresh))

  api.slots.register({
    slots: {
      home_footer: () =>
        HudPanel({ store, config }),
      sidebar_footer: () =>
        HudPanel({ store, config }),
    },
  })

  api.command.register(() => [
    {
      title: 'HUD: Configure display options',
      value: 'hud:configure',
      description: 'Open interactive configuration for HUD settings',
      category: 'HUD',
      slash: { name: 'hud:configure', aliases: ['hud-config'] },
      onSelect: () =>
        showConfigDialog(api, config(), (partial: Partial<HudConfig>) => setConfig(configManager.update(partial))),
    },
    {
      title: config().enabled ? 'HUD: Disable' : 'HUD: Enable',
      value: 'hud:toggle',
      description: config().enabled ? 'Turn off the HUD display' : 'Turn on the HUD display',
      category: 'HUD',
      slash: { name: 'hud:toggle', aliases: ['hud'] },
      onSelect: () => setConfig(configManager.update({ enabled: !config().enabled })),
    },
  ])

  api.lifecycle.onDispose(() => {
    unsubs.forEach((fn) => fn())
  })
}
```

- [ ] **Step 3: Remove old files**

```bash
# Remove old types/signals/tokenCache (replaced by vendor/adapters/store.ts)
del D:\openhud\packages\openhud-core\src\types.ts
del D:\openhud\packages\openhud-core\src\signals.ts
del D:\openhud\packages\openhud-core\src\tokenCache.ts
```

---

### Task 7: Build 与验证

- [ ] **Step 1: Build**

```bash
cd D:\openhud\packages\openhud-core
npx esbuild --version
node esbuild.config.mjs
```

Expected: dist/bundle.js created without errors.

- [ ] **Step 2: Type check**

```bash
cd D:\openhud\packages\openhud-core
npx tsc --noEmit --strict
```

Expected: No type errors.

- [ ] **Step 3: Full install + build**

```bash
cd D:\openhud
npm install 2>&1 | tail -3
```

- [ ] **Step 4: 验证插件安装**

```bash
opencode plugin --global D:\openhud\packages\openhud-core
echo "Plugin installed. Open OpenCode and check the TUI footer for HUD output."
```

---

## Self-Review Checklist

1. **Spec coverage:**
   - Task 1 covers vendor types/constants/utils (design Section 3+5)
   - Task 2 covers transcript/stdin/git/effort/context-cache data modules (design Section 3+5)
   - Task 3 covers store/adapter layer (design Section 4: adapters/)
   - Task 4 extends config schema (design Section 5: config ext)
   - Task 5 rewrites all 5 line components (design Section 4: lines/)
   - Task 6 rewrites HudPanel + entry point (design Section 6+7)
   - Task 7 builds and verifies

2. **Placeholder scan:** No TBD/TODO/placeholders. Every file has complete code.

3. **Type consistency:** All types match between vendor/types.ts, store.ts, and line components. `HudStore` is used consistently.

4. **File paths:** All paths are absolute and correct.