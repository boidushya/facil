"use client"

import { useEffect, useState } from "react"
import { type StoredWallet, getWallets, saveWallets } from "@/lib/storage"

export function useWallets() {
  const [wallets, setWallets] = useState<StoredWallet[]>([])

  useEffect(() => {
    // Load from localStorage on mount
    setWallets(getWallets())
  }, [])

  useEffect(() => {
    // Persist whenever wallets change
    saveWallets(wallets)
  }, [wallets])

  function addWallet(w: StoredWallet) {
    setWallets((prev) => [w, ...prev])
  }

  function removeWallet(id: string) {
    setWallets((prev) => prev.filter((w) => w.id !== id))
  }

  return { wallets, addWallet, removeWallet }
}
