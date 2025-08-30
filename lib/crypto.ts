const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey("raw", textEncoder.encode(password), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: 150_000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
  return key;
}

export type EncryptedPayload = {
  ct: string;
  iv: string;
  salt: string;
  ver?: number;
};

export async function encryptString(plain: string, password: string): Promise<EncryptedPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(password, salt);
  const cipherBuf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, textEncoder.encode(plain));
  return {
    ct: toBase64(new Uint8Array(cipherBuf)),
    iv: toBase64(iv),
    salt: toBase64(salt),
    ver: 1,
  };
}

export async function decryptToString(payload: EncryptedPayload, password: string): Promise<string> {
  const iv = fromBase64(payload.iv);
  const salt = fromBase64(payload.salt);
  const key = await deriveKey(password, salt);
  const cipher = fromBase64(payload.ct);
  const plainBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    cipher as BufferSource
  );
  return textDecoder.decode(plainBuf);
}
