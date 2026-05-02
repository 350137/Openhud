---
name: mcp-localization
description: Use when working on MCP project localization/i18n - guides review of translation files, key parity, terminology consistency, and locale setup
---

# MCP Localization Guide

## i18n Framework
- vue-i18n v11 with Composition API
- Locales: en-US (default), zh-CN, zh-TW
- Fallback: zh-TW → zh-CN → en-US

## File Structure
`packages/ui/src/i18n/`:
- Modular `.ts` files per domain: core, favorites, prompt, models, templates, testing, context, image, errors
- Each locale is a directory: `en-US/`, `zh-CN/`, `zh-TW/`

## Key Rules
1. New keys must be added to ALL 3 locales (CI enforces parity)
2. Never use Chinese text outside i18n files (CI checks this)
3. Key naming: `module.subModule.textKey` with `{variable}` interpolation
4. Common/shared text goes under `common` to avoid duplication

## Localization Status
- Complete: All 3 locales have full parity
- Validated: CI runs `check-locale-parity.mjs` and `check-no-chinese-runtime.mjs`
- Framework: vue-i18n with TypeScript schema derived from en-US

## Verification
```bash
pnpm check:locale        # Check key parity across locales
pnpm check:no-chinese-runtime  # Check for leaked Chinese strings
```