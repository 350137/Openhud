export const strings = {
  en: {
    context: "Context",
    usage: "Usage",
    tools: "Tools",
    agents: "Agents",
    todos: "Todo",
    sessions: "sessions",
    session: "session",
    git: "git",
    model: "Model",
    project: "Project",
    noProject: "(no project)",
    running: "running",
    idle: "idle",
    waiting: "waiting",
    error: "error",
    completed: "done",
    configure: "Configure HUD",
    toggle: "Toggle HUD",
    configTitle: "HUD Configuration",
    enabled: "Enabled",
    disabled: "Disabled",
    compact: "Compact",
    expanded: "Expanded",
    toolActivity: "Tool Activity",
    todoProgress: "Todo Progress",
    sessionCount: "Session Count",
    pathDepth: "Path Depth",
    language: "Language",
    save: "Save",
    cancel: "Cancel",
    compacting: "compacting",
    duration: "Duration",
    preset: "Preset",
    full: "Full",
    essential: "Essential",
    minimal: "Minimal",
    contextBar: "Context Bar",
    sessionDuration: "Session Duration",
    agentActivity: "Agent Activity",
    gitBranch: "Git Branch",
  },
  zh: {
    context: "上下文",
    usage: "用量",
    tools: "工具",
    agents: "代理",
    todos: "任务",
    sessions: "个会话",
    session: "会话",
    git: "分支",
    model: "模型",
    project: "项目",
    noProject: "(无项目)",
    running: "运行中",
    idle: "空闲",
    waiting: "等待中",
    error: "错误",
    completed: "已完成",
    configure: "配置 HUD",
    toggle: "切换 HUD",
    configTitle: "HUD 配置",
    enabled: "已启用",
    disabled: "已禁用",
    compact: "紧凑",
    expanded: "展开",
    toolActivity: "工具活动",
    todoProgress: "任务进度",
    sessionCount: "会话数",
    pathDepth: "路径深度",
    language: "语言",
    save: "保存",
    cancel: "取消",
    compacting: "压缩中",
    duration: "时长",
    preset: "预设",
    full: "全部",
    essential: "精简",
    minimal: "极简",
    contextBar: "上下文条",
    sessionDuration: "会话时长",
    agentActivity: "代理活动",
    gitBranch: "Git 分支",
  },
} as const;

export type Lang = keyof typeof strings;

type StringKey<L extends Lang> = keyof (typeof strings)[L];

/**
 * Retrieve a localized string for the given language and key.
 *
 * Falls back to the key name itself if the key does not exist for the language
 * (graceful degradation for forward-compatible string tables).
 */
export function t<L extends Lang>(lang: L, key: StringKey<L>): string {
  const table = strings[lang];
  if (table && key in table) {
    return (table as Record<string, string>)[key as string];
  }
  // Fallback: try English, then return the key as-is
  if (lang !== "en" && "en" in strings) {
    const enTable = (strings as Record<string, Record<string, string>>)["en"];
    if (enTable && key in enTable) {
      return enTable[key as string];
    }
  }
  return String(key);
}
