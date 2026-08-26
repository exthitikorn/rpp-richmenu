import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";

const PREFIX = "v1:";

function encryptionKey(): Uint8Array {
  const raw =
    process.env.CREDENTIALS_ENCRYPTION_KEY ?? process.env.NEXTAUTH_SECRET;

  if (!raw) {
    throw new Error(
      "CREDENTIALS_ENCRYPTION_KEY or NEXTAUTH_SECRET is required to encrypt credentials",
    );
  }

  return Uint8Array.from(createHash("sha256").update(raw).digest());
}

function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;

  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }

  return out;
}

/** AES-256-GCM. Legacy plaintext (no prefix) passes through decrypt unchanged. */
export function encryptSecret(plain: string): string {
  const iv = Uint8Array.from(randomBytes(12));
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const enc = concatBytes(
    Uint8Array.from(cipher.update(plain, "utf8")),
    Uint8Array.from(cipher.final()),
  );
  const tag = Uint8Array.from(cipher.getAuthTag());

  return PREFIX + Buffer.from(concatBytes(iv, tag, enc)).toString("base64url");
}

export function decryptSecret(value: string): string {
  if (!value.startsWith(PREFIX)) return value;

  const buf = Uint8Array.from(
    Buffer.from(value.slice(PREFIX.length), "base64url"),
  );
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);

  decipher.setAuthTag(tag);

  return Buffer.from(
    concatBytes(
      Uint8Array.from(decipher.update(data)),
      Uint8Array.from(decipher.final()),
    ),
  ).toString("utf8");
}

export function decryptLineCredentials<
  T extends { channelSecret: string; accessToken: string },
>(account: T): T {
  return {
    ...account,
    channelSecret: decryptSecret(account.channelSecret),
    accessToken: decryptSecret(account.accessToken),
  };
}
