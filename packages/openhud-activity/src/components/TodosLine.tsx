import type { TodoItem } from "../types.js"

interface TodosLineProps {
  todos: () => TodoItem[]
}

export function TodosLine(props: TodosLineProps) {
  const todos = props.todos()
  if (todos.length === 0) return null

  const total = todos.length
  const completed = todos.filter((t) => t.status === "completed").length

  // Find first active (not completed) todo
  const active = todos.find((t) => t.status !== "completed")

  let line = "Todo:"

  if (active) {
    const content = active.content.length > 25
      ? active.content.slice(0, 22) + "…" // …
      : active.content
    line += ` ${content}`
  }

  if (completed === total) {
    line += ` (${total}/${total} ✓)` // ✓
  } else {
    line += ` (${completed}/${total})`
  }

  return <>{line}</>
}
