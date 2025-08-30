"use client";

import type React from "react";

import { useBalances } from "@/hooks/use-balances";
import { decryptToString } from "@/lib/crypto";
import type { StoredWallet } from "@/lib/storage";
import { shortenAddress } from "@/lib/utils";
import { useCallback, useState } from "react";

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
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const showCopyFeedback = useCallback((message: string) => {
    setCopyFeedback(message);
    setTimeout(() => setCopyFeedback(null), 2000);
  }, []);

  const handleCopyAddress = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(w.address);
      showCopyFeedback("Address copied!");
    } catch {
      showCopyFeedback("Failed to copy");
    }
  }, [w.address, showCopyFeedback]);

  const handleCopyPrivateKey = useCallback(async () => {
    if (!revealed) return;
    try {
      await navigator.clipboard.writeText(revealed);
      showCopyFeedback("Private key copied!");
    } catch {
      showCopyFeedback("Failed to copy");
    }
  }, [revealed, showCopyFeedback]);

  const handleToggleReveal = useCallback(() => {
    setShowReveal(s => !s);
    if (showReveal) {
      // Hide the form - reset states
      setPassword("");
      setRevealed(null);
      setRevealError(null);
    }
  }, [showReveal]);

  async function handleReveal(e: React.FormEvent) {
    e.preventDefault();
    setRevealError(null);
    setBusy(true);
    try {
      const pk = await decryptToString(w.enc, password);
      setRevealed(pk);
      setPassword(""); // Clear password after successful reveal
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
          <button className="btn btn-outline btn-sm" onClick={handleCopyAddress} aria-label="Copy wallet address">
            Copy address
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={handleToggleReveal}
            aria-expanded={showReveal}
            aria-label={showReveal ? "Hide private key form" : "Show private key form"}
          >
            {showReveal ? "Hide" : "Reveal key"}
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => onRemove(w.id)} aria-label="Remove wallet">
            Remove
          </button>
        </div>
      </div>

      {copyFeedback && (
        <div className="copy-feedback row gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="var(--color-success)"
            width={16}
            height={16}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>

          <p className="text-sm text-success">{copyFeedback}</p>
        </div>
      )}

      <div className="balance-grid">
        <div className="panel">
          <p className="text-xs muted">Sepolia ETH</p>
          <p className="text-sm font-medium">
            {isLoading ? "Loading…" : error ? <span className="error">Failed to load</span> : data?.sepolia || "0 ETH"}
          </p>
        </div>
        <div className="panel">
          <p className="text-xs muted">BSC Testnet BNB</p>
          <p className="text-sm font-medium">
            {isLoading ? (
              "Loading…"
            ) : error ? (
              <span className="error">Failed to load</span>
            ) : (
              data?.bscTestnet || "0 BNB"
            )}
          </p>
        </div>
      </div>

      {showReveal && (
        <form onSubmit={handleReveal} className="reveal-form">
          {!revealed && (
            <>
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
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button type="submit" disabled={busy || !password.trim()} className="btn btn-primary">
                  {busy ? "Decrypting…" : "Reveal"}
                </button>
              </div>
            </>
          )}
          {revealError ? (
            <p role="alert" className="error text-sm">
              {revealError}
            </p>
          ) : null}
          {revealed ? (
            <div className="card mt-2">
              <div className="security-warning">
                <p className="text-xs text-danger row gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.75}
                    stroke="currentColor"
                    width={16}
                    height={16}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                    />
                  </svg>
                  Keep your private key secure. Never share it with anyone.
                </p>
              </div>
              <p className="text-xs muted mt-2">Private key</p>
              <code className="code-block">{revealed}</code>
              <div className="mt-2 row gap-2">
                <button type="button" className="btn btn-outline btn-sm" onClick={handleCopyPrivateKey}>
                  Copy key
                </button>
                <button type="button" className="btn btn-outline btn-sm" onClick={handleToggleReveal}>
                  Hide key
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
