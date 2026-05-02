import type { TuiKV } from "@opencode-ai/plugin/tui";
import { DEFAULT_CONFIG, type HudConfig } from "./schema.js";
import { PRESETS } from "./presets.js";
import { getThresholdColor, hexToAnsi } from "./colors.js";
import { strings, t, type Lang } from "./i18n.js";
import { showConfigDialog } from "./components/ConfigDialog.js";

const STORAGE_KEY = "openhud.config";

/**
 * Create a configuration manager backed by the TUI key-value store.
 *
 * The manager provides three operations: `load` reads the persisted config
 * (falling back to DEFAULT_CONFIG), `save` writes a full config, and `update`
 * performs a read-merge-write cycle.
 *
 * @param kv - The TUI key-value store provided by the plugin API (`api.kv`)
 */
export function createConfigManager(kv: TuiKV) {
  /**
   * Load the persisted HUD configuration from the KV store.
   * Returns `DEFAULT_CONFIG` if no saved config exists or on type mismatch.
   */
  function load(): HudConfig {
    const stored = kv.get<Partial<HudConfig>>(STORAGE_KEY);
    if (!stored || typeof stored !== "object") {
      return { ...DEFAULT_CONFIG };
    }
    return mergeWithDefaults(stored);
  }

  /**
   * Persist a full HUD configuration to the KV store.
   */
  function save(config: HudConfig): void {
    kv.set(STORAGE_KEY, { ...config });
  }

  /**
   * Load the current config, apply a partial update, and persist the result.
   *
   * @param partial - A subset of HudConfig fields to merge in
   * @returns The merged (and now persisted) full HudConfig
   */
  function update(partial: Partial<HudConfig>): HudConfig {
    const current = load();
    const merged: HudConfig = {
      ...current,
      ...partial,
      // Deep-merge contextThresholds if present
      ...(partial.contextThresholds
        ? {
            contextThresholds: {
              ...current.contextThresholds,
              ...partial.contextThresholds,
            },
          }
        : {}),
    };
    save(merged);
    return merged;
  }

  return { load, save, update };
}

/**
 * Merge a partial object with DEFAULT_CONFIG to ensure all required fields
 * are present, filling in any missing keys with defaults.
 */
function mergeWithDefaults(partial: Partial<HudConfig>): HudConfig {
  const defaults = DEFAULT_CONFIG;
  const merged: HudConfig = {
    enabled: partial.enabled ?? defaults.enabled,
    compactView: partial.compactView ?? defaults.compactView,
    showModel: partial.showModel ?? defaults.showModel,
    showContextBar: partial.showContextBar ?? defaults.showContextBar,
    showToolActivity: partial.showToolActivity ?? defaults.showToolActivity,
    showTodos: partial.showTodos ?? defaults.showTodos,
    showGitBranch: partial.showGitBranch ?? defaults.showGitBranch,
    showGitDirty: partial.showGitDirty ?? defaults.showGitDirty,
    showEffort: partial.showEffort ?? defaults.showEffort,
    showSessionName: partial.showSessionName ?? defaults.showSessionName,
    showSessionCount: partial.showSessionCount ?? defaults.showSessionCount,
    showSessionDuration:
      partial.showSessionDuration ?? defaults.showSessionDuration,
    showAgentActivity:
      partial.showAgentActivity ?? defaults.showAgentActivity,
    pathLevels: (partial.pathLevels ?? defaults.pathLevels) as 1 | 2 | 3,
    language: (partial.language ?? defaults.language) as "en" | "zh",
    contextThresholds: {
      warn: partial.contextThresholds?.warn ?? defaults.contextThresholds.warn,
      danger:
        partial.contextThresholds?.danger ?? defaults.contextThresholds.danger,
    },
    elementOrder: partial.elementOrder ?? [...defaults.elementOrder],
    mergeGroups: partial.mergeGroups ?? defaults.mergeGroups,
    colorOverrides: partial.colorOverrides ?? defaults.colorOverrides,
  };
  return merged;
}

export { DEFAULT_CONFIG };
export type { HudConfig } from "./schema.js";
export { PRESETS } from "./presets.js";
export { getThresholdColor, hexToAnsi } from "./colors.js";
export type { RGBA } from "./colors.js";
export { strings, t } from "./i18n.js";
export type { Lang } from "./i18n.js";
export { showConfigDialog } from "./components/ConfigDialog.js";
