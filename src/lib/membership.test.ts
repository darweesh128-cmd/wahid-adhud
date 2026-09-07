import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { checkoutMode, isSubySessionId } from "./membership.ts";
import { verifySubyWebhookSignature } from "./suby-webhook-verify.ts";

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

describe("membership provider resolution", () => {
  it("selects suby when MEMBERSHIP_PROVIDER=suby and keys are set", () => {
    withEnv(
      {
        MEMBERSHIP_CHECKOUT_V2: "true",
        MEMBERSHIP_PROVIDER: "suby",
        SUBY_API_KEY: "sk_sandbox_test",
        SUBY_PRODUCT_ID: "pro_test",
        STRIPE_SECRET_KEY: undefined,
        MEMBERSHIP_CHECKOUT_MOCK: undefined,
      },
      () => {
        assert.equal(checkoutMode(), "suby");
      },
    );
  });

  it("auto-prefers suby over stripe when both are configured", () => {
    withEnv(
      {
        MEMBERSHIP_CHECKOUT_V2: "true",
        MEMBERSHIP_PROVIDER: undefined,
        SUBY_API_KEY: "sk_sandbox_test",
        SUBY_PRODUCT_ID: "pro_test",
        STRIPE_SECRET_KEY: "sk_test_abc",
        MEMBERSHIP_CHECKOUT_MOCK: undefined,
      },
      () => {
        assert.equal(checkoutMode(), "suby");
      },
    );
  });

  it("forces mock when MEMBERSHIP_PROVIDER=mock", () => {
    withEnv(
      {
        MEMBERSHIP_CHECKOUT_V2: "true",
        MEMBERSHIP_PROVIDER: "mock",
        SUBY_API_KEY: "sk_sandbox_test",
        SUBY_PRODUCT_ID: "pro_test",
        STRIPE_SECRET_KEY: "sk_test_abc",
      },
      () => {
        assert.equal(checkoutMode(), "mock");
      },
    );
  });

  it("recognizes Suby payment session ids", () => {
    assert.equal(isSubySessionId("pay_abc123"), true);
    assert.equal(isSubySessionId("cs_test_123"), false);
  });
});

describe("suby webhook signature", () => {
  it("verifies v1 HMAC signatures", () => {
    const secret = "whsec_test";
    const timestamp = String(Math.floor(Date.now() / 1000));
    const rawBody = JSON.stringify({ type: "CHECKOUT_SUCCESS" });
    const digest = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");

    withEnv({ SUBY_WEBHOOK_SECRET: secret }, () => {
      assert.equal(
        verifySubyWebhookSignature(rawBody, `v1=${digest}`, timestamp, secret),
        true,
      );
      assert.equal(verifySubyWebhookSignature(rawBody, "v1=bad", timestamp, secret), false);
    });
  });
});
