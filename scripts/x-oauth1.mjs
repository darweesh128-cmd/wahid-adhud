/**
 * OAuth 1.0a HMAC-SHA1 for X API v2 user-context calls.
 * JSON request bodies are not signed (X API v2 convention).
 */
import crypto from "node:crypto";

export function percentEncode(value) {
  return encodeURIComponent(String(value)).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

export function buildParamString(params) {
  return Object.keys(params)
    .sort()
    .map((key) => `${percentEncode(key)}=${percentEncode(params[key])}`)
    .join("&");
}

export function signatureBaseString(method, url, params) {
  return [method.toUpperCase(), percentEncode(url), percentEncode(buildParamString(params))].join("&");
}

export function signOAuth1({
  method,
  url,
  query = {},
  consumerKey,
  consumerSecret,
  token,
  tokenSecret,
  nonce,
  timestamp,
}) {
  const oauth = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce ?? crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp ?? String(Math.floor(Date.now() / 1000)),
    oauth_token: token,
    oauth_version: "1.0",
  };
  const base = signatureBaseString(method, url, { ...query, ...oauth });
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;
  const signature = crypto.createHmac("sha1", signingKey).update(base).digest("base64");
  const withSig = { ...oauth, oauth_signature: signature };
  const header =
    "OAuth " +
    Object.keys(withSig)
      .sort()
      .map((key) => `${percentEncode(key)}="${percentEncode(withSig[key])}"`)
      .join(", ");
  return { header, oauth: withSig, base };
}
