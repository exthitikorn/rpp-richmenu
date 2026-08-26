/**
 * Runnable self-check for security helpers.
 * Run: npx --yes tsx lib/security-checks.ts
 */
import assert from "node:assert/strict";

process.env.NEXTAUTH_SECRET ??= "test-secret-for-security-checks-only";

async function main() {
  const { sanitizeCallbackUrl, isAllowedHttpUrl, isAllowedTrackingTarget } =
    await import("./auth-redirect");
  const { signTrackingTarget, verifyTrackingTarget } = await import(
    "./tracking-redirect"
  );
  const { encryptSecret, decryptSecret } = await import("./secrets");

  assert.equal(sanitizeCallbackUrl("/dashboard"), "/dashboard");
  assert.equal(sanitizeCallbackUrl("/rich-menus?x=1"), "/rich-menus?x=1");
  assert.equal(sanitizeCallbackUrl("https://evil.com"), "/dashboard");
  assert.equal(sanitizeCallbackUrl("//evil.com"), "/dashboard");
  assert.equal(sanitizeCallbackUrl("/\\evil"), "/dashboard");
  assert.equal(sanitizeCallbackUrl(null), "/dashboard");

  assert.equal(isAllowedHttpUrl("https://example.com/a"), true);
  assert.equal(isAllowedHttpUrl("http://example.com"), true);
  assert.equal(isAllowedHttpUrl("javascript:alert(1)"), false);
  assert.equal(isAllowedHttpUrl("data:text/html,x"), false);
  assert.equal(isAllowedHttpUrl("/relative"), false);
  assert.equal(isAllowedHttpUrl("tel:+66812345678"), false);
  assert.equal(isAllowedHttpUrl("mailto:a@b.com"), false);

  assert.equal(isAllowedTrackingTarget("https://example.com/a"), true);
  assert.equal(isAllowedTrackingTarget("tel:+66812345678"), true);
  assert.equal(isAllowedTrackingTarget("tel:02-123-4567"), true);
  assert.equal(isAllowedTrackingTarget("mailto:a@b.com"), true);
  assert.equal(isAllowedTrackingTarget("javascript:alert(1)"), false);
  assert.equal(isAllowedTrackingTarget("data:text/html,x"), false);
  assert.equal(isAllowedTrackingTarget("tel:not-a-phone"), false);

  const parts = {
    channelId: "ch",
    richMenuId: "rm",
    areaIndex: "0",
    target: "https://hospital.example/page",
  };
  const sig = signTrackingTarget(parts);

  assert.equal(verifyTrackingTarget(parts, sig), true);
  assert.equal(verifyTrackingTarget(parts, "bad"), false);
  assert.equal(
    verifyTrackingTarget({ ...parts, target: "https://evil.com" }, sig),
    false,
  );
  assert.equal(
    verifyTrackingTarget(
      { ...parts, target: "javascript:alert(1)" },
      signTrackingTarget({ ...parts, target: "javascript:alert(1)" }),
    ),
    false,
  );

  const telParts = { ...parts, target: "tel:+66812345678" };

  assert.equal(
    verifyTrackingTarget(telParts, signTrackingTarget(telParts)),
    true,
  );

  const plain = "line-channel-secret-value";
  const enc = encryptSecret(plain);

  assert.notEqual(enc, plain);
  assert.equal(decryptSecret(enc), plain);
  assert.equal(decryptSecret(plain), plain, "legacy plaintext passthrough");

  // console.log("security-checks: ok");
}

main().catch(() => {
  // console.error(e);
  process.exit(1);
});
