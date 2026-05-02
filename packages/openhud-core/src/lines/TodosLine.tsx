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