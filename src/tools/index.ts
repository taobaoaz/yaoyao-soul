/**
 * Soul tool index — registers all yaoyao-soul tools.
 */
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";
import type { PersonaStateMachine } from "../utils/persona-state.js";
import type { FeedbackTracker } from "../learning/feedback-tracker.js";
import { createMoodTool } from "./mood.js";
import { createDistillTool } from "./memory-distill.js";
import { createOptimizeTool } from "./memory-optimize.js";

export interface SoulConfig {
  memoryDir: string;
}

export function registerSoulTools(
  api: OpenClawPluginApi,
  config: SoulConfig,
  personaState: PersonaStateMachine,
  feedbackTracker: FeedbackTracker,
) {
  const tools = [
    createMoodTool(config),
    createDistillTool(personaState, config.memoryDir),
  ];

  if (feedbackTracker) {
    try {
      tools.push(createOptimizeTool(feedbackTracker));
    } catch { /* best effort */ }
  }

  api.logger.info(`[yaoyao-soul] ${tools.length} tools registered`);
  return tools.length;
}
