/**
 * @henryco/kyc — dependency-free AWS Signature V4 signer for JSON ("Trent")
 * services, built on Web Crypto. Hand-rolls the signature (no `@aws-sdk/*`
 * dependency) so it adds ZERO install weight.
 *
 * Used only by the KMS master-key provider; isolated here so the SigV4 surface
 * is small, testable, and reusable.
 */

export type AwsCredentials = {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
};

const encoder = new TextEncoder();

function bytes(input: string): BufferSource {
  return new Uint8Array(encoder.encode(input));
}

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(data: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", bytes(data)));
}

async function hmac(key: BufferSource, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", cryptoKey, bytes(data));
}

async function deriveSigningKey(
  secret: string,
  dateStamp: string,
  region: string,
  service: string,
): Promise<ArrayBuffer> {
  const kDate = await hmac(bytes(`AWS4${secret}`), dateStamp);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, service);
  return hmac(kService, "aws4_request");
}

function amzDates(now: Date): { amzDate: string; dateStamp: string } {
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return { amzDate, dateStamp: amzDate.slice(0, 8) };
}

/**
 * Sign a POST to an AWS JSON-protocol service (e.g. KMS / "TrentService").
 * Returns the absolute URL and the full header set, including the SigV4
 * Authorization header. Caller performs the `fetch`.
 */
export async function signJsonRequest(opts: {
  service: string;
  host: string;
  path?: string;
  target: string;
  body: string;
  creds: AwsCredentials;
  now: Date;
  contentType?: string;
}): Promise<{ url: string; headers: Record<string, string> }> {
  const { service, host, target, body, creds, now } = opts;
  const path = opts.path ?? "/";
  const contentType = opts.contentType ?? "application/x-amz-json-1.1";
  const { amzDate, dateStamp } = amzDates(now);
  const payloadHash = await sha256Hex(body);

  const canonicalHeaders =
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n` +
    `x-amz-target:${target}\n` +
    (creds.sessionToken ? `x-amz-security-token:${creds.sessionToken}\n` : "");
  const signedHeaders = creds.sessionToken
    ? "content-type;host;x-amz-content-sha256;x-amz-date;x-amz-target;x-amz-security-token"
    : "content-type;host;x-amz-content-sha256;x-amz-date;x-amz-target";

  const canonicalRequest = `POST\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const credentialScope = `${dateStamp}/${creds.region}/${service}/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${await sha256Hex(
    canonicalRequest,
  )}`;

  const signingKey = await deriveSigningKey(creds.secretAccessKey, dateStamp, creds.region, service);
  const signature = toHex(await hmac(signingKey, stringToSign));

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${creds.accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    url: `https://${host}${path}`,
    headers: {
      "Content-Type": contentType,
      "X-Amz-Date": amzDate,
      "X-Amz-Content-Sha256": payloadHash,
      "X-Amz-Target": target,
      Authorization: authorization,
      ...(creds.sessionToken ? { "X-Amz-Security-Token": creds.sessionToken } : {}),
    },
  };
}
