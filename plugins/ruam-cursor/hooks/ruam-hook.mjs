#!/usr/bin/env node
// Ruam's hook script for Cursor. Cursor runs it with the hook event's JSON on
// stdin. It sends Ruam ids and counts only, with this computer's hook key
// (saved from Ruam's Connect Cursor page into ~/.ruam/hook-key, or into a
// project's own .ruam/hook-key, which wins, so two Cursor agents can log
// from one computer):
//   start  (beforeSubmitPrompt): the conversation id
//   usage  (afterAgentResponse): the conversation and generation ids, the
//          model and the token counts, when Cursor includes them
//   stop   (stop) and end (sessionEnd): the conversation id
// It never sends the prompt, the reply, the transcript path or your email,
// even though Cursor puts them in the event. It fails open: no key, no
// network or any error, and Cursor carries on as if it weren't there.
// No dependencies: plain Node 18 or later.

import { readFileSync } from 'node:fs'
import { homedir, platform } from 'node:os'
import { join } from 'node:path'

const DEFAULT_ADDRESS = 'https://app.ruam.ai/api/agents/hook'
// An override (for testing) is used only when it is https: the key is a bearer.
const ADDRESS = /^https:\/\/[^\s]+$/.test(process.env.RUAM_HOOK_URL || '') ? process.env.RUAM_HOOK_URL : DEFAULT_ADDRESS
const HOME_KEY = join(homedir(), '.ruam', 'hook-key')
const KEY = /^ruam_hk_[A-Za-z0-9_-]{43}$/
// The same caps as Ruam's hook address: ids up to 120, the model up to 100.
const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/
const MODEL_MAX = 100
const EVENTS = new Set(['start', 'usage', 'stop', 'end'])

function done() {
  // beforeSubmitPrompt reads a decision; every other event ignores the answer.
  process.stdout.write(JSON.stringify(event === 'start' ? { continue: true } : {}))
  process.exit(0)
}

const event = process.argv[2]

async function readStdin() {
  const chunks = []
  for await (const c of process.stdin) {
    chunks.push(c)
    if (chunks.reduce((n, x) => n + x.length, 0) > 2_000_000) break
  }
  return Buffer.concat(chunks).toString('utf8')
}

const id = (v) => (typeof v === 'string' && ID.test(v) ? v : undefined)
const count = (v) => (Number.isInteger(v) && v >= 0 && v <= 5_000_000 ? v : undefined)

function deviceKind() {
  const p = platform()
  return p === 'darwin' ? 'mac' : p === 'win32' ? 'windows' : p === 'linux' ? 'linux' : undefined
}

/** The numbers, if Cursor's event carries any (field names vary by version). */
function usageOf(e) {
  const u = e.usage || e.token_usage || e.tokens
  if (!u || typeof u !== 'object') return undefined
  const input = count(u.input_tokens ?? u.inputTokens)
  const output = count(u.output_tokens ?? u.outputTokens)
  if (input === undefined || output === undefined) return undefined
  const cacheRead = count(u.cache_read_tokens ?? u.cacheReadTokens ?? u.cache_read_input_tokens)
  const cacheWrite = count(u.cache_write_tokens ?? u.cacheWriteTokens ?? u.cache_creation_input_tokens)
  return { input_tokens: input, output_tokens: output, ...(cacheRead !== undefined ? { cache_read_tokens: cacheRead } : {}), ...(cacheWrite !== undefined ? { cache_write_tokens: cacheWrite } : {}) }
}

function readKey(file) {
  try {
    const k = readFileSync(file, 'utf8').trim()
    return KEY.test(k) ? k : null
  } catch {
    return null
  }
}

async function main() {
  if (!EVENTS.has(event)) return done()
  let e
  try {
    e = JSON.parse(await readStdin())
  } catch {
    return done()
  }
  // A project's own key first, then this computer's.
  const roots = Array.isArray(e.workspace_roots) ? e.workspace_roots.filter((r) => typeof r === 'string') : []
  const key = roots.map((r) => readKey(join(r, '.ruam', 'hook-key'))).find(Boolean) || readKey(HOME_KEY)
  if (!key) return done()
  const conversation = id(e.conversation_id)
  if (!conversation) return done()
  // Ids and numbers only. Nothing else in the event leaves this computer.
  const body = { event, conversation_id: conversation, device: deviceKind() }
  if (event === 'usage') {
    const generation = id(e.generation_id)
    const model = typeof e.model === 'string' && e.model.length > 0 && e.model.length <= MODEL_MAX ? e.model : undefined
    const usage = usageOf(e)
    if (!generation || !model || !usage) return done()
    Object.assign(body, { generation_id: generation, model, usage })
  }
  try {
    await fetch(ADDRESS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(3000),
    })
  } catch {
    // ignored on purpose: the hook never stops Cursor
  }
  done()
}

main().catch(() => done())
