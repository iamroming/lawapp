import crypto from "crypto";

function getSecret(): string {
  const secret = process.env.CSRF_SECRET;
  if (!secret) {
    throw new Error("CSRF_SECRET must be set in environment variables");
  }
  return secret;
}

export function generateCsrfToken(): string {
  const secret = getSecret();
  const token = crypto.randomBytes(32).toString("hex");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(token)
    .digest("hex");
  return `${token}.${signature}`;
}

export function validateCsrfToken(token: string): boolean {
  const secret = getSecret();
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [tokenValue, signature] = parts;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(tokenValue)
    .digest("hex");

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedBuffer.length) return false;

  return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
}
