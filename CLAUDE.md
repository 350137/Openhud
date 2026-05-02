# OpenHUD

OpenCode 的 Heads-Up Display 插件，在终端中实时显示上下文使用率、工具活动、Agent 状态和待办进度。

## 项目结构

```
D:\openhud\
├── packages/
│   ├── openhud-core/         # Plugin 入口 + slot 注册 + 核心组件
│   ├── openhud-activity/     # 工具/Agent/待办 事件收集 + 渲染组件
│   └── openhud-config/       # 配置 schema/presets/colors/i18n
```

## 依赖方向（关键规则）

- `@openhud/config` — 零内部依赖（叶子节点）
- `@openhud/activity` — 零内部依赖（叶子节点）
- `@openhud/core` — 依赖 config + activity

**禁止** config 或 activity 反向依赖 core。

## 开发命令

```bash
# 构建所有包（根目录）
npm install && npm -ws run build

# 单独构建
cd packages/openhud-core && npx tsc

# 类型检查（不输出）
cd packages/openhud-core && npx tsc --noEmit
```

## 代码约定

### 包间导入
- Core 从 config 导入：`import { t, type HudConfig } from "@openhud/config"`
- Core 从 activity 导入：`import { createActivityCollectors } from "@openhud/activity"`
- 使用 `.js`/`.jsx` 扩展名（ES Module 约定）

### 事件处理
- `session.created` — 追踪会话开始时间（没有 `session.start` 事件）
- `session.status` — 追踪会话状态变更
- `command.executed` — 追踪工具调用
- `todo.updated` — 追踪待办变更
- `message.updated` — 只递增当前路由的 `messageCount`

### 已知限制
- `api.state.vcs` 只有 `branch?: string`，没有 `dirty` 属性
- slot 渲染器参数用 `Record<string, unknown>` 绕过严格类型检查
- Event `properties` 中某些字段在类型定义外（如 status/type/model），使用类型断言

### 状态管理
- 使用 SolidJS `createSignal` 管理响应式状态
- 不可变更新：`setXxx(prev => new Map(prev))` 模式
- Activity 和 Config 包各自维护自己的信号（不共享 core 的信号）

## 配置管理

配置通过 `api.kv` 持久化存储。`createConfigManager` 提供 `load/save/update` 接口。
Config dialog 使用 `api.ui.DialogSelect` 实现多步配置界面。

## 验证

1. `npx tsc --noEmit` 在每个包中通过
2. 安装根目录运行 `npm install` 成功后 workspaces 链接正确
3. 插件注册的 slot 在 OpenCode 中正常渲染
