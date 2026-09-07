import { createHmac, timingSafeEqual } from "node:crypto";

const WEBHOOK_MAX_AGE_SEC = 5 * 60;

export function verifySubyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  timestampHeader: string | null,
  webhookSecret: string | undefined,
): boolean {
  if (!webhookSecret || !signatureHeader || !timestampHeader) return false;

  const timestamp = Number(timestampHeader);
  if (!Number.isFinite(timestamp)) return false;
  const ageSec = Math.abs(Math.floor(Date.now() / 1000) - timestamp);
  if (ageSec > WEBHOOK_MAX_AGE_SEC) return false;

  const signedPayload = `${timestampHeader}.${rawBody}`;
  const expected = createHmac("sha256", webhookSecret).update(signedPayload).digest("hex");
  const expectedSig = `v1=${expected}`;

  const provided = signatureHeader.trim();
  if (provided.length !== expectedSig.length) return false;
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expectedSig));
}
