"use client";

import type React from "react";

import { encryptString } from "@/lib/crypto";
import type { StoredWallet } from "@/lib/storage";
import { useState } from "react";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

type Props = {
  onCreated: (wallet: StoredWallet) => void;
};

export default function CreateWalletForm({ onCreated }: Props) {
  const [label, setLabel] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFormValid = password.length >= 8 && password === confirm;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const priv = generatePrivateKey();
      const account = privateKeyToAccount(priv);
      const enc = await encryptString(priv, password);

      const wallet: StoredWallet = {
        id: crypto.randomUUID(),
        address: account.address,
        enc,
        createdAt: new Date().toISOString(),
        label: label || undefined,
      };
      onCreated(wallet);
      setLabel("");
      setPassword("");
      setConfirm("");
    } catch (_err) {
      setError("Failed to create wallet. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleCreate} className="card">
      <div className="form-group">
        <label htmlFor="label" className="label">
          Label (optional)
        </label>
        <input
          id="label"
          className="input"
          placeholder="Personal, Savings, etc."
          value={label}
          onChange={e => setLabel(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="password" className="label">
          Password
        </label>
        <input
          id="password"
          type="password"
          className="input"
          placeholder="At least 8 characters"
          minLength={8}
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
        {password && password.length < 8 && (
          <p role="alert" className="error text-sm">
            Password must be at least 8 characters
          </p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="confirm" className="label">
          Confirm password
        </label>
        <input
          id="confirm"
          type="password"
          className="input"
          placeholder="Re-enter your password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
        />
        {confirm && password !== confirm && (
          <p role="alert" className="error text-sm">
            Passwords do not match
          </p>
        )}
      </div>

      {error ? (
        <p role="alert" className="error text-sm">
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={busy || !isFormValid} className="btn btn-primary">
        {busy ? "Generating…" : "Generate wallet"}
      </button>
    </form>
  );
}
