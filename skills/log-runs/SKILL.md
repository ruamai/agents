---
name: log-runs
description: >-
  Start, update and finish a Ruam run for the task at hand. Use when you
  begin or finish a task, or when the user asks to log this work in Ruam.
---

Use the ruam MCP server's tools:

- Starting a task: start_run with the goal in plain words, your own id for the task and folder_hint (the repo's git remote with no user name or token, or the folder's name).
- At a real checkpoint: log_update with a few plain words.
- Done: finish_run with the outcome first, what it delivered in one line, the model and the task's total tokens.

If ruam isn't connected, tell the user to add it at https://mcp.ruam.ai/agent and sign in (Customizations, then MCP Servers in the app; /mcp in Antigravity CLI).

Never send code, prompts, file contents, full paths or secrets.
