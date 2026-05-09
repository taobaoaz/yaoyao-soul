/**
 * mood.ts — soul 版本
 *
 * 不依赖 yaoyao-plugin 的 MemoryStore，直接扫描 memory/ 目录的 daily md 文件。
 */
import fs from "node:fs";
import path from "node:path";
import { detectSentiment, summarizeMood } from "../utils/sentiment.js";
import { withErrorHandling } from "./common.js";
import type { ToolRegistration } from "./common.js";

export interface SoulConfig {
  memoryDir: string;
}

function listDailyFiles(memoryDir: string): Array<{ path: string; date: string }> {
  try {
    const entries = fs.readdirSync(memoryDir);
    return entries
      .filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.md$/))
      .sort().reverse()
      .map(f => ({ path: path.join(memoryDir, f), date: f.replace(/\.md$/, "") }));
  } catch {
    return [];
  }
}

function readFile(fp: string): string | null {
  try {
    return fs.readFileSync(fp, "utf-8");
  } catch {
    return null;
  }
}

export function createMoodTool(config: SoulConfig): ToolRegistration {
  return {
    name: "memory_mood",
    label: "Memory Mood",
    description: "🎨 分析最近对话记录的情绪分布 — 基于本地 daily md 文件，无需外部依赖。",
    parameters: {
      type: "object",
      properties: {
        days: { type: "number", description: "回溯天数（默认 7，最大 90）", default: 7 },
      },
    },
    execute: withErrorHandling(async (_id: string, params: Record<string, unknown>) => {
      const days = Math.min(Math.max(Number(params.days) || 7, 1), 90);
      const files = listDailyFiles(config.memoryDir).slice(0, days);

      if (files.length === 0) {
        return { content: [{ type: "text", text: "📂 memory/ 目录下暂无 daily 日志文件。请先使用 yaoyao-plugin 开启自动归档，或手动创建日志。" }] };
      }

      const allTexts: string[] = [];
      for (const f of files) {
        const content = readFile(f.path);
        if (content) allTexts.push(content);
      }

      const sentimentResults = allTexts.map(t => detectSentiment(t));
      const posCount = sentimentResults.filter(r => r.label === "positive").length;
      const negCount = sentimentResults.filter(r => r.label === "negative").length;
      const neuCount = sentimentResults.filter(r => r.label === "neutral").length;
      const total = sentimentResults.length;
      const summary = summarizeMood(allTexts);
      const moodEmoji = posCount > negCount ? "😊" : negCount > posCount ? "😟" : "😐";

      const lines = [
        `🎨 记忆心情环`,
        `───`,
        `📅 分析范围: 最近 ${days} 天 (${files.length} 条日志)`,
        `${moodEmoji} 总体: ${summary}`,
        ``,
        `📊 情绪分布:`,
        `   😊 积极: ${posCount} 条 (${(posCount / total * 100).toFixed(1)}%)`,
        `   😐 中性: ${neuCount} 条 (${(neuCount / total * 100).toFixed(1)}%)`,
        `   😢 消极: ${negCount} 条 (${(negCount / total * 100).toFixed(1)}%)`,
      ];
      return { content: [{ type: "text", text: lines.join("\n") }] };
    }),
  };
}
