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
  label?: string
}

export function HudPanel(props: HudPanelProps): JSX.Element {
  if (!props.config().enabled) return <></>

  const lines: string[] = []
  const order = props.config().elementOrder

  for (const key of order) {
    const line = renderLine(key, props)
    if (line) lines.push(line)
  }

  if (lines.length === 0) {
    lines.push('◉ OpenHUD v0.1')
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
