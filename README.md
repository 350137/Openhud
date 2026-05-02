# OpenHUD

Heads-Up Display plugin for OpenCode TUI — real-time context usage, tool activity, agent status, and todo progress in your terminal.

## Features

- **Context Bar** — visual token usage indicator with warn/danger thresholds
- **Tool Activity** — live tool invocation feed with status icons (running / done / error)
- **Agent Status** — active agent tracking with type and description
- **Todo Progress** — inline todo list with completion counts
- **Session Info** — working directory, git branch, model name, session duration
- **Configurable** — toggle individual elements, reorder layout, switch presets
- **i18n** — English and Chinese (中文) language support

## Screenshots

> *Add screenshots here once the plugin is verified in TUI mode.*

## Project Structure

```
openhud/
├── packages/
│   ├── openhud-core/        # Plugin entry point, slot registration, core components
│   ├── openhud-activity/    # Tool/Agent/Todo event collection and line renderers
│   └── openhud-config/      # Config schema, presets (full/essential/minimal), i18n, colors
└── .opencode/               # Workspace config for local development
```

### Dependency Direction

```
openhud-config (leaf) ──┐
openhud-activity (leaf) ─┤──> openhud-core (entry)
```

- `@openhud/config` — zero internal dependencies
- `@openhud/activity` — zero internal dependencies
- `@openhud/core` — depends on config + activity

**Config and activity packages must never import from core.**

## Installation

### Prerequisites

- **OpenCode TUI mode** (the plugin does not load in CLI mode)
- Node.js >= 18
- npm >= 9

### From local workspace

Add to `.opencode/opencode.json`:

```json
{
  "plugin": ["path/to/packages/openhud-core"]
}
```

Then build:

```bash
npm install
npm -ws run build
```

### From npm (coming soon)

```bash
opencode plugin install @openhud/core
```

## Configuration

Open the config dialog with `/hud:configure` in OpenCode.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable/disable the HUD entirely |
| `compactView` | boolean | `false` | Use compact single-line rendering |
| `showModel` | boolean | `true` | Show active model name |
| `showContextBar` | boolean | `true` | Show context usage bar |
| `showToolActivity` | boolean | `true` | Show tool invocation activity |
| `showTodos` | boolean | `true` | Show todo list progress |
| `showGitBranch` | boolean | `true` | Show current git branch |
| `showGitDirty` | boolean | `true` | Show git dirty indicator |
| `showEffort` | boolean | `false` | Show effort level symbol |
| `showSessionName` | boolean | `false` | Show session name/title |
| `showSessionCount` | boolean | `false` | Show total session count |
| `showSessionDuration` | boolean | `true` | Show session duration |
| `showAgentActivity` | boolean | `true` | Show agent activity |
| `pathLevels` | 1 \| 2 \| 3 | `2` | Number of path segments to display |
| `language` | "en" \| "zh" | `"en"` | UI language |
| `contextThresholds.warn` | number | `70` | Context % for warning color |
| `contextThresholds.danger` | number | `85` | Context % for danger color |
| `elementOrder` | string[] | `["session","context","tools","agents","todos"]` | Element display order |
| `mergeGroups` | boolean | `true` | Merge consecutive tool calls |
| `colorOverrides` | object | — | Custom hex color overrides |

### Presets

| Preset | Description |
|--------|-------------|
| `full` | Everything enabled, expanded view |
| `essential` | Context bar + model + git branch, compact view |
| `minimal` | Context bar only, compact view |

## Commands

| Command | Description |
|---------|-------------|
| `/hud:configure` | Open interactive configuration dialog |
| `/hud:toggle` | Toggle HUD on/off |

## Slots

| Slot | Location | Description |
|------|----------|-------------|
| `home_bottom` | Home page bottom | Main HUD display |
| `sidebar_content` | Session sidebar | Session-specific HUD info |

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm -ws run build

# Type check only (no output)
cd packages/openhud-core && npx tsc --noEmit

# Watch mode
cd packages/openhud-core && npx tsc --watch

# Clean build artifacts
cd packages/openhud-core && npm run clean
```

### Tech Stack

- **Language**: TypeScript 5.7
- **UI Framework**: SolidJS 1.9 (via `@opentui/solid`)
- **Bundler**: esbuild 0.28
- **Plugin API**: `@opencode-ai/plugin` (TUI plugin system)
- **Rendering**: `@opentui/core` (terminal renderables)

### Code Conventions

- ES Module imports use `.js` / `.jsx` extensions
- SolidJS `createSignal` for reactive state management
- Immutable updates: `setXxx(prev => new Map(prev))`
- TypeScript `satisfies TuiPluginModule` for export validation

## License

MIT
