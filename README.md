# Yaoyao Soul 🖤

AI character observation layer for OpenClaw. Works alongside [yaoyao-plugin](https://github.com/taobaoaz/yaoyao-plugin) (memory infrastructure) or independently.

## Philosophy

> Memory should **observe**, not **intervene**.

Yaoyao Soul does **not** inject psychological guidance into live conversations. It silently watches, periodically distills patterns, and writes observation notes for the character layer (SOUL.md) to consume at its own pace.

## What It Does

| Feature | Description |
|---------|-------------|
| **Silent Observation** | After each agent turn, extracts implicit tags (`stress_signal`, `preference_pattern`, `engagement`) into `.implicit-tags.jsonl` |
| **Weekly Distillation** | `memory_distill` tool scans last N days of tags, generates fact-only observation notes, appends to `memory/persona.md` |
| **Mood Ring** | `memory_mood` analyzes emotional distribution across recent daily logs (reads `memory/*.md` directly) |
| **Feedback Learning** | `memory_optimize` analyzes `.feedback.jsonl` for correction/praise patterns (L4) |

## What It Does **Not** Do

- ❌ Inject "be warmer / be shorter / be more autonomous" into system prompts
- ❌ Override the character's natural emotional response
- ❌ Require yaoyao-plugin to be installed (but works best together)

## Installation

```bash
# In your OpenClaw workspace
openclaw plugins add yaoyao-soul
```

Or manually clone to `~/.openclaw/plugins/`.

## Configuration

```yaml
# openclaw.yaml
plugins:
  yaoyao-soul:
    memoryDir: "./memory"   # where to read daily md files and write persona.md
```

## Architecture

```
yaoyao-soul/
├── index.ts                    # Plugin entry
├── src/
│   ├── utils/
│   │   ├── persona-state.ts    # v3 observation-only PSM (no getGuidance)
│   │   ├── sentiment.ts        # Lightweight sentiment analysis
│   │   ├── llm-client.ts       # Optional LLM for L3 persona generation
│   │   └── llm-parse.ts        # JSON response parser
│   ├── learning/
│   │   └── feedback-tracker.ts # L4 feedback learning
│   ├── persona/
│   │   └── persona-generator.ts # L3 structured persona generation
│   └── tools/
│       ├── mood.ts             # memory_mood
│       ├── memory-distill.ts   # memory_distill
│       └── memory-optimize.ts  # memory_optimize
```

## Relationship to yaoyao-plugin

| | yaoyao-plugin | yaoyao-soul |
|---|---|---|
| **Layer** | L0–L1 (storage + search) | L2–L4 (observation + understanding) |
| **Writes** | `memory/*.md`, `.yaoyao.db` | `.implicit-tags.jsonl`, `persona.md` |
| **Reads** | Its own DB | `memory/*.md` (daily logs) |
| **Intervenes?** | No | **Definitely no** |

Install both for the full experience, or just one depending on your needs.

## License

MIT
