/**
 * auto-recall hook for yaoyao-soul.
 *
 * Reads the last N observation entries from memory/persona.md and appends them
 * as lightweight context hints — never overrides plugin's memory recall.
 *
 * Safety rules:
 * 1. APPEND only (after plugin's own context), never prepend or override.
 * 2. Max 3 recent observations to limit token burn.
 * 3. Only entries under "### 观察笔记" section.
 * 4. Skip if session is heartbeat/cron/internal.
 * 5. Graceful when persona.md missing or empty.
 */

import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";
import { createSessionFilter } from "./session-filter.js";

const MAX_OBSERVATIONS = 3;
const TAG = "[yaoyao-soul:recall]";

interface RecallConfig {
  memoryDir: string;
  maxObservations?: number;
}

function readRecentObservations(memoryDir: string, maxCount: number): string[] {
  try {
    const fs = require("node:fs");
    const path = require("node:path");
    const personaPath = path.join(memoryDir, "persona.md");

    if (!fs.existsSync(personaPath)) return [];

    const content = fs.readFileSync(personaPath, "utf-8");

    // Find the "### 观察笔记" section
    const sectionMatch = content.match(/###\s*观察笔记\s*\n([\s\S]*)/);
    if (!sectionMatch) return [];

    const section = sectionMatch[1].trim();
    if (!section) return [];

    // Split by bullet entries (lines starting with "- " or "> ")
    const entries = section
      .split(/\n(?=[-•>]\s)/)
      .map((e: string) => e.trim())
      .filter((e: string) => e.length > 10)
      .slice(-maxCount);

    return entries;
  } catch {
    return [];
  }
}

function formatObservations(entries: string[]): string | undefined {
  if (entries.length === 0) return undefined;

  const lines = [
    "## 长期观察",
    "",
    "（以下内容来自对用户长期对话模式的静默沉淀，非实时判断）",
    "",
    ...entries,
    "",
  ];
  return lines.join("\n");
}

export function registerSoulRecallHook(
  api: OpenClawPluginApi,
  config: RecallConfig,
) {
  const { memoryDir, maxObservations = MAX_OBSERVATIONS } = config;

  const sessionFilter = createSessionFilter({
    blockLabels: [],
    blockInternal: true,
    minMessages: 1,
  });

  api.logger.info(`${TAG} Registering before_prompt_build hook (soul observation append)`);

  api.on("before_prompt_build", async (_event, ctx) => {
    try {
      const sessionKey = (ctx as Record<string, unknown>).sessionKey as string || "default";
      if (!sessionFilter.shouldProcess(sessionKey)) return;

      const entries = readRecentObservations(memoryDir, maxObservations);
      const appendText = formatObservations(entries);

      if (!appendText) return;

      api.logger.debug?.(`${TAG} Appended ${entries.length} observations`);

      return {
        appendSystemContext: appendText,
      };
    } catch (err) {
      api.logger.error?.(`${TAG} Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  });
}
