import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  resolveSubyPaymentMethods,
  subyProductIsCardFirst,
  subyProductSupportsPaymentMethods,
} from "./suby-payment-methods.ts";

function withEnv(overrides: Record<string, string | undefined>, fn: () => void): void {
  const previous = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries(overrides)) {
    previous.set(key, process.env[key]);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    fn();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

describe("resolveSubyPaymentMethods", () => {
  it("defaults to CARD-only (no crypto QR default)", () => {
    withEnv({ SUBY_PAYMENT_METHODS: undefined }, () => {
      assert.deepEqual(resolveSubyPaymentMethods(), ["CARD"]);
    });
  });

  it("parses comma-separated methods", () => {
    withEnv({ SUBY_PAYMENT_METHODS: "card,crypto" }, () => {
      assert.deepEqual(resolveSubyPaymentMethods(), ["CARD", "CRYPTO"]);
    });
  });

  it("falls back to CARD when env is invalid", () => {
    withEnv({ SUBY_PAYMENT_METHODS: "wire" }, () => {
      assert.deepEqual(resolveSubyPaymentMethods(), ["CARD"]);
    });
  });
});

describe("suby product payment method checks", () => {
  it("detects CARD support", () => {
    assert.equal(subyProductSupportsPaymentMethods({ paymentMethods: ["CARD"] }, ["CARD"]), true);
    assert.equal(subyProductSupportsPaymentMethods({ paymentMethods: ["CRYPTO"] }, ["CARD"]), false);
  });

  it("treats CARD-before-CRYPTO as card-first", () => {
    assert.equal(subyProductIsCardFirst({ paymentMethods: ["CARD"] }), true);
    assert.equal(subyProductIsCardFirst({ paymentMethods: ["CRYPTO", "CARD"] }), false);
    assert.equal(subyProductIsCardFirst({ paymentMethods: ["CARD", "CRYPTO"] }), true);
  });
});
