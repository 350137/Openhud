import type { TuiPluginApi } from "@opencode-ai/plugin/tui"
import { createToolsCollector } from "./collectors/tools.js"
import { createAgentsCollector } from "./collectors/agents.js"
import { createTodosCollector } from "./collectors/todos.js"

export function createActivityCollectors(api: TuiPluginApi) {
  const toolsCollector = createToolsCollector(api)
  const agentsCollector = createAgentsCollector(api)
  const todosCollector = createTodosCollector(api)

  return {
    tools: toolsCollector.tools,
    agents: agentsCollector.agents,
    todos: todosCollector.todos,
    cleanup: () => {
      toolsCollector.cleanup()
      agentsCollector.cleanup()
      todosCollector.cleanup()
    },
  }
}

export { ToolsLine } from "./components/ToolsLine.js"

export { AgentsLine } from "./components/AgentsLine.js"

export { TodosLine } from "./components/TodosLine.js"

export type { ToolCallEvent, AgentEvent, TodoItem } from "./types.js"
