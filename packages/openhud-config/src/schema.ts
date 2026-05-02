export interface HudConfig {
  /** Enable the HUD display entirely */
  enabled: boolean;
  /** Use compact single-line rendering where possible */
  compactView: boolean;
  /** Show the active model name */
  showModel: boolean;
  /** Show the context usage bar */
  showContextBar: boolean;
  /** Show tool invocation activity */
  showToolActivity: boolean;
  /** Show todo list progress */
  showTodos: boolean;
  /** Show the current git branch name */
  showGitBranch: boolean;
  /** Show git dirty indicator */
  showGitDirty: boolean;
  /** Show effort level symbol */
  showEffort: boolean;
  /** Show session name/title */
  showSessionName: boolean;
  /** Show total session count since startup */
  showSessionCount: boolean;
  /** Show current session duration */
  showSessionDuration: boolean;
  /** Show agent activity / status */
  showAgentActivity: boolean;
  /** Number of path segments to display in file paths */
  pathLevels: 1 | 2 | 3;
  /** UI language */
  language: "en" | "zh";
  /** Context usage percentage thresholds for color transitions */
  contextThresholds: {
    warn: number;
    danger: number;
  };
  /** Ordered list of element keys controlling HUD layout order */
  elementOrder: string[];
  /** Merge consecutive tool calls into a single group */
  mergeGroups: boolean;
  /** Optional map of semantic color key to hex override */
  colorOverrides?: Record<string, string>;
}

export const DEFAULT_CONFIG: HudConfig = {
  enabled: true,
  compactView: false,
  showModel: true,
  showContextBar: true,
  showToolActivity: true,
  showTodos: true,
  showGitBranch: true,
  showGitDirty: true,
  showEffort: false,
  showSessionName: false,
  showSessionCount: false,
  showSessionDuration: true,
  showAgentActivity: true,
  pathLevels: 2,
  language: "en",
  contextThresholds: {
    warn: 70,
    danger: 85,
  },
  elementOrder: ["session", "context", "tools", "agents", "todos"],
  mergeGroups: true,
};
