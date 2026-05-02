# OpenCode 学习报告

> 仓库：https://github.com/anomalyco/opencode
> 官网：https://opencode.ai
> 版本：v1.14.31 (2026-05-01)
> Stars: 153k | Forks: 17.6k | 贡献者: 850+ | 提交: 12,087

---

## 1. 项目概览

OpenCode 由 **Anomaly** ([terminal.shop](https://terminal.shop) 和 SST 创建团队) 开发，2025年4月30日发布，一年内获得 153k GitHub Stars。

### 与 Claude Code 的核心差异

| 对比项 | OpenCode | Claude Code |
|--------|----------|-------------|
| 开源 | 100% MIT | 闭源 |
| 提供商锁定 | 无(任意 LLM) | 仅 Anthropic |
| LSP 支持 | 内置开箱即用 | 无 |
| 架构 | 客户端/服务器 | 单体 |

---

## 2. 技术栈

| 类别 | 技术选型 |
|------|----------|
| **语言** | TypeScript (~60%), MDX (~36%), CSS (~3%), Rust (<1%), Astro, Nix |
| **运行时** | Bun 1.3+ (主要), Node.js (兼容) |
| **包管理** | Bun workspaces + npm workspaces |
| **Monorepo** | Turborepo v2.8.13 |
| **TypeScript** | v5.8.2 |
| **Linter** | oxlint v1.60 |
| **格式化** | Prettier v3.6 |
| **测试** | Bun test + Playwright v1.59 |

### 关键依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| solid-js | 1.9.10 | Web UI 响应式框架 |
| @opentui/core+solid | 0.2.x | TUI 组件库 |
| ai (Vercel AI SDK) | 6.0.168 | LLM 提供商抽象层 |
| zod | 4.1.8 | Schema 验证 |
| hono | 4.10.7 | HTTP API 框架 |
| drizzle-orm | 1.0.0-beta | ORM / 数据存储 |
| shiki | 3.20.0 | 代码语法高亮 |
| @modelcontextprotocol/sdk | 1.27.1 | MCP 客户端 |
| vite | 7.1.4 | 前端构建 |
| tailwindcss | 4.1.11 | CSS 工具类 |

### 桌面 & 云端

- **桌面端**: Tauri v2 + Electron 双实现
- **云端**: SST Ion + Cloudflare Workers
- **Docker**: `ghcr.io/anomalyco/opencode`
- **安装方式**: curl / npm / brew / scoop / choco / pacman / nix
- **桌面包格式**: DMG / exe / deb / rpm / AppImage

---

## 3. 架构：客户端/服务器

```
┌─────────────────────────────────────────────────────┐
│                    OpenCode Server                    │
│  packages/opencode/                                   │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │ HTTP API    │ │ Plugin Sys  │ │ MCP Client   │  │
│  │ (OpenAPI    │ │ (Hooks +     │ │ (Model       │  │
│  │  3.1)       │ │  Tools)      │ │  Context     │  │
│  └─────────────┘ └──────────────┘ └──────────────┘  │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │ Provider    │ │ LSP          │ │ Agent        │  │
│  │ System      │ │ Integration  │ │ System       │  │
│  └─────────────┘ └──────────────┘ └──────────────┘  │
│                        │                              │
│                  Port 4096                            │
└───────────────────────┬─────────────────────────────┘
                        │ HTTP / SSE
          ┌─────────────┼──────────────┐
          │             │              │
    ┌─────▼─────┐ ┌────▼────┐  ┌─────▼─────┐
    │ TUI       │ │ Web UI  │  │ IDE       │
    │ (Terminal)│ │ (Vite)  │  │ Extension │
    └───────────┘ └─────────┘  └───────────┘
```

### 通信协议

- **HTTP API**: OpenAPI 3.1 规范，默认端口 4096
- **实时事件**: SSE (Server-Sent Events)，事件类型包括 `session.*`, `tool.*`, `file.*` 等
- **认证**: `OPENCODE_SERVER_PASSWORD` 环境变量，HTTP Basic Auth
- **多客户端**: 多个客户端可同时连接到同一服务器

### 运行模式

| 命令 | 模式 | 说明 |
|------|------|------|
| `opencode` | 默认 | TUI 交互模式 |
| `opencode serve` | 服务端 | 无头模式，仅暴露 HTTP API |
| `opencode [path]` | 指定目录 | 在指定项目目录启动 |

### 桌面端架构

- **Tauri v2**: Rust 后端 + WebView 前端，性能最优
- **Electron**: 兼容性更广，插件生态丰富
- 两者共享同一 Web UI 前端代码

---

## 4. Monorepo 结构

```
packages/
├── opencode/              # 主应用 (CLI + Server + TUI + Plugins + LSP + MCP + Providers)
├── core/                  # 共享工具 (telemetry, file ops, schema)
├── sdk/js/                # JS/TS SDK (从 OpenAPI 自动生成，@hey-api/openapi-ts)
├── plugin/                # 插件 SDK (@opencode-ai/plugin)
├── app/                   # Web UI 组件 (SolidJS + Tailwind v4 + Vite)
├── ui/                    # 可复用 UI 组件库
├── web/                   # 文档站 (Astro + Starlight, Cloudflare Pages)
├── desktop/               # Tauri v2 桌面应用
├── desktop-electron/      # Electron 桌面应用
├── console/               # 云端控制台 (SST Ion: app/core/function/mail/resource)
├── enterprise/            # 企业版自托管 (SolidStart + Nitro)
├── identity/              # 认证服务
├── function/              # Cloudflare Workers (GitHub 集成)
├── slack/                 # Slack Bot
├── storybook/             # Storybook v10
├── script/                # 构建脚本
├── containers/            # 容器支持
├── docs/                  # 补充文档
├── extensions/            # IDE 扩展支持
└── ...
```

### 包间依赖关系

```
ui ──→ app ──→ opencode ──→ plugin
                          │
core ─────────────────────┤
                          │
sdk/js ──────────────────→┤
                          │
docs/web ─────────────────┘
```

---

## 5. 核心系统

### 5.1 Agent 系统

| Agent 类型 | 访问级别 | 说明 |
|-----------|----------|------|
| **build** | 完整访问 | 默认 Agent，可读可写，执行任务 |
| **plan** | 只读 | 只读模式，适合审查代码 |
| **@general** | 子 Agent | 通用子任务执行 |
| **@explore** | 子 Agent | 探索性任务 |
| **compaction** | 隐藏 | 上下文压缩 |
| **title** | 隐藏 | 会话标题生成 |
| **summary** | 隐藏 | 会话摘要生成 |

**Agent 操作**:
- `Tab` 键切换 Agent
- `@` 提及调用子 Agent
- 每个 Agent 支持细粒度权限控制（按工具分配）

### 5.2 Provider 系统

基于 Vercel AI SDK (`ai` v6.0.168)，支持 75+ 提供商：

| 类别 | 提供商 |
|------|--------|
| **主流 API** | Anthropic, OpenAI, Google, Mistral, Groq |
| **云平台** | AWS Bedrock, GCP Vertex AI, Azure |
| **新兴** | xAI, Cerebras, DeepInfra, Perplexity, Together AI |
| **中国** | Alibaba (通义千问), DeepSeek, 月之暗面 |
| **聚合** | OpenRouter, OpenCode Zen |
| **本地** | Ollama, LM Studio, vLLM |

**认证方式**: API Key, OAuth, Session Token

### 5.3 Session 系统

- **层次结构**: 父子会话树（子 Agent 工作的基础）
- **Fork/Continue**: 从任意点分叉或继续会话
- **压缩**: 自动上下文压缩以管理 Token 使用
- **共享**: `opencode.ai/s/:id` 分享会话
- **Undo/Redo**: 操作历史回退与重做
- **Diff 追踪**: 文件变更差异追踪
- **Todo**: 每个会话独立的任务列表

### 5.4 LSP 集成

- **传输层**: `vscode-jsonrpc`
- **能力**: 实时诊断作为 AI 上下文、符号解析、格式化器支持
- **优势**: 让 AI 能感知编译错误、类型警告等，提供更准确的代码生成

### 5.5 MCP 支持

- 完整实现 Model Context Protocol 客户端
- 运行时动态注册 MCP Server
- 工具级别权限控制
- 支持自定义 MCP Server 接入

### 5.6 插件系统

**加载来源**:
- `.opencode/plugins/` (项目本地)
- `~/.config/opencode/plugins/` (用户全局)
- npm 包（通过 `plugin` 配置声明，自动安装到 `~/.cache/opencode/node_modules/`）

**插件上下文**:
```typescript
interface PluginContext {
  project: ProjectInfo;
  client: ClientAPI;
  $: ShellHelper;
  directory: string;
  worktree: string;
}
```

**Hooks 列表**:

| 类别 | Hooks |
|------|-------|
| **事件** | event.* |
| **工具** | tool.* (before/after) |
| **文件** | file.* (read/write/edit) |
| **消息** | message.* |
| **权限** | permission.* |
| **会话** | session.* |
| **待办** | todo.* |
| **环境** | shell.env |

**插件导出**:
- `server`: 服务端 hooks（在 Server 环境运行）
- `tui`: TUI slot/command 注册（在 TUI 环境运行）

### 5.7 数据存储

- **ORM**: Drizzle ORM
- **数据库**: SQLite
- **条件导入**: 根据运行时（Bun vs Node）选择不同的 SQLite 驱动
- **简单 KV**: `api.kv` 接口用于配置存储

---

## 6. 关键特性

### 6.1 多会话管理

支持同时管理多个工作会话，每个会话独立维护上下文、TODO 和历史记录。

### 6.2 Agent 切换

通过 `Tab` 键在 build/plan 等 Agent 模式间快速切换。

### 6.3 MCP / ACP 支持

完整的 Model Context Protocol 和 Agent Communication Protocol 支持。

### 6.4 Skills 系统

- 通过 `opencode.json` 或 Markdown 文件定义 Skill
- Skill 提供领域特定的指令和工作流
- 支持自动匹配和推荐

### 6.5 自定义工具

通过插件系统的 `tool()` 辅助函数 + Zod Schema 创建自定义工具。

### 6.6 远程操作

客户端/服务器架构天然支持远程开发，SSE 实时推送事件。

### 6.7 国际化

支持 20+ 语言翻译，覆盖主流编程语言市场。

### 6.8 社区生态

| 类型 | 数量 |
|------|------|
| 社区插件 | 30+ |
| 社区项目 | 12+ (Discord Bot, Neovim 插件, 移动端 App 等) |

---

## 7. 设计哲学

1. **Provider 无关** — 不绑定任何 LLM 提供商
2. **终端优先** — 由 Neovim 用户为终端用户打造
3. **客户端/服务器** — 天然支持远程和协作
4. **100% 开源** — MIT 协议，无任何闭源组件
5. **可扩展** — 插件、MCP、ACP、自定义工具、Skills 多维度扩展

---

## 8. 构建与部署

### 构建流程

```bash
# 自定义构建脚本
packages/opencode/script/build.ts

# 平台分发包（7 个平台）
# Windows: .exe / .zip
# macOS: .dmg / .zip (x86_64 + arm64)
# Linux: .deb / .rpm / .AppImage / .tar.gz
```

### CI/CD

- **GitHub Actions**: `.github/workflows/publish.yml`
- **NPM**: `opencode-ai`
- **Docker**: `ghcr.io/anomalyco/opencode`
- **安装脚本**:
  ```bash
  # 一行安装
  curl -fsSL https://opencode.ai/install.sh | sh
  # 或
  npm install -g opencode-ai
  # 或
  brew install opencode-ai/tap/opencode
  # 或
  scoop bucket add opencode; scoop install opencode
  ```

---

## 9. 学习要点总结

### 值得借鉴的设计决策

1. **Client/Server 分离**: TUI/Web/IDE 共享同一后端，减少重复开发
2. **Provider 抽象层**: 基于 Vercel AI SDK，75+ 提供商即插即用
3. **细粒度权限**: Agent 级别和工具级别的权限控制
4. **LSP 集成**: 将 IDE 能力注入 AI 上下文
5. **插件 Hooks 系统**: 生命周期全覆盖，从文件操作到会话管理

### 潜在改进空间

1. Monorepo 中 `packages/opencode/` 包过于庞大，可考虑进一步拆分
2. Tauri + Electron 双桌面端维护成本较高
3. 文档分散在多个位置（Astro 站点 + `docs/` + CLAUDE.md）

### 对 OpenHUD 的启示

1. OpenCode 的 SSE 事件系统提供了丰富的事件类型，可从中提取 Agent 状态变化
2. Plugins 的 Hooks 体系（event.*, tool.*, session.*）可直接作为 Activity 收集器的数据源
3. Core 包中的 API KV 存储可以作为 Config 持久化的参考实现
4. OpenCode 的 Slot 注册机制给 OpenHUD 提供了渲染挂载点的思路