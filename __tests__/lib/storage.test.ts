import { type StoredWallet, getWallets, saveWallets } from "@/lib/storage";
import { beforeEach, describe, expect, it, vi } from "vitest";

// -- Mock localStorage --
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

const createMockWallet = (): StoredWallet => ({
  id: "test-id-123",
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

describe("storage utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getWallets", () => {
    it("should return empty array when localStorage is empty", () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = getWallets();

      expect(result).toEqual([]);
      expect(localStorageMock.getItem).toHaveBeenCalledWith("facil:wallets");
    });

    it("should return wallets from localStorage", () => {
      const mockWallets = [createMockWallet()];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockWallets));

      const result = getWallets();

      expect(result).toEqual(mockWallets);
    });

    it("should return empty array on JSON parse error", () => {
      localStorageMock.getItem.mockReturnValue("invalid json");

      const result = getWallets();

      expect(result).toEqual([]);
    });

    it("should handle SSR environment", () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      const result = getWallets();

      expect(result).toEqual([]);

      global.window = originalWindow;
    });

    it("should filter out invalid wallets", () => {
      const validWallet = createMockWallet();
      const invalidWallets = [validWallet, { invalid: "wallet" }, null, undefined];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(invalidWallets));

      const result = getWallets();

      expect(result).toEqual([validWallet]);
    });

    it("should return empty array when parsed data is not an array", () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify({ notArray: "object" }));

      const result = getWallets();

      expect(result).toEqual([]);
    });
  });

  describe("saveWallets", () => {
    it("should save wallets to localStorage", () => {
      const mockWallets = [createMockWallet()];

      saveWallets(mockWallets);

      expect(localStorageMock.setItem).toHaveBeenCalledWith("facil:wallets", JSON.stringify(mockWallets));
    });

    it("should save empty array", () => {
      saveWallets([]);

      expect(localStorageMock.setItem).toHaveBeenCalledWith("facil:wallets", JSON.stringify([]));
    });

    it("should handle SSR environment", () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      const mockWallets = [createMockWallet()];
      saveWallets(mockWallets);

      expect(localStorageMock.setItem).not.toHaveBeenCalled();

      global.window = originalWindow;
    });

    it("should handle localStorage errors", () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("localStorage quota exceeded");
      });

      const mockWallets = [createMockWallet()];

      expect(() => saveWallets(mockWallets)).toThrow();
    });
  });
});
