# Ruam for coding agents

Ruam keeps a plain record of the work your coding agents do for you: one run per task, with its goal, checkpoints, outcome and token counts. It never sees your code, prompts or files.

This repo holds the Ruam plugins for Claude Code, Codex, Antigravity and Cursor. Connect your agent from Ruam (Agents, then Connect), which walks you through the steps below.

## Claude Code

1. Add Ruam and sign in:
   ```
   claude mcp add --transport http ruam https://mcp.ruam.ai/agent
   ```
   Then run `/mcp` in Claude Code and approve Ruam in your browser.
2. Install the plugin:
   ```
   /plugin marketplace add ruamai/agents
   /plugin install ruam@ruam
   ```

What it does:

- When you give Claude Code a task, it opens a Ruam run for that session.
- When the session ends, it tells Ruam, so the run closes. If that message doesn't arrive, Ruam closes the run after 30 quiet minutes.

It sends only the session id. Token counts come from Claude Code's own counts, which you turn on from Ruam with a key.

## Codex

1. Add Ruam and sign in:
   ```
   codex mcp add ruam --url https://mcp.ruam.ai/agent
   codex mcp login ruam
   ```
   The second command opens your browser, where you approve Ruam.
2. Install the plugin:
   ```
   codex plugin marketplace add ruamai/agents
   ```
   Then in Codex, type `/plugins` and install Ruam. Type `/hooks` and trust Ruam's 3 hooks. Start a new Codex session.

What it does:

- When you give Codex a task, it opens a Ruam run for that session.
- Each time the model answers, it sends Ruam the session id, the request id, the model's name and the token counts. Nothing you typed and nothing Codex wrote.
- When Codex finishes its reply, the run closes. If you keep going in the same session, the same run picks up again. If Codex stops partway, Ruam closes the run after 30 quiet minutes.

It works in Codex in your terminal and in the ChatGPT desktop app. The Codex IDE extension can't run plugins, and Codex cloud doesn't run hooks, so runs there don't log themselves yet.

## Antigravity

1. Add Ruam and sign in: in the Antigravity app, open Customizations, then MCP Servers, and add one named `ruam` at `https://mcp.ruam.ai/agent`. In Antigravity CLI, type `/mcp`. Ruam opens in your browser: Allow, then paste the code it shows back into Antigravity.
2. Add the Ruam plugin:
   ```
   agy plugin install https://github.com/ruamai/agents
   ```

What it does:

- It tells the agent to log each run itself through Ruam: the goal, short updates and what it delivered.
- Token counts are the ones the agent reports, marked "Reported by the agent". Antigravity doesn't share its own counts with other tools yet.
- Runs that open and close by themselves, like Claude Code's, come later.

It works in the Antigravity app and Antigravity CLI. The plugin's manifest is `.antigravity-plugin/plugin.json`, with its rule in `rules/AGENTS.md` and a skill in `skills/log-runs/`.

## Cursor

1. Add Ruam and sign in: in Cursor, open Settings, then MCP, and add a server named `ruam` at `https://mcp.ruam.ai/agent`. Cursor opens Ruam in your browser: Allow, and you're done.
2. Install the plugin: in Cursor, add the plugin source `ruamai/agents`, install Ruam, then choose Trust when Cursor asks about its hooks.
3. Make this computer's hook key on Ruam's Connect Cursor page (each computer gets its own), and run the one-line command it shows: one for Mac and Linux, one for Windows PowerShell. It saves the key in `~/.ruam/hook-key`, readable by you only. Using a second Cursor agent for one project? Save its key in that project's `.ruam/hook-key` (and keep `.ruam/` out of git); the script reads a project's key first.

What it does:

- Cursor's hooks can only run a small script on your computer, so the plugin ships one (`plugins/ruam-cursor/hooks/ruam-hook.mjs`, plain Node, no dependencies). It needs its own key because it can't use Cursor's sign-in.
- When you give Cursor a task, the script opens a Ruam run for that conversation, and the agent's own start_run joins it with its goal (within 15 minutes). When Cursor finishes its reply, the run closes; if you keep going in the same conversation, the same run picks up again.
- It sends ids and counts only: the conversation id, the reply's id, the model and token counts when Cursor includes them. Cursor puts your email, your prompt and its reply in every hook message; the script drops them before anything leaves your computer.
- If there's no key or no network, the script does nothing and Cursor carries on.

It works in the Cursor app on your computer. Cursor's cloud agents and its command-line tool come later.

Your agent adds the goal, checkpoints and outcome itself, in every tool.

## Help

https://help.ruam.ai · support@ruam.ai

## License

MIT, see LICENSE.
