import type { HudConfig } from "./schema.js";

/**
 * Predefined HUD configuration presets.
 * Each preset is a partial HudConfig that overrides specific fields.
 */
export const PRESETS: Record<string, Partial<HudConfig>> = {
  /**
   * Full feature set — everything enabled, expanded view.
   */
  full: {
    enabled: true,
    compactView: false,
    showModel: true,
    showContextBar: true,
    showToolActivity: true,
    showTodos: true,
    showGitBranch: true,
    showSessionCount: true,
    showSessionDuration: true,
    showAgentActivity: true,
    mergeGroups: true,
    elementOrder: ["session", "context", "tools", "agents", "todos"],
  },

  /**
   * Essential information only — context, model, and git branch.
   * Hides tools, agents, todos, session details.
   */
  essential: {
    enabled: true,
    compactView: true,
    showModel: true,
    showContextBar: true,
    showToolActivity: false,
    showTodos: false,
    showGitBranch: true,
    showSessionCount: false,
    showSessionDuration: false,
    showAgentActivity: false,
    mergeGroups: true,
    elementOrder: ["context", "git"],
  },

  /**
   * Bare minimum — only the context bar and model name.
   */
  minimal: {
    enabled: true,
    compactView: true,
    showModel: true,
    showContextBar: true,
    showToolActivity: false,
    showTodos: false,
    showGitBranch: false,
    showSessionCount: false,
    showSessionDuration: false,
    showAgentActivity: false,
    mergeGroups: false,
    elementOrder: ["context"],
  },
};
