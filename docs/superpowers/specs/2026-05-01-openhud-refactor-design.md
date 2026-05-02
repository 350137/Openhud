# OpenHUD 重构设计文档

> 基于 Claude HUD + OpenCode 的 OpenHUD 全面重构
> 日期: 2026-05-01

## 1. 目标

利用 Claude HUD 的成熟数据采集层，重构 OpenHUD 为功能完整的 HUD 插件，可在 OpenCode TUI 环境中渲染。

## 2. 约束

- 不修改 claude-hud 本地源码（`C:\Users\35013\.claude\plugins\marketplaces\claude-hud\`）
- 可复制 claude-hud 源码作为 OpenHUD 初始代码
- 基于两份学习报告：`docs/claude-hud-learning.md` + `docs/opencode-learning-report.md`
- MVP: 上下文条 + Git 状态 + 工具活动 + Agent + Todo（5 项核心功能）
- 渲染层: SolidJS TUI 组件（非 ANSI 直通）
- 数据源: 优先 transcript 解析，api.event.on() 为补充

## 3. OpenCode 化改造清单

vendor 中每个文件从 claude-hud 复制后需做以下适配：

| 文件 | 改造内容 |
|------|----------|
| `utils.ts` | **完全重写**。替换 `claude-config-dir.ts` 的 `~/.claude/` → `~/.config/opencode/` 路径解析；`getHudPluginDir()` → OpenCode 插件目录；移除 claude-specific 路径工具 |
| `transcript.ts` | 修改转录目录路径：`.claude/projects/*/transcripts/` → OpenCode 对应路径；去掉 `fs.watch` 轮询改为事件触发；保留 JSONL 解析核心逻辑 |
| `stdin.ts` | **保留上下文百分比计算核心算法**（tokens 使用 / 上限）。去掉 stdin JSON 解析（Claude Code 模式），替换为 api.state 方式获取上下文 tokens |
| `context-cache.ts` | 修改缓存路径，去掉 claude-plugin 目录依赖；保留 LRU 快照逻辑 |
| `config-reader.ts` | **重写 OpenCode 配置扫描**。不再扫描 CLAUDE.md / .claude/rules，改为扫描 `.config/opencode/` 下的配置文件；保留文件系统计数逻辑 |
| `types.ts` | 精简 claude-hud-specific 类型，扩展 OpenHUD 需要的 store 类型 |
| `git.ts` | 保留核心逻辑。`status()` 方法从 OpenHUD 的 api.state session 取值（Git 状态已有 `api.state.vcs`），不再 spawn `git` 命令 |
| `effort.ts` | 基本保留算法本身。调整输入参数来源为 OpenCode store |
| `memory/cost/external-usage/speed-tracker/debug` | 基本保留数据计算逻辑；调整输出目标（不写 ANSI 终端，改为 store 更新） |

核心原则：
- **数据采集算法保留**：上下文百分比、effort 等级、速率计算等逻辑直接复用
- **输入源替换**：文件系统路径、stdin、事件格式从 Claude Code 改为 OpenCode API
- **输出目标替换**：不再 `process.stdout.write()` ANSI，改为更新 SolidJS store

## 4. 架构

```
packages/
├── openhud-core/           # 重构: 入口 + vendor 数据层 + SolidJS 渲染
├── openhud-config/         # 保留: 配置 schema/presets/colors/i18n (小幅扩展)
└── openhud-activity/       # 保留: 作为 api.event.on() fallback
```

## 5. 文件结构

```
openhud-core/src/
├── index.ts                    # TuiPluginModule 入口
├── vendor/                     # 从 claude-hud 复制，然后 OpenCode 化改造
│   ├── transcript.ts           # JSONL 解析引擎 (需改路径)
│   ├── stdin.ts                # 上下文百分比计算 (保留核心算法)
│   ├── git.ts                  # Git 状态获取 (保留)
│   ├── effort.ts               # 努力等级 (基本保留)
│   ├── config-reader.ts        # OpenCode 配置扫描 (重写扫描逻辑)
│   ├── types.ts                # 接口定义 (精简/扩展)
│   ├── constants.ts            # 阈值常量 (基本保留)
│   ├── utils.ts                # [重写] 替代 claude-config-dir, OpenCode 路径工具
│   ├── context-cache.ts        # 上下文快照 (需改路径)
│   ├── speed-tracker.ts        # 输出速度 (基本保留)
│   ├── memory.ts               # 内存报告 (基本保留)
│   ├── cost.ts                 # 成本估算 (基本保留)
│   └── debug.ts                # 调试日志 (基本保留)
│   └── adapters/               # 新代码: 桥接 vendor → SolidJS
│       ├── store.ts            # SolidJS Store 定义
│       └── transcript-adapter.ts # 事件触发 → parseTranscript
├── lines/
│   ├── SessionLine.tsx         # 模型 + 路径 + Git + effort
│   ├── ContextLine.tsx         # 上下文条 ████░░ + 百分比
│   ├── ToolsLine.tsx           # 工具活动状态
│   ├── AgentsLine.tsx          # Agent 状态
│   └── TodosLine.tsx           # 待办进度
└── components/
    └── HudPanel.tsx            # 组合所有 line
```

## 6. 数据流

```
api.event.on("session.*")
api.event.on("message.*")
api.event.on("command.*")
api.event.on("todo.*")
         │
         ▼
TranscriptWatcher.parse()     ← vendor/transcript.ts
GitWatcher.status()           ← vendor/git.ts
EffortResolver.resolve()      ← vendor/effort.ts
tokenCache()                  ← api.state.session.messages()
         │
         ▼
Store (SolidJS createSignal)
         │
         ▼
HudPanel(store, config)
  ├── SessionLine
  ├── ContextLine
  ├── ToolsLine
  ├── AgentsLine
  └── TodosLine
```

## 7. 入口点集成

```typescript
// TuiPluginModule
export default {
  id: "opencode-hud",
  tui: async (api) => {
    const store = createStore()
    const config = createConfig(api.kv)
    const transcript = new TranscriptWatcher(api, store)
    const git = new GitWatcher(api, store)

    api.slots.register({
      slots: {
        home_footer: () => HudPanel({ store, config }),
        sidebar_footer: (ctx) => HudPanel({ store, config, sessionID: ctx.session_id }),
      },
    })

    api.command.register(() => [
      { title: "HUD: Toggle", value: "hud:toggle", ... },
      { title: "HUD: Configure", value: "hud:configure", ... },
    ])

    api.lifecycle.onDispose(() => { transcript.cleanup(); git.cleanup() })
  },
}
```

## 8. 实施计划

详见 `writing-plans` 产出的实施计划文档。