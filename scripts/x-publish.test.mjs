import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { signOAuth1 } from "./x-oauth1.mjs";
import { POSTS, assertAllowedHandle, postKeyForUtcDate } from "./x-posts.mjs";
import { createTweetPayload, missingCreds, parseArgs, runCommand } from "./x-publish.mjs";

test("OAuth 1.0a signature is stable for known inputs", () => {
  const { header, oauth, base } = signOAuth1({
    method: "POST",
    url: "https://api.x.com/2/tweets",
    consumerKey: "ck",
    consumerSecret: "cs",
    token: "at",
    tokenSecret: "ats",
    nonce: "nonce1",
    timestamp: "1710000000",
  });
  assert.match(base, /^POST&https%3A%2F%2Fapi.x.com%2F2%2Ftweets&/);
  assert.equal(oauth.oauth_signature, "wcyml9AQOGp5gte74WvT5VK6SNQ=");
  assert.match(header, /^OAuth /);
  assert.match(header, /oauth_signature=/);
});

test("createTweetPayload builds post and reply bodies", () => {
  assert.deepEqual(createTweetPayload({ text: "hello" }), { text: "hello" });
  assert.deepEqual(createTweetPayload({ text: "hi", replyTo: "123" }), {
    text: "hi",
    reply: { in_reply_to_tweet_id: "123" },
  });
  assert.throws(() => createTweetPayload({ text: "x".repeat(281) }), /280/);
});

test("forbidden handle is rejected", () => {
  assert.throws(() => assertAllowedHandle("Tarkou78"), /Forbidden/);
  assert.doesNotThrow(() => assertAllowedHandle("adudadid"));
  assert.doesNotThrow(() => assertAllowedHandle("@adudadid"));
});

test("cadence maps UTC weekdays", () => {
  assert.equal(postKeyForUtcDate(new Date("2026-09-07T12:00:00Z")), "a"); // Monday
  assert.equal(postKeyForUtcDate(new Date("2026-09-08T12:00:00Z")), null); // Tuesday
  assert.equal(postKeyForUtcDate(new Date("2026-09-09T12:00:00Z")), "c"); // Wednesday
});

test("missingCreds lists empty env names", () => {
  assert.deepEqual(missingCreds({}), [
    "X_API_KEY",
    "X_API_SECRET",
    "X_ACCESS_TOKEN",
    "X_ACCESS_TOKEN_SECRET",
  ]);
  assert.deepEqual(missingCreds({ X_API_KEY: "a", X_API_SECRET: "b", X_ACCESS_TOKEN: "c", X_ACCESS_TOKEN_SECRET: "d" }), []);
});

test("parseArgs reads flags", () => {
  const parsed = parseArgs(["node", "x-publish.mjs", "reply", "--to", "99", "--text", "thanks", "--dry-run"]);
  assert.equal(parsed.cmd, "reply");
  assert.equal(parsed.flags.to, "99");
  assert.equal(parsed.flags.text, "thanks");
  assert.equal(parsed.flags.dryRun, true);
});

test("status reports gaps without credentials", async () => {
  const lines = [];
  const out = await runCommand(["node", "x-publish.mjs", "status"], {
    env: {},
    stdout: (s) => lines.push(s),
  });
  assert.equal(out.action, "status");
  assert.equal(out.account, "@adudadid");
  assert.ok(out.missing.includes("X_API_KEY"));
  assert.ok(out.gaps.some((g) => /read-only/i.test(g)));
  assert.match(lines[0], /"action": "status"/);
});

test("post --dry-run prints payload and does not throw", async () => {
  const out = await runCommand(["node", "x-publish.mjs", "post", "--key", "b", "--dry-run"], {
    env: {},
    stdout: () => {},
  });
  assert.equal(out.wouldPost, true);
  assert.equal(out.dryRun, true);
  assert.equal(out.payload.text, POSTS.b);
});

test("live post without creds still shows payload then exits MISSING_CREDS", async () => {
  await assert.rejects(
    () => runCommand(["node", "x-publish.mjs", "post", "--key", "a"], { env: {}, stdout: () => {} }),
    (err) => err.code === "MISSING_CREDS" && err.result?.payload?.text === POSTS.a,
  );
});

test("reply --dry-run includes in_reply_to_tweet_id", async () => {
  const out = await runCommand(
    ["node", "x-publish.mjs", "reply", "--to", "777", "--text", "Trust first → https://www.adhud.xyz", "--dry-run"],
    { env: {}, stdout: () => {} },
  );
  assert.equal(out.payload.reply.in_reply_to_tweet_id, "777");
});

test("live createTweet is used when creds exist", async () => {
  const calls = [];
  const env = {
    X_API_KEY: "ck",
    X_API_SECRET: "cs",
    X_ACCESS_TOKEN: "at",
    X_ACCESS_TOKEN_SECRET: "ats",
  };
  const dir = mkdtempSync(join(tmpdir(), "x-pub-"));
  const statePath = join(dir, "state.json");
  writeFileSync(statePath, "{}\n");
  const out = await runCommand(["node", "x-publish.mjs", "post", "--key", "e"], {
    env,
    statePath,
    stdout: () => {},
    fetchImpl: async (_env, req) => {
      calls.push(req);
      return { data: { id: "555" } };
    },
  });
  assert.equal(out.id, "555");
  assert.equal(out.url, "https://x.com/adudadid/status/555");
  assert.equal(calls[0].method, "POST");
  assert.equal(calls[0].path, "/2/tweets");
  const saved = JSON.parse(readFileSync(statePath, "utf8"));
  assert.equal(saved.postedKeys.e.id, "555");
});

test("duplicate post key is skipped unless --force", async () => {
  const dir = mkdtempSync(join(tmpdir(), "x-pub-"));
  const statePath = join(dir, "state.json");
  writeFileSync(statePath, JSON.stringify({ postedKeys: { a: { id: "1" } }, repliedIds: [] }));
  const env = {
    X_API_KEY: "ck",
    X_API_SECRET: "cs",
    X_ACCESS_TOKEN: "at",
    X_ACCESS_TOKEN_SECRET: "ats",
  };
  let called = 0;
  const out = await runCommand(["node", "x-publish.mjs", "post", "--key", "a"], {
    env,
    statePath,
    stdout: () => {},
    fetchImpl: async () => {
      called += 1;
      return { data: { id: "2" } };
    },
  });
  assert.equal(out.skipped, true);
  assert.equal(called, 0);
});
