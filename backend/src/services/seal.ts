/**
 * Seal encryption service — client-side encryption before Walrus upload.
 * In production this runs in the browser using @mysten/seal SDK.
 * Backend handles key management metadata only.
 *
 * For the MVP demo we simulate encryption with AES-256-GCM.
 */
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';

export interface SealEncryptResult {
  ciphertext: Buffer;
  sealKeyId: string; // opaque key reference stored on-chain
  iv: string;        // base64
  authTag: string;   // base64
}

/** Encrypt data. In production, key is derived from patient's Sui keypair via Seal. */
export function encryptRecord(plaintext: Buffer, patientAddress: string): SealEncryptResult {
  // Derive a deterministic key from patient address for demo purposes.
  // Production: use @mysten/seal threshold encryption.
  const key = randomBytes(32);
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // In production, `key` is split via Seal threshold scheme and `sealKeyId` is the on-chain reference.
  const sealKeyId = `seal_${patientAddress.slice(2, 10)}_${Date.now()}`;

  return {
    ciphertext,
    sealKeyId,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
}

export function decryptRecord(
  ciphertext: Buffer,
  key: Buffer,
  iv: string,
  authTag: string
): Buffer {
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(authTag, 'base64'));
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}
