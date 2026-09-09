#!/usr/bin/env node
/**
 * Publish and reply as X @adudadid via API v2 (OAuth 1.0a user context).
 *
 * This is the write half of the Grok Bot X loop:
 *   read  = official Grok Bot X connector (mentions / timeline) — not in this repo
 *   write = this script (POST /2/tweets and replies)
 *
 * Usage:
 *   node scripts/x-publish.mjs status
 *   node scripts/x-publish.mjs post --key a [--dry-run]
 *   node scripts/x-publish.mjs post --text "..." [--dry-run]
 *   node scripts/x-publish.mjs mentions [--dry-run]
 *   node scripts/x-publish.mjs reply --to TWEET_ID --text "..." [--dry-run]
 *
 * Env (never commit values):
 *   X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { signOAuth1 } from "./x-oauth1.mjs";
import { CADENCE, POSTS, POST_KEYS, SITE_URL, X_HANDLE, assertAllowedHandle, postKeyForUtcDate, tweetUrl } from "./x-posts.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STATE_PATH = join(ROOT, ".grok", "x-publish-state.json");
const API = "https://api.x.com";

export const CRED_NAMES = ["X_API_KEY", "X_API_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_TOKEN_SECRET"];

export function missingCreds(env = process.env) {
  return CRED_NAMES.filter((name) => !String(env[name] || "").trim());
}

export function loadState(path = STATE_PATH) {
  try {
    const raw = JSON.parse(readFileSync(path, "utf8"));
    return {
      postedKeys: raw.postedKeys && typeof raw.postedKeys === "object" ? raw.postedKeys : {},
      repliedIds: Array.isArray(raw.repliedIds) ? raw.repliedIds : [],
      lastStatus: raw.lastStatus ?? null,
    };
  } catch {
    return { postedKeys: {}, repliedIds: [], lastStatus: null };
  }
}

export function saveState(state, path = STATE_PATH) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(state, null, 2)}\n`);
}

export function createTweetPayload({ text, replyTo } = {}) {
  const trimmed = String(text || "").trim();
  if (!trimmed) throw new Error("Tweet text is required");
  if (trimmed.length > 280) throw new Error(`Tweet exceeds 280 characters (${trimmed.length})`);
  const payload = { text: trimmed };
  if (replyTo) payload.reply = { in_reply_to_tweet_id: String(replyTo) };
  return payload;
}

export function parseArgs(argv) {
  const args = argv.slice(2);
  const out = { cmd: args[0] || "status", flags: {}, rest: [] };
  for (let i = 1; i < args.length; i++) {
    const token = args[i];
    if (token === "--dry-run") out.flags.dryRun = true;
    else if (token === "--force") out.flags.force = true;
    else if (token.startsWith("--") && args[i + 1] && !args[i + 1].startsWith("--")) {
      out.flags[token.slice(2)] = args[++i];
    } else {
      out.rest.push(token);
    }
  }
  return out;
}

async function xFetch(env, { method, path, query, body }) {
  const missing = missingCreds(env);
  if (missing.length) {
    const err = new Error(`Missing X credentials: ${missing.join(", ")}`);
    err.code = "MISSING_CREDS";
    err.missing = missing;
    throw err;
  }
  const url = new URL(path, API);
  if (query) {
    for (const [key, value] of Object.entries(query)) url.searchParams.set(key, String(value));
  }
  const queryObj = Object.fromEntries(url.searchParams.entries());
  const { header } = signOAuth1({
    method,
    url: `${url.origin}${url.pathname}`,
    query: queryObj,
    consumerKey: env.X_API_KEY,
    consumerSecret: env.X_API_SECRET,
    token: env.X_ACCESS_TOKEN,
    tokenSecret: env.X_ACCESS_TOKEN_SECRET,
  });
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: header,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(`X API ${res.status}: ${text.slice(0, 400)}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

export async function whoami(env, { fetchImpl = xFetch } = {}) {
  return fetchImpl(env, { method: "GET", path: "/2/users/me", query: { "user.fields": "username,name" } });
}

export async function createTweet(env, payload, { fetchImpl = xFetch } = {}) {
  return fetchImpl(env, { method: "POST", path: "/2/tweets", body: payload });
}

export async function listMentions(env, userId, { fetchImpl = xFetch } = {}) {
  return fetchImpl(env, {
    method: "GET",
    path: `/2/users/${userId}/mentions`,
    query: { max_results: "10", "tweet.fields": "author_id,created_at,conversation_id" },
  });
}

function result({ ok, action, dryRun, ...rest }) {
  return { ok, action, account: `@${X_HANDLE}`, site: SITE_URL, ...rest, dryRun: Boolean(dryRun) };
}

export async function runCommand(argv, { env = process.env, now = new Date(), fetchImpl = xFetch, statePath = STATE_PATH, stdout = console.log } = {}) {
  const { cmd, flags, rest } = parseArgs(argv);
  const missing = missingCreds(env);
  const liveBlocked = missing.length > 0;
  const dryRun = Boolean(flags.dryRun) || liveBlocked;
  const state = loadState(statePath);

  if (cmd === "status") {
    const missing = missingCreds(env);
    const gaps = [
      ...(missing.length ? [`X API user-context tokens missing: ${missing.join(", ")}`] : []),
      "Grok Bot official X connector is read-only (search/timeline/mentions) — it cannot post or reply",
      "Cursor Cloud Agent has no X MCP / X browser session",
      "Hotmail unlock for @adudadid was still TECH_BLOCK in CONTINUITY",
    ];
    let me = null;
    if (!missing.length) {
      try {
        me = await whoami(env, { fetchImpl });
        assertAllowedHandle(me?.data?.username);
      } catch (err) {
        gaps.unshift(`whoami failed: ${err.message}`);
      }
    }
    const out = result({
      ok: missing.length === 0 && Boolean(me?.data?.username),
      action: "status",
      dryRun: missing.length > 0,
      missing,
      handle: me?.data?.username ? `@${me.data.username}` : null,
      cadence: CADENCE,
      todayKey: postKeyForUtcDate(now),
      postedKeys: state.postedKeys,
      gaps,
    });
    stdout(JSON.stringify(out, null, 2));
    return out;
  }

  if (cmd === "post") {
    const key = (flags.key || rest[0] || "").toLowerCase();
    const text = flags.text || (key && POSTS[key]) || "";
    if (!text) {
      throw new Error(`Provide --key ${POST_KEYS.join("|")} or --text "..."`);
    }
    if (key && !flags.force && state.postedKeys[key]) {
      const out = result({
        ok: true,
        action: "post",
        skipped: true,
        key,
        reason: `already posted ${state.postedKeys[key].id}`,
        url: tweetUrl(state.postedKeys[key].id),
        dryRun,
      });
      stdout(JSON.stringify(out, null, 2));
      return out;
    }
    const payload = createTweetPayload({ text });
    if (dryRun) {
      const out = result({
        ok: true,
        action: "post",
        key: key || null,
        payload,
        wouldPost: true,
        missing,
        liveBlocked,
        dryRun,
      });
      stdout(JSON.stringify(out, null, 2));
      if (liveBlocked && !flags.dryRun) {
        const err = new Error(`Missing X credentials: ${missing.join(", ")}`);
        err.code = "MISSING_CREDS";
        err.missing = missing;
        err.result = out;
        throw err;
      }
      return out;
    }
    const posted = await createTweet(env, payload, { fetchImpl });
    const id = posted?.data?.id;
    if (key && id) {
      state.postedKeys[key] = { id, at: now.toISOString() };
      saveState(state, statePath);
    }
    const out = result({ ok: true, action: "post", key: key || null, id, url: id ? tweetUrl(id) : null, dryRun });
    stdout(JSON.stringify(out, null, 2));
    return out;
  }

  if (cmd === "reply") {
    const replyTo = flags.to || rest[0];
    const text = flags.text || rest.slice(1).join(" ");
    const payload = createTweetPayload({ text, replyTo });
    if (dryRun) {
      const out = result({
        ok: true,
        action: "reply",
        payload,
        wouldPost: true,
        missing,
        liveBlocked,
        dryRun,
      });
      stdout(JSON.stringify(out, null, 2));
      if (liveBlocked && !flags.dryRun) {
        const err = new Error(`Missing X credentials: ${missing.join(", ")}`);
        err.code = "MISSING_CREDS";
        err.missing = missing;
        err.result = out;
        throw err;
      }
      return out;
    }
    if (state.repliedIds.includes(String(replyTo)) && !flags.force) {
      const out = result({ ok: true, action: "reply", skipped: true, reason: "already replied", replyTo, dryRun: false });
      stdout(JSON.stringify(out, null, 2));
      return out;
    }
    const posted = await createTweet(env, payload, { fetchImpl });
    const id = posted?.data?.id;
    if (replyTo) {
      state.repliedIds.push(String(replyTo));
      saveState(state, statePath);
    }
    const out = result({ ok: true, action: "reply", id, replyTo, url: id ? tweetUrl(id) : null, dryRun });
    stdout(JSON.stringify(out, null, 2));
    return out;
  }

  if (cmd === "mentions") {
    if (dryRun) {
      const out = result({
        ok: true,
        action: "mentions",
        wouldFetch: true,
        missing: missingCreds(env),
        alreadyReplied: state.repliedIds,
        note: "Read mentions via X API or Grok Bot X connector, then: node scripts/x-publish.mjs reply --to ID --text \"...\"",
        dryRun,
      });
      stdout(JSON.stringify(out, null, 2));
      return out;
    }
    const me = await whoami(env, { fetchImpl });
    assertAllowedHandle(me?.data?.username);
    const mentions = await listMentions(env, me.data.id, { fetchImpl });
    const pending = (mentions.data || []).filter((t) => !state.repliedIds.includes(String(t.id)));
    const out = result({
      ok: true,
      action: "mentions",
      handle: `@${me.data.username}`,
      pending,
      alreadyReplied: state.repliedIds,
      dryRun,
    });
    stdout(JSON.stringify(out, null, 2));
    return out;
  }

  throw new Error(`Unknown command: ${cmd}. Use status|post|reply|mentions`);
}

const isMain = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  runCommand(process.argv).catch((err) => {
    const payload = {
      ok: false,
      error: err.message,
      missing: err.missing || missingCreds(),
      code: err.code || null,
    };
    console.error(JSON.stringify(payload, null, 2));
    process.exit(err.code === "MISSING_CREDS" ? 2 : 1);
  });
}
