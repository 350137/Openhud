import type { JSX } from "solid-js";
import type { TuiPluginApi, TuiDialogSelectOption } from "@opencode-ai/plugin/tui";
import type { HudConfig } from "../schema.js";
import { DEFAULT_CONFIG } from "../schema.js";
import { PRESETS } from "../presets.js";
import { strings, t } from "../i18n.js";

const BOOL_KEYS = [
  "showContextBar",
  "showModel",
  "showToolActivity",
  "showAgentActivity",
  "showTodos",
  "showGitBranch",
  "showSessionCount",
  "showSessionDuration",
  "mergeGroups",
  "compactView",
] as const;

type BoolKey = (typeof BOOL_KEYS)[number];

const BOOL_LABELS: Record<BoolKey, keyof (typeof strings)["en"]> = {
  showContextBar: "contextBar",
  showModel: "model",
  showToolActivity: "toolActivity",
  showAgentActivity: "agentActivity",
  showTodos: "todoProgress",
  showGitBranch: "gitBranch",
  showSessionCount: "sessionCount",
  showSessionDuration: "sessionDuration",
  mergeGroups: "compact",
  compactView: "compact",
};

/**
 * Build the main config dialog option list.
 */
function buildMainOptions(
  current: HudConfig,
  api: TuiPluginApi,
): TuiDialogSelectOption<string>[] {
  const lang = current.language;
  const options: TuiDialogSelectOption<string>[] = [];

  // Boolean toggles
  for (const key of BOOL_KEYS) {
    const labelKey = BOOL_LABELS[key];
    const label = t(lang, labelKey);
    const status = current[key] ? t(lang, "enabled") : t(lang, "disabled");
    options.push({
      title: `${label}: ${status}`,
      value: `toggle:${key}`,
      category: t(lang, "configure"),
    });
  }

  // Presets
  options.push({
    title: t(lang, "preset"),
    value: "presets",
    description: `${t(lang, "full")} / ${t(lang, "essential")} / ${t(lang, "minimal")}`,
    category: t(lang, "configure"),
  });

  // Path Depth
  options.push({
    title: `${t(lang, "pathDepth")}: ${current.pathLevels}`,
    value: "pathDepth",
    category: t(lang, "configure"),
  });

  // Language
  options.push({
    title: `${t(lang, "language")}: ${current.language === "en" ? "English" : "中文"}`,
    value: "language",
    category: t(lang, "configure"),
  });

  return options;
}

/**
 * Show a DialogSelect for choosing path depth (1, 2, or 3).
 */
function showPathDepthDialog(
  api: TuiPluginApi,
  current: HudConfig,
  onUpdate: (partial: Partial<HudConfig>) => void,
): void {
  const lang = current.language;
  const depthOptions: TuiDialogSelectOption<number>[] = [1, 2, 3].map((n) => ({
    title: String(n),
    value: n,
    description: n === 1 ? t(lang, "compact") : t(lang, "expanded"),
  }));

  api.ui.dialog.replace(
    () => (
      <api.ui.DialogSelect
        title={t(lang, "pathDepth")}
        options={depthOptions}
        current={current.pathLevels}
        onSelect={(opt) => {
          onUpdate({ pathLevels: opt.value as 1 | 2 | 3 });
        }}
      />
    ),
  );
}

/**
 * Show a DialogSelect for choosing the UI language.
 */
function showLanguageDialog(
  api: TuiPluginApi,
  current: HudConfig,
  onUpdate: (partial: Partial<HudConfig>) => void,
): void {
  const lang = current.language;
  const langOptions: TuiDialogSelectOption<string>[] = [
    { title: "English", value: "en" },
    { title: "中文", value: "zh" },
  ];

  api.ui.dialog.replace(
    () => (
      <api.ui.DialogSelect
        title={t(lang, "language")}
        options={langOptions}
        current={current.language}
        onSelect={(opt) => {
          onUpdate({ language: opt.value as "en" | "zh" });
        }}
      />
    ),
  );
}

/**
 * Show a DialogSelect for choosing a preset.
 */
function showPresetDialog(
  api: TuiPluginApi,
  current: HudConfig,
  onUpdate: (partial: Partial<HudConfig>) => void,
): void {
  const lang = current.language;

  const presetNames = Object.keys(PRESETS);
  const presetOptions: TuiDialogSelectOption<string>[] = presetNames.map(
    (name) => {
      const labelKey = name as keyof (typeof strings)["en"];
      const label = t(lang, labelKey);
      return {
        title: label,
        value: name,
        description: describePreset(name),
      };
    },
  );

  api.ui.dialog.replace(
    () => (
      <api.ui.DialogSelect
        title={t(lang, "preset")}
        options={presetOptions}
        onSelect={(opt) => {
          const preset = PRESETS[opt.value];
          if (preset) {
            onUpdate(preset);
          }
        }}
      />
    ),
  );
}

function describePreset(name: string): string {
  switch (name) {
    case "full":
      return "All features enabled, expanded view";
    case "essential":
      return "Context bar, model, and git branch only, compact view";
    case "minimal":
      return "Context bar and model only, compact view";
    default:
      return "";
  }
}

/**
 * Show the full multi-step HUD configuration dialog.
 *
 * The first screen lists all boolean toggle options plus a "Presets" entry,
 * "Path Depth", and "Language". Selecting an option toggles the value or
 * navigates to the relevant sub-dialog.
 *
 * @param api - The TUI plugin API instance
 * @param current - The current HUD configuration
 * @param onUpdate - Callback invoked with the partial update whenever the user makes a change
 */
export function showConfigDialog(
  api: TuiPluginApi,
  current: HudConfig,
  onUpdate: (partial: Partial<HudConfig>) => void,
): void {
  const lang = current.language;

  const renderMain = () => (
    <api.ui.DialogSelect
      title={t(lang, "configTitle")}
      options={buildMainOptions(current, api)}
      onSelect={(option) => {
        const val = option.value;

        if (val === "presets") {
          showPresetDialog(api, current, onUpdate);
          return;
        }

        if (val === "pathDepth") {
          showPathDepthDialog(api, current, onUpdate);
          return;
        }

        if (val === "language") {
          showLanguageDialog(api, current, onUpdate);
          return;
        }

        // Boolean toggle
        if (val.startsWith("toggle:")) {
          const key = val.slice("toggle:".length) as BoolKey;
          if (key in DEFAULT_CONFIG) {
            const next = !current[key];
            onUpdate({ [key]: next } as Partial<HudConfig>);
          }
        }
      }}
    />
  );

  api.ui.dialog.replace(renderMain);
}
