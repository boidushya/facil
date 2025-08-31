"use client";

import type React from "react";

import { useToast } from "@/components/toast";
import PressHoldModal from "@/components/wallet/press-hold-modal";
import { useBalances } from "@/hooks/use-balances";
import { decryptToString } from "@/lib/crypto";
import type { StoredWallet } from "@/lib/storage";
import { formatRelativeTime, shortenAddress } from "@/lib/utils";
import { useCallback, useState } from "react";

type Props = {
  wallets: StoredWallet[];
  onRemove: (id: string) => void;
  isLoading?: boolean;
};

function WalletItem({ w, onRemove }: { w: StoredWallet; onRemove: (id: string) => void }) {
  const { data, isLoading, error } = useBalances(w.address);
  const { addToast } = useToast();

  const [showReveal, setShowReveal] = useState(false);
  const [password, setPassword] = useState("");
  const [revealed, setRevealed] = useState<string | null>(null);
  const [revealError, setRevealError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleCopyAddress = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(w.address);
      addToast("Address copied!", "success");
    } catch {
      addToast("Failed to copy", "error");
    }
  }, [w.address, addToast]);

  const handleCopyPrivateKey = useCallback(async () => {
    if (!revealed) return;
    try {
      await navigator.clipboard.writeText(revealed);
      addToast("Private key copied!", "success");
    } catch {
      addToast("Failed to copy", "error");
    }
  }, [revealed, addToast]);

  const handleToggleReveal = useCallback(() => {
    setShowReveal(s => !s);
    if (showReveal) {
      // Hide the form - reset states
      setPassword("");
      setRevealed(null);
      setRevealError(null);
    }
  }, [showReveal]);

  const handleDeleteWallet = useCallback(() => {
    onRemove(w.id);
    setShowDeleteModal(false);
    addToast("Wallet removed", "success");
  }, [w.id, onRemove, addToast]);

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
            {w.label ? (
              <>
                {w.label}
                <span className="muted-low">・</span>
              </>
            ) : (
              ""
            )}
            <span className="muted mono text-xs">{shortenAddress(w.address)}</span>
          </p>
          <p className="text-xs muted-high">Created {formatRelativeTime(w.createdAt)}</p>
        </div>
        <div className="row gap-2">
          <button
            className="row gap-1 btn btn-outline btn-sm"
            onClick={handleCopyAddress}
            aria-label="Copy wallet address"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              width={14}
              height={14}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75"
              />
            </svg>
            Copy address
          </button>
          <button
            className="btn btn-outline btn-sm row gap-1"
            onClick={handleToggleReveal}
            aria-expanded={showReveal}
            aria-label={showReveal ? "Hide private key form" : "Show private key form"}
          >
            {showReveal ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  width={14}
                  height={14}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                  />
                </svg>
                Hide key
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  width={14}
                  height={14}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
                Reveal key
              </>
            )}
          </button>
          <button
            className="btn btn-danger btn-sm row gap-1"
            onClick={() => setShowDeleteModal(true)}
            aria-label="Remove wallet"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              width={14}
              height={14}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
              />
            </svg>
            Remove
          </button>
        </div>
      </div>

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
                <button type="button" className="row gap-1 btn btn-outline btn-sm" onClick={handleCopyPrivateKey}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    width={14}
                    height={14}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75"
                    />
                  </svg>
                  Copy key
                </button>
                <button type="button" className="row gap-1 btn btn-outline btn-sm" onClick={handleToggleReveal}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    width={14}
                    height={14}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                  Hide key
                </button>
              </div>
            </div>
          ) : null}
        </form>
      )}

      <PressHoldModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteWallet}
        title="Remove wallet"
        description={`Are you sure you want to remove the wallet "${w.label || shortenAddress(w.address)}"? This action cannot be undone.`}
        confirmText="Hold to delete"
        holdDuration={1500}
      />
    </li>
  );
}

export default function WalletList({ wallets, onRemove, isLoading = false }: Props) {
  if (isLoading) {
    return (
      <div className="tetrominos" role="loader">
        <div className="tetromino box1"></div>
        <div className="tetromino box2"></div>
        <div className="tetromino box3"></div>
        <div className="tetromino box4"></div>
      </div>
    );
  }

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
