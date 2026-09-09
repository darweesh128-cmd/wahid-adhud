import assert from "node:assert/strict";
import { test } from "node:test";
import { POWER, REPLIES } from "./x-replies.mjs";

test("every celebrity reply fits in one X comment", () => {
  assert.ok(REPLIES.length >= 8);
  for (const row of REPLIES) {
    assert.ok(row.text.length <= 280, `${row.id} is ${row.text.length}`);
    assert.match(row.text, /adhud\.xyz/);
    assert.doesNotMatch(row.text, /Tarkou78/i);
  }
});

test("power voice is quiet-house not a sales pitch", () => {
  assert.match(POWER.rule, /Mystery/);
  assert.ok(POWER.never.includes("scam/pitch framing"));
});
