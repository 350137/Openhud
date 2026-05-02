import { createSignal } from "solid-js"
import type { TuiPluginApi } from "@opencode-ai/plugin/tui"
import type { TodoItem } from "../types.js"

export function createTodosCollector(api: TuiPluginApi) {
  const [todos, setTodos] = createSignal<TodoItem[]>([])

  const unsub = api.event.on("todo.updated", (e) => {
    const p = e.properties as { sessionID: string; todos: Array<{ content: string; status: string }> }

    setTodos((prev) => {
      // Remove previous todos for this session, add new ones
      const filtered = prev.filter((t) => t.sessionID !== p.sessionID)
      const newTodos: TodoItem[] = (p.todos || []).map((t) => ({
        content: t.content,
        status: t.status,
        sessionID: p.sessionID,
      }))
      return [...filtered, ...newTodos]
    })
  })

  return { todos, cleanup: () => unsub() }
}
