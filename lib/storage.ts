import type { EncryptedPayload } from "./crypto";

export type StoredWallet = {
  id: string;
  address: `0x${string}`;
  enc: EncryptedPayload;
  createdAt: string;
  label?: string;
};

const KEY = "facil:wallets";

export function getWallets(): StoredWallet[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredWallet[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(w => typeof w?.address === "string" && typeof w?.enc?.ct === "string");
  } catch {
    return [];
  }
}

export function saveWallets(list: StoredWallet[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
}
