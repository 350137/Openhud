# Claude HUD 学习文档

> Claude Code 实时状态栏 HUD — 终端中的 Heads-Up Display
>
> 作者: [Jarrod Watts](https://github.com/jarrodwatts/claude-hud)
> 许可证: MIT

---

## 一、项目概述

Claude HUD 是一个为 Claude Code 终端环境设计的实时状态栏插件。它在用户输入框下方以 1-4 行文本形式持续显示当前会话的关键指标，包括：

- 上下文使用率（token 进度条 + 百分比）
- 活跃的工具调用及其状态
- 正在运行的子 Agent 及其耗时
- 待办事项（Todo）完成进度
- Git 分支与文件变更状态
- 模型名称与提供商标签
- 速率限制（5 小时/7 天窗口）使用量
- 会话时长与累积 token 统计
- MCP 服务/CLAUDE.md/规则文件计数
- 内存占用（macOS 增强模式）

**核心设计哲学：** 始终可见、零配置、极低开销、信息密度高。

---

## 二、技术栈

| 层级 | 技术 | 用途 |
|------|------|------|
| 语言 | TypeScript 5.x | 静态类型、ES2022 target |
| 运行时 | Node.js 18+ / Bun | 跨平台兼容 |
| 模块系统 | ESM | 原生 import/export |
| 构建 | tsc | TypeScript 编译 |
| 测试 | Node --test + c8 覆盖率 | 内置测试运行器 |
| 配置 | JSON + 自定义合并逻辑 | 持久化用户偏好 |
| 渲染 | 纯 ANSI 转义序列 | 终端颜色输出 |
| i18n | TypeScript 字符串映射 | 中/英文切换 |

### 依赖关系

```
claude-hud
├── 无外部运行时依赖 (stdin/stdout 模式)
└── devDependencies:
    ├── typescript          -- 编译
    ├── @types/node         -- 类型定义
    └── c8                  -- 测试覆盖率
```

---

## 三、底层逻辑

### 3.1 架构模式: 轮询式 stdin/stdout 进程

Claude HUD 采用轮询式进程模型，与传统的插件架构有本质区别：

```
Claude Code (每 ~300ms 启动子进程)
  -> 写入 stdin JSON:
       { model, context_window, transcript_path,
         rate_limits, effort, cwd }
  -> 读取 stdout:
       [Model] ████░░ 45% | project git:(branch)
       ◐ Edit: file.ts | ✓ Read x3
       ▸ explore [haiku]: Finding code (2m 15s)

claude-hud (子进程)
  1. readStdin()     -- 读取并解析 stdin JSON
  2. parseTranscript() -- 解析 transcript JSONL
  3. countConfigs()  -- 扫描 CLAUDE.md/MCP/规则
  4. getGitStatus()  -- 执行 git 命令
  5. loadConfig()    -- 读取用户配置
  6. render()        -- 组装 ANSI 行输出到 stdout
```

### 3.2 数据流关键路径

```
stdin JSON           -> getContextPercent()     -> 上下文百分比
                     -> getModelName()          -> 模型显示名
                     -> getUsageFromStdin()     -> 速率限制数据
                     -> resolveEffortLevel()    -> 努力等级

transcript JSONL     -> parseTranscript()
       工具使用块    -> ToolEntry[]
       工具结果块    -> 状态更新 (running/completed)
       TodoWrite     -> TodoItem[]
       Task/Create   -> AgentEntry[]

config files         -> countConfigs()
       CLAUDE.md 计数
       rules/*.md 计数
       mcpServers 计数
       hooks 计数

git command          -> getGitStatus()
       git rev-parse HEAD        -> branch
       git status --porcelain    -> dirty state
       git diff --numstat        -> line diff

### 3.3 上下文百分比计算

三层策略：

1. 原生百分比 (v2.1.6+): 直接使用 context_window.used_percentage
2. 自定义带缓冲计算: 手动计算 + autocompact 缓冲 (16.5%)
3. 快照回退: 检测"可疑零帧"时恢复上一个健康值

### 3.4 Transcript 解析引擎

- 逐行读取 session JSONL 文件
- SHA256 + mtime + size 双重校验缓存
- tool_use -> tool_result ID 匹配追踪
- FIFO 处理 Todo 去重
- 累加 assistant.usage 获得会话级 token

---

## 四、模块划分

```
claude-hud/
├── .claude-plugin/plugin.json    # 插件清单
├── commands/
│   └── claude-hud-setup.jsx      # /claude-hud:setup 命令
├── src/
│   ├── index.ts                  # [入口] 主流程编排 + DI
│   ├── stdin.ts                  # [数据] 读取/解析 stdin JSON
│   ├── transcript.ts             # [数据] 解析 transcript JSONL
│   ├── config.ts                 # [配置] 加载 + 校验 + 合并
│   ├── config-reader.ts          # [配置] 扫描文件系统计数
│   ├── claude-config-dir.ts      # [工具] 配置目录路径
│   ├── context-cache.ts          # [缓存] 上下文快照
│   ├── git.ts                    # [工具] Git 状态
│   ├── memory.ts                 # [工具] 内存报告
│   ├── effort.ts                 # [数据] 努力等级
│   ├── speed-tracker.ts          # [数据] 输出速度
│   ├── cost.ts                   # [数据] 成本估算
│   ├── external-usage.ts         # [数据] 外部使用量
│   ├── version.ts                # [工具] Claude Code 版本
│   ├── constants.ts              # [常量] 阈值
│   ├── types.ts                  # [类型] 接口定义
│   ├── render/
│   │   ├── index.ts              # [渲染] 协调器 (布局/合并/换行)
│   │   ├── session-line.ts       # [渲染] 第1行: 模型+上下文+Git+用量
│   │   ├── tools-line.ts         # [渲染] 第2行: 工具调用
│   │   ├── agents-line.ts        # [渲染] 第3行: Agent 状态
│   │   ├── todos-line.ts         # [渲染] 第4行: 待办
│   │   ├── colors.ts             # [渲染] ANSI 256 色彩
│   │   └── lines/                # [渲染] 子行 (cost/usage/memory/...)
│   ├── utils/terminal.ts         # [工具] 终端宽度
│   └── i18n/                     # [i18n] en + zh
├── tests/
├── dist/
└── README.md
```

### 模块 1: 入口编排

index.ts 作为依赖注入容器, main() 接受 MainDeps 覆写支持测试。顺序: stdin -> transcript -> config -> git -> usage -> render。所有错误被捕获, 不影响 HUD 显示。

### 模块 2: 渲染引擎

- 支持 compact (单行) 和 expanded (多行)
- elementOrder + mergeGroups 控制布局
- 自动检测终端宽度, 按分隔符断行
- ANSI 256 色彩, 支持颜色覆盖
- 正确处理 CJK 双宽字符、emoji

### 模块 3: 配置系统

- JSON 持久化 (~/.claude/plugins/claude-hud/config.json)
- 深度合并 + 类型校验 + 默认值回退
- 向后兼容迁移 (layout -> lineLayout)
- 50+ 配置项

### 模块 4: 缓存系统

- Transcript 缓存: SHA256 + mtime/size 校验
- 上下文快照: 会话级 context_window 回退
- 配置计数: 文件哨兵 + 变化检测

---

## 五、关键技术决策

1. 进程轮询而非事件驱动: Claude Code 当时无公开事件 API
2. ANSI 256 色而非 true color: 跨终端兼容
3. 文件缓存加速: transcript/context/speed 三层缓存
4. autocompact 缓冲: 模拟 Claude Code 自动压缩
5. 可疑零帧检测: 应对 Claude Code 已知 bug

---

## 六、与 OpenHUD 的对比

| 维度 | Claude HUD | OpenHUD |
|------|-----------|---------|
| 宿主平台 | Claude Code (statusline) | OpenCode (TUI plugin) |
| 架构 | 轮询 stdin/stdout 进程 | 事件驱动 TUI API |
| 数据源 | stdin JSON + transcript 文件 | api.event.on() + api.state |
| 渲染 | ANSI 256 + console.log | SolidJS TUI slots |
| 终端适配 | 宽度检测 + ANSI 安全截断 | 无 |
| Git dirty | git status --porcelain | 仅有 branch |
| 速率限制 | 5h/7d 窗口 + 进度条 | 无 |
| 会话 token | transcript 累计 | api.state 实时 |
| 缓存 | 磁盘文件 3 层 | 无 |
| 配置项 | 50+ (JSON 文件) | 15+ (api.kv) |
| i18n | en + zh (TypeScript maps) | en + zh (同) |

---

## 总结

Claude HUD 是一个典型的"终端 HUD"参考实现。其最大价值在于:

1. **零依赖** -- 纯 Node.js + stdin/stdout, 无框架负担
2. **健壮性** -- 多层回退 (context/transcript/speed)
3. **用户体验** -- 终端宽度自适应 + ANSI 色彩 + 灵活的布局系统
4. **数据深度** -- transcript 解析提供远超 API 的表面指标