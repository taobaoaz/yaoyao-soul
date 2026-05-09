/**
 * Yaoyao Soul — AI 角色观察层
 *
 * 定位：不干预实时对话，只做静默观察与长期沉淀。
 *
 * 功能:
 *   - 隐式情绪标注 (extractImplicitTags → .implicit-tags.jsonl)
 *   - 周期人格蒸馏 (memory_distill → memory/persona.md)
 *   - 情绪分布回顾 (memory_mood)
 *   - 反馈学习优化 (memory_optimize, L4)
 *
 * 依赖:
 *   - 读取 yaoyao-plugin 的 memory/ 目录 (daily md)
 *   - 完全不碰 yaoyao-plugin 的数据库或内部状态
 *   - 可独立安装，也可与 yaoyao-plugin 配合使用
 *
 * 入口: index.ts
 */

import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { PersonaStateMachine } from "./src/utils/persona-state.js";
import { FeedbackTracker } from "./src/learning/feedback-tracker.js";
import { registerSoulTools } from "./src/tools/index.js";

export default definePluginEntry({
  id: "yaoyao-soul",
  name: "Yaoyao Soul",
  description: "Yaoyao Soul — AI character observation layer. Silent pattern extraction, weekly persona distillation, and emotional understanding without real-time intervention. Works alongside yaoyao-plugin.",

  register(api) {
    try {
      const config = (api.pluginConfig || {}) as Record<string, unknown>;
      const baseDir = (api.baseDir || ".") as string;
      const memoryDir = (config.memoryDir as string) || require("node:path").join(baseDir, "memory");

      // ── PersonaStateMachine (v3 observation-only) ──
      let psm: PersonaStateMachine | null = null;
      try {
        psm = new PersonaStateMachine(memoryDir);
        psm.getState();
        api.logger.info("[yaoyao-soul] PersonaStateMachine v3 initialized (observation-only)");
      } catch (err: any) {
        api.logger.warn?.(`[yaoyao-soul] PersonaStateMachine skipped: ${err.message}`);
      }

      // ── FeedbackTracker (L4) ──
      let feedbackTracker: FeedbackTracker | null = null;
      try {
        feedbackTracker = new FeedbackTracker(memoryDir);
        api.logger.info("[yaoyao-soul] FeedbackTracker initialized (L4)");
      } catch (err: any) {
        api.logger.warn?.(`[yaoyao-soul] FeedbackTracker skipped: ${err.message}`);
      }

      // ── Register tools ──
      const toolCount = psm && feedbackTracker
        ? registerSoulTools(api, { memoryDir }, psm, feedbackTracker)
        : 0;

      // ── Silent observation hook: after each turn, extract implicit tags ──
      api.on("agent_end", async (payload: Record<string, unknown>) => {
        if (!psm) return;
        try {
          const text = (payload.response as string) || "";
          if (!text) return;
          psm.extractImplicitTags(text);
        } catch { /* silent observation should never break anything */ }
      });

      // Banner
      const banner = [
        "🖤 ══════════════════════════════════════════",
        "🖤    摇摇 · 灵魂观察层已启动",
        `🖤    v1.0.0  ·  ${toolCount} Tools  ·  1 Hook`,
        "🖤    静默观察 · 周期蒸馏 · 不干预对话",
        `🖤    记忆目录: ${memoryDir}`,
        "🖤 ══════════════════════════════════════════",
      ];
      for (const line of banner) {
        api.logger.info(line);
      }
      console.log("  " + banner.join("\n  "));

      api.logger.debug?.("[yaoyao-soul] Plugin registered (observation-only, zero intervention)");
    } catch (err) {
      api.logger.error?.(`[yaoyao-soul] Plugin registration FAILED: ${err instanceof Error ? err.message : String(err)}`);
    }
  },
});
