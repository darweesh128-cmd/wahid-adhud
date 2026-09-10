import assert from "node:assert/strict";
import { test } from "node:test";
import { isPublicHidden } from "./public-hidden.ts";

test("isPublicHidden reads PUBLIC_HIDDEN and VITE_PUBLIC_HIDDEN", () => {
  assert.equal(isPublicHidden({}), false);
  assert.equal(isPublicHidden({ PUBLIC_HIDDEN: "true" }), true);
  assert.equal(isPublicHidden({ VITE_PUBLIC_HIDDEN: "1" }), true);
  assert.equal(isPublicHidden({ PUBLIC_HIDDEN: "false" }), false);
});
