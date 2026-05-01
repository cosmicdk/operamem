# OperaMem

> Lightweight persistent memory system for Operit platform.
> Zero dependencies. Based on claude-mem progressive disclosure design.

## Quick Start

```
/mem save <content>       Save to memory
/mem search <query>       Search memory  
/mem recent               Recent 10 items
/mem auto                 Auto-analyze & save
```

## Observation Types
decision | bugfix | insight | todo | reference | warning

## Storage
JSONL + inverted keyword index. Pure JavaScript.

## Progressive Disclosure
Layer 1: ID + summary prefix (~200 tokens)
Layer 2: Summary + type + time (~500 tokens)
Layer 3: Full content (on demand)

## License
MIT