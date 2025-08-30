import { useWallets } from "@/hooks/use-wallets";
import type { StoredWallet } from "@/lib/storage";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// -- Mock the storage module --
vi.mock("@/lib/storage", () => ({
  getWallets: vi.fn(),
  saveWallets: vi.fn(),
}));

const { getWallets, saveWallets } = await import("@/lib/storage");

const createMockWallet = (id = "test-id"): StoredWallet => ({
  id,
  address: "0x742d35Cc6634C0532925a3b8D8f5e3E56F1234567",
  enc: {
    ct: "mock-ciphertext",
    iv: "mock-iv",
    salt: "mock-salt",
    ver: 1,
  },
  createdAt: "2024-01-15T10:30:00.000Z",
  label: "Test Wallet",
});

describe("useWallets hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getWallets).mockReturnValue([]);
    vi.mocked(saveWallets).mockImplementation(() => {});
  });

  it("should initialize with empty wallets", () => {
    const { result } = renderHook(() => useWallets());

    expect(result.current.wallets).toEqual([]);
    expect(getWallets).toHaveBeenCalled();
  });

  it("should load existing wallets", () => {
    const existingWallets = [createMockWallet()];
    vi.mocked(getWallets).mockReturnValue(existingWallets);

    const { result } = renderHook(() => useWallets());

    expect(result.current.wallets).toEqual(existingWallets);
  });

  it("should add a wallet", () => {
    const { result } = renderHook(() => useWallets());
    const newWallet = createMockWallet();

    act(() => {
      result.current.addWallet(newWallet);
    });

    expect(result.current.wallets).toEqual([newWallet]);
    expect(saveWallets).toHaveBeenCalledWith([newWallet]);
  });

  it("should remove a wallet", () => {
    const wallet = createMockWallet();
    vi.mocked(getWallets).mockReturnValue([wallet]);

    const { result } = renderHook(() => useWallets());

    act(() => {
      result.current.removeWallet(wallet.id);
    });

    expect(result.current.wallets).toEqual([]);
    expect(saveWallets).toHaveBeenCalledWith([]);
  });

  it("should add multiple wallets in reverse order", () => {
    const { result } = renderHook(() => useWallets());
    const wallet1 = createMockWallet("wallet-1");
    const wallet2 = createMockWallet("wallet-2");

    act(() => {
      result.current.addWallet(wallet1);
    });

    act(() => {
      result.current.addWallet(wallet2);
    });

    expect(result.current.wallets).toEqual([wallet2, wallet1]);
  });

  it("should return the correct interface", () => {
    const { result } = renderHook(() => useWallets());

    expect(result.current).toHaveProperty("wallets");
    expect(result.current).toHaveProperty("addWallet");
    expect(result.current).toHaveProperty("removeWallet");

    expect(Array.isArray(result.current.wallets)).toBe(true);
    expect(typeof result.current.addWallet).toBe("function");
    expect(typeof result.current.removeWallet).toBe("function");
  });
});
