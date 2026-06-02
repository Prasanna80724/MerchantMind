<!-- lean-ctx-owned: PROJECT-LEAN-CTX.md v1 -->
# lean-ctx — Context Engineering Layer
<!-- lean-ctx-rules-v10 -->

## Mode Selection
1. Editing the file? → `full` first, then `diff` for re-reads
2. Need API surface only? → `map` or `signatures`
3. Large file, context only? → `entropy` or `aggressive`
4. Specific lines? → `lines:N-M`
5. Active task set? → `task`
6. Unsure? → `auto` (system selects optimal mode)

Anti-pattern: NEVER use `full` for files you won't edit — use `map` or `signatures`.

## File Editing
Use native Edit/StrReplace if available. If Edit requires Read and Read is unavailable, use ctx_edit.
Write, Delete, Glob → use normally. NEVER loop on Edit failures — switch to ctx_edit immediately.

## Proactive (use without being asked)
- `ctx_overview(task)` at session start
- `ctx_compress` when context grows large

## Session Documentation
After significant work, document progress:
- ctx_knowledge(action=remember, category=decision, content=what and why)
- ctx_session(action=task, value=task description with progress)
When you see [CHECKPOINT] → document current status immediately.

Fallback only if a lean-ctx tool is unavailable: use native equivalents.

## Dashboard (MerchantMind)

If you see `cannot index home directory C:/Users/Prasanna`, lean-ctx is using your
home folder as the project root instead of this repo.

**Fix:** run the dashboard with an explicit project path:

```powershell
cd E:\MerchentMind-main\merchantMind
npm run lean-ctx:dashboard
```

Or:

```powershell
lean-ctx dashboard --project=E:/MerchentMind-main/merchantMind
```

If port 3333 is already in use, stop the old dashboard (Ctrl+C in that terminal) first.

Project-local config: `.lean-ctx.toml` + `.lean-ctx-id`.
<!-- /lean-ctx -->
