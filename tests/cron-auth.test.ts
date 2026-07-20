import assert from "node:assert/strict";
import test from "node:test";
import { verifyCronAuthorization } from "../lib/cron-auth";

test("production fails closed when CRON_SECRET is missing", () => {
  assert.deepEqual(verifyCronAuthorization(null, undefined, "production"), {
    ok: false,
    status: 503,
    error: "cron is not configured",
  });
});

test("local development works without CRON_SECRET", () => {
  assert.deepEqual(verifyCronAuthorization(null, undefined, "development"), {
    ok: true,
  });
});

test("configured cron requires an exact bearer token", () => {
  assert.equal(
    verifyCronAuthorization("Bearer secret", "secret", "production").ok,
    true,
  );
  assert.equal(
    verifyCronAuthorization("Bearer wrong", "secret", "production").ok,
    false,
  );
});
