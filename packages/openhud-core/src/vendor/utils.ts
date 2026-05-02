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