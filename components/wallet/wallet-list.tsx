"use client";

import type React from "react";

import { useBalances } from "@/hooks/use-balances";
import { decryptToString } from "@/lib/crypto";
import type { StoredWallet } from "@/lib/storage";
import { shortenAddress } from "@/lib/utils";
import { useState } from "react";

type Props = {
  wallets: StoredWallet[];
  onRemove: (id: string) => void;
};

function WalletItem({ w, onRemove }: { w: StoredWallet; onRemove: (id: string) => void }) {
  const { data, isLoading, error } = useBalances(w.address);
  const [showReveal, setShowReveal] = useState(false);
  const [password, setPassword] = useState("");
  const [revealed, setRevealed] = useState<string | null>(null);
  const [revealError, setRevealError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleReveal(e: React.FormEvent) {
    e.preventDefault();
    setRevealError(null);
    setBusy(true);
    try {
      const pk = await decryptToString(w.enc, password);
      setRevealed(pk);
    } catch (_err) {
      setRevealed(null);
      setRevealError("Invalid password or corrupted data.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="card">
      <div className="row row-between gap-4">
        <div>
          <p className="text-sm font-medium">
            {w.label ? `${w.label} • ` : ""}
            {shortenAddress(w.address)}
          </p>
          <p className="text-xs muted">Created {new Date(w.createdAt).toLocaleString()}</p>
        </div>
        <div className="row gap-2">
          <button className="btn btn-outline btn-sm" onClick={() => navigator.clipboard.writeText(w.address)}>
            Copy address
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => setShowReveal(s => !s)} aria-expanded={showReveal}>
            {showReveal ? "Hide" : "Reveal key"}
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => onRemove(w.id)}>
            Remove
          </button>
        </div>
      </div>

      <div className="balance-grid">
        <div className="panel">
          <p className="text-xs muted">Sepolia ETH</p>
          <p className="text-sm font-medium">{isLoading ? "Loading…" : error ? "—" : data?.sepolia}</p>
        </div>
        <div className="panel">
          <p className="text-xs muted">BSC Testnet BNB</p>
          <p className="text-sm font-medium">{isLoading ? "Loading…" : error ? "—" : data?.bscTestnet}</p>
        </div>
      </div>

      {showReveal && (
        <form onSubmit={handleReveal} className="reveal-form">
          <label htmlFor={`pw-${w.id}`} className="label">
            Enter password to reveal private key
          </label>
          <div className="row gap-2">
            <input
              id={`pw-${w.id}`}
              type="password"
              className="input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button type="submit" disabled={busy} className="btn btn-primary">
              {busy ? "Decrypting…" : "Reveal"}
            </button>
          </div>
          {revealError ? (
            <p role="alert" className="error text-sm">
              {revealError}
            </p>
          ) : null}
          {revealed ? (
            <div className="card mt-2">
              <p className="text-xs muted">Private key</p>
              <code className="code-block">{revealed}</code>
              <div className="mt-2">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => navigator.clipboard.writeText(revealed)}
                >
                  Copy key
                </button>
              </div>
            </div>
          ) : null}
        </form>
      )}
    </li>
  );
}

export default function WalletList({ wallets, onRemove }: Props) {
  if (!wallets.length) {
    return <p className="placeholder-text">No wallets yet. Create one above to get started.</p>;
  }
  return (
    <ul className="list-spaced">
      {wallets.map(w => (
        <WalletItem key={w.id} w={w} onRemove={onRemove} />
      ))}
    </ul>
  );
}
