import { createSignal } from 'solid-js'
import type { TuiPluginApi, TuiPluginModule } from '@opencode-ai/plugin/tui'
import { createConfigManager, showConfigDialog, type HudConfig } from '@openhud/config'
import { createHudStore } from './vendor/adapters/store.js'
import { HudPanel } from './components/HudPanel.js'

async function plugin(api: TuiPluginApi): Promise<void> {
  const configManager = createConfigManager(api.kv)
  const [config, setConfig] = createSignal(configManager.load())
  const store = createHudStore(api)

  const refresh = () => {
    try { store.refreshFromApi() } catch { /* silent */ }
  }

  const unsubs: (() => void)[] = []
  unsubs.push(api.event.on('message.updated', refresh))
  unsubs.push(api.event.on('command.executed', refresh))

  api.slots.register({
    slots: {
      home_bottom: () => HudPanel({ store, config, label: 'home' }),
      sidebar_content: () => HudPanel({ store, config, label: 'session' }),
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

export default {
  id: 'opencode-hud',
  tui: plugin,
} satisfies TuiPluginModule
