"use client";

import CreateWalletForm from "@/components/wallet/create-wallet-form";
import WalletList from "@/components/wallet/wallet-list";
import { useWallets } from "@/hooks/use-wallets";
import { useState } from "react";

export default function Page() {
  const { wallets, addWallet, removeWallet, isLoading } = useWallets();
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <main className="container">
      <header className="page-header">
        <h1 className="title">
          <svg xmlns="http://www.w3.org/2000/svg" width="1.25em" height="1.25em" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              fillOpacity=".25"
              d="M3 10c0-2.828 0-4.243.879-5.121C4.757 4 6.172 4 9 4h6c2.828 0 4.243 0 5.121.879C21 5.757 21 7.172 21 10v1.7c0 .141 0 .212-.044.256S20.841 12 20.7 12h-4.2c-.465 0-.697 0-.89.038a2 2 0 0 0-1.572 1.572c-.038.193-.038.425-.038.89s0 .697.038.89a2 2 0 0 0 1.572 1.572c.193.038.425.038.89.038h4.357c.079 0 .143.064.143.143A2.857 2.857 0 0 1 18.143 20H9c-2.828 0-4.243 0-5.121-.879C3 18.243 3 16.828 3 14z"
            />
            <path
              fill="currentColor"
              d="M14 14a2 2 0 0 1 2-2h4.85a.15.15 0 0 1 .15.15v4.7a.15.15 0 0 1-.15.15H16a2 2 0 0 1-2-2z"
            />
            <rect width="6" height="1" x="6" y="7" fill="currentColor" rx=".5" />
          </svg>
          <span>Fácil - Your Wallet Keeper</span>
        </h1>
        <p className="lead muted">
          Privacy-first wallet management - Generate, secure, and manage your crypto wallets with complete
          confidentiality.
        </p>
      </header>

      <section aria-labelledby="list-heading" className="section">
        <div className="section-header">
          <h2 id="list-heading" className="section-title">
            Your wallets
          </h2>
          <button
            className="btn btn-primary btn-icon"
            onClick={() => setShowCreateModal(true)}
            aria-label="Create new wallet"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
        <WalletList wallets={wallets} onRemove={removeWallet} isLoading={isLoading} />
      </section>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create a wallet</h2>
              <button
                className="btn btn-icon modal-close"
                onClick={() => setShowCreateModal(false)}
                aria-label="Close modal"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <CreateWalletForm
              onCreated={wallet => {
                addWallet(wallet);
                setShowCreateModal(false);
              }}
            />
          </div>
        </div>
      )}
    </main>
  );
}
