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

      const msgs = api.state.session.messages(route.params.sessionID) as unknown[]
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