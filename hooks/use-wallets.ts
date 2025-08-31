"use client";

import { useCallback, useEffect, useState } from "react";
import { type StoredWallet, getWallets, saveWallets } from "@/lib/storage";

export function useWallets() {
  const [wallets, setWallets] = useState<StoredWallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage on mount
    const loadedWallets = getWallets();
    setWallets(loadedWallets);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Persist whenever wallets change (but not during initial load)
    if (!isLoading) {
      saveWallets(wallets);
    }
  }, [wallets, isLoading]);

  const addWallet = useCallback((w: StoredWallet) => {
    setWallets(prev => [w, ...prev]);
  }, []);

  const removeWallet = useCallback((id: string) => {
    setWallets(prev => prev.filter(w => w.id !== id));
  }, []);

  return { wallets, addWallet, removeWallet, isLoading };
}
