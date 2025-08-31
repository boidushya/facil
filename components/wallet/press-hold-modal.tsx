"use client";

import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  holdDuration?: number;
};

export default function PressHoldModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Hold to confirm",
  holdDuration = 2000,
}: Props) {
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const clearTimers = useCallback(() => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const resetState = useCallback(() => {
    setIsHolding(false);
    setProgress(0);
    clearTimers();
  }, [clearTimers]);

  const handleStart = useCallback(() => {
    setIsHolding(true);
    startTimeRef.current = Date.now();

    holdTimeoutRef.current = setTimeout(() => {
      onConfirm();
      onClose();
      resetState();
    }, holdDuration);

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsed / holdDuration) * 100, 100);
      setProgress(newProgress);
    }, 16);
  }, [holdDuration, onConfirm, onClose, resetState]);

  const handleEnd = useCallback(() => {
    resetState();
  }, [resetState]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen, resetState]);

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
          <div className="press-hold-container">
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
            {}
          </div>
        </div>
      </div>
    </div>
  );
}
