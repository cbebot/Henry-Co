import "server-only";

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT_KEYLEN = 32;

export function hashWithdrawalPin(pin: string): string {
  const salt = randomBytes(16);
  const key = scryptSync(pin, salt, SCRYPT_KEYLEN);
  return `${salt.toString("hex")}:${key.toString("hex")}`;
}

export function verifyWithdrawalPin(pin: string, stored: string | null | undefined): boolean {
  if (!stored || !pin) return false;
  const parts = stored.split(":");
  if (parts.length !== 2) return false;
  const [saltHex, keyHex] = parts;
  try {
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(keyHex, "hex");
    const key = scryptSync(pin, salt, expected.length);
    return timingSafeEqual(key, expected);
  } catch {
    return false;
  }
}

export function isValidWithdrawalPinFormat(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}
