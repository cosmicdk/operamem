---
name: operamem
description: Lightweight persistent memory system for Operit platform. Zero dependencies. Uses /mem commands to save, search, and review memories.
version: 1.0.0
author: cosmicdk
license: MIT
tags: [memory, persistence, context, progressive-disclosure]
triggers: [/mem, 记住, 别忘了]
---

# OperaMem Skill

## Commands
- `/mem save <content>` — Save important decisions, bugfixes, insights
- `/mem search <query>` — Search with keyword/type/project/tag filters
- `/mem recent [N]` — Show recent N memories (default 10)
- `/mem auto` — Let AI analyze current conversation and auto-save

## Observation Types
| Type | Use |
|------|-----|
| decision | Architecture decisions |
| bugfix | Bug fixes documented |
| insight | Technical insights |
| todo | Action items |
| reference | Reference materials |
| warning | Gotchas / pitfalls |

## Storage
- Observations: `/sdcard/Download/Operit/memory/observations.jsonl`
- Index: `/sdcard/Download/Operit/memory/index.json`

## Progressive Disclosure (3 layers)
1. ID + type + time + summary prefix (~200 tokens)
2. Full summary + keywords + tags (~500 tokens)
3. Complete content (on explicit request)

## AI Execution
When user says `/mem save`: parse @type/@project/@tag markers, extract keywords, write JSONL, update index.
When user says `/mem search`: parse filters, search index, return layered results.