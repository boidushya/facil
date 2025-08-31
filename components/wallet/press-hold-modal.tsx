"use client";

import { decryptToString } from "@/lib/crypto";
import type { EncryptedPayload } from "@/lib/crypto";
import type React from "react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string | React.ReactNode;
  confirmText?: string;
  holdDuration?: number;
  encryptedPayload?: EncryptedPayload;
  requirePassword?: boolean;
};

function PressHoldModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Hold to confirm",
  holdDuration = 2000,
  encryptedPayload,
  requirePassword = false,
}: Props) {
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const requiredAndVerified = useMemo(() => requirePassword && !passwordVerified, [requirePassword, passwordVerified]);

  const clearTimers = useCallback(() => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (progressIntervalRef.current) {
      cancelAnimationFrame(progressIntervalRef.current as unknown as number);
      progressIntervalRef.current = null;
    }
  }, []);

  const resetState = useCallback(() => {
    setIsHolding(false);
    setProgress(0);
    setPassword("");
    setPasswordError(null);
    setPasswordVerified(false);
    setVerifying(false);
    clearTimers();
  }, [clearTimers]);

  const resetHoldState = useCallback(() => {
    setIsHolding(false);
    setProgress(0);
    clearTimers();
  }, [clearTimers]);

  const handleStart = useCallback(() => {
    if (requiredAndVerified) return;

    setIsHolding(true);
    startTimeRef.current = Date.now();

    holdTimeoutRef.current = setTimeout(() => {
      onConfirm();
      onClose();
      resetState();
    }, holdDuration);

    const updateProgress = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsed / holdDuration) * 100, 100);
      setProgress(newProgress);

      if (elapsed < holdDuration && holdTimeoutRef.current) {
        progressIntervalRef.current = requestAnimationFrame(updateProgress) as unknown as NodeJS.Timeout;
      }
    };

    progressIntervalRef.current = requestAnimationFrame(updateProgress) as unknown as NodeJS.Timeout;
  }, [holdDuration, onConfirm, onClose, resetState, requiredAndVerified]);

  const handleEnd = useCallback(() => {
    resetHoldState();
  }, [resetHoldState]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  const verifyPassword = useCallback(async () => {
    if (!encryptedPayload || !password.trim()) return;

    setPasswordError(null);
    setVerifying(true);
    try {
      await decryptToString(encryptedPayload, password);
      setPasswordVerified(true);
    } catch {
      setPasswordError("Invalid password");
      setPasswordVerified(false);
    } finally {
      setVerifying(false);
    }
  }, [encryptedPayload, password]);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordError(null);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen, resetState]);

  useEffect(() => {
    if (!requirePassword) {
      setPasswordVerified(true);
    }
  }, [requirePassword]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="btn btn-icon modal-close" onClick={onClose} aria-label="Close modal">
            <svg
              width="16"
              height="16"
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
        <div className="modal-body card col gap-4">
          <p className="muted">{description}</p>

          {requiredAndVerified && (
            <div className="col gap-3 password-form">
              <label htmlFor="delete-password" className="label">
                Enter password to enable deletion
              </label>
              <input
                id="delete-password"
                type="password"
                className="input"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>
          )}

          <div className="press-hold-container">
            {requiredAndVerified ? (
              <button
                className="btn btn-primary press-hold-button press-hold-verify-button"
                onClick={verifyPassword}
                disabled={!password.trim() || verifying}
                aria-label="Verify password"
              >
                <span className="press-hold-text">{verifying ? "Verifying..." : "Verify Password"}</span>
              </button>
            ) : (
              <button
                className={`press-hold-button ${isHolding ? "holding" : ""}`}
                onMouseDown={handleStart}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={handleStart}
                onTouchEnd={handleEnd}
                style={{
                  background: `linear-gradient(to right, var(--color-danger) ${progress}%, transparent ${progress}%)`,
                }}
                aria-label="Press and hold to confirm deletion"
              >
                <span className="press-hold-text">{isHolding ? "Keep holding to confirm..." : confirmText}</span>
                <div className="press-hold-progress" style={{ width: `${progress}%` }} />
              </button>
            )}
          </div>

          {passwordError && (
            <p role="alert" className="error text-sm">
              {passwordError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(PressHoldModal);
