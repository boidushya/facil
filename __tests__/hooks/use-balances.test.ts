import { useBalances } from "@/hooks/use-balances";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// -- Mock SWR --
vi.mock("swr", () => ({
  default: vi.fn(),
}));

// -- Mock viem --
vi.mock("viem", () => ({
  createPublicClient: vi.fn(() => ({
    getBalance: vi.fn(),
  })),
  formatEther: vi.fn(),
  http: vi.fn(),
}));

vi.mock("viem/chains", () => ({
  sepolia: {
    id: 11155111,
    name: "Sepolia",
    rpcUrls: {
      default: { http: ["https://ethereum-sepolia.publicnode.com"] },
      public: { http: ["https://ethereum-sepolia.publicnode.com"] },
    },
  },
  bscTestnet: {
    id: 97,
    name: "BSC Testnet",
    rpcUrls: {
      default: { http: ["https://bsc-testnet.publicnode.com"] },
      public: { http: ["https://bsc-testnet.publicnode.com"] },
    },
  },
}));

const mockUseSWR = await import("swr");

describe("useBalances hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("address validation", () => {
    it("should not fetch for invalid address", () => {
      const mockSWR = vi.fn().mockReturnValue({
        data: undefined,
        isLoading: false,
        error: undefined,
        mutate: vi.fn(),
        isValidating: false,
      });
      vi.mocked(mockUseSWR.default).mockImplementation(mockSWR);

      renderHook(() => useBalances("invalid-address"));

      expect(mockSWR).toHaveBeenCalledWith(null, expect.any(Function), { revalidateOnFocus: false });
    });

    it("should not fetch for empty address", () => {
      const mockSWR = vi.fn().mockReturnValue({
        data: undefined,
        isLoading: false,
        error: undefined,
        mutate: vi.fn(),
        isValidating: false,
      });
      vi.mocked(mockUseSWR.default).mockImplementation(mockSWR);

      renderHook(() => useBalances(""));

      expect(mockSWR).toHaveBeenCalledWith(null, expect.any(Function), { revalidateOnFocus: false });
    });

    it("should fetch for valid hex address", () => {
      vi.clearAllMocks();

      const mockSWR = vi.fn().mockReturnValue({
        data: undefined,
        isLoading: false,
        error: undefined,
        mutate: vi.fn(),
        isValidating: false,
      });
      vi.mocked(mockUseSWR.default).mockImplementation(mockSWR);

      const validAddress = "0x742d35Cc6634C0532925a3b8D8f5e3E56F123456";

      renderHook(() => useBalances(validAddress));

      expect(mockSWR).toHaveBeenCalledWith(["balances", validAddress], expect.any(Function), {
        revalidateOnFocus: false,
      });
    });

    it("should validate address format correctly", () => {
      const testCases = [
        { address: "0x742d35Cc6634C0532925a3b8D8f5e3E56F123456", shouldFetch: true },
        { address: "0x742D35CC6634C0532925A3B8D8F5E3E56F123456", shouldFetch: true },
        { address: "0x742d35cc6634c0532925a3b8d8f5e3e56f123456", shouldFetch: true },
        { address: "742d35Cc6634C0532925a3b8D8f5e3E56F1234567", shouldFetch: false },
        { address: "0x742d35Cc6634C0532925a3b8D8f5e3E56F123456", shouldFetch: false },
        { address: "0xGHIJ35Cc6634C0532925a3b8D8f5e3E56F1234567", shouldFetch: false },
        { address: "", shouldFetch: false },
        { address: "0x", shouldFetch: false },
      ];

      testCases.forEach(({ address }) => {
        const mockSWR = vi.fn().mockReturnValue({
          data: undefined,
          isLoading: false,
          error: undefined,
          mutate: vi.fn(),
          isValidating: false,
        });
        vi.mocked(mockUseSWR.default).mockImplementation(mockSWR);

        renderHook(() => useBalances(address));

        const isValidHex = /^0x[a-fA-F0-9]{40}$/.test(address);

        if (isValidHex) {
          expect(mockSWR).toHaveBeenCalledWith(["balances", address], expect.any(Function), {
            revalidateOnFocus: false,
          });
        } else {
          expect(mockSWR).toHaveBeenCalledWith(null, expect.any(Function), { revalidateOnFocus: false });
        }

        vi.clearAllMocks();
      });
    });
  });

  describe("return values", () => {
    it("should return loading state", () => {
      vi.mocked(mockUseSWR.default).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: undefined,
        mutate: vi.fn(),
        isValidating: false,
      });

      const { result } = renderHook(() => useBalances("0x742d35Cc6634C0532925a3b8D8f5e3E56F123456"));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBeUndefined();
    });

    it("should return balance data", () => {
      const mockBalances = {
        sepolia: "1.5 ETH",
        bscTestnet: "0.8 BNB",
      };

      vi.mocked(mockUseSWR.default).mockReturnValue({
        data: mockBalances,
        isLoading: false,
        error: undefined,
        mutate: vi.fn(),
        isValidating: false,
      });

      const { result } = renderHook(() => useBalances("0x742d35Cc6634C0532925a3b8D8f5e3E56F123456"));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toEqual(mockBalances);
      expect(result.current.error).toBeUndefined();
    });

    it("should return error state", () => {
      const mockError = new Error("Network error");

      vi.mocked(mockUseSWR.default).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
        mutate: vi.fn(),
        isValidating: false,
      });

      const { result } = renderHook(() => useBalances("0x742d35Cc6634C0532925a3b8D8f5e3E56F123456"));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBe(mockError);
    });
  });

  describe("SWR configuration", () => {
    it("should configure SWR correctly", () => {
      vi.clearAllMocks();

      const mockSWR = vi.fn().mockReturnValue({
        data: undefined,
        isLoading: false,
        error: undefined,
        mutate: vi.fn(),
        isValidating: false,
      });
      vi.mocked(mockUseSWR.default).mockImplementation(mockSWR);

      renderHook(() => useBalances("0x742d35Cc6634C0532925a3b8D8f5e3E56F123456"));

      expect(mockSWR).toHaveBeenCalledWith(
        ["balances", "0x742d35Cc6634C0532925a3b8D8f5e3E56F123456"],
        expect.any(Function),
        { revalidateOnFocus: false }
      );
    });

    it("should not revalidate on focus", () => {
      const mockSWR = vi.fn().mockReturnValue({
        data: undefined,
        isLoading: false,
        error: undefined,
        mutate: vi.fn(),
        isValidating: false,
      });
      vi.mocked(mockUseSWR.default).mockImplementation(mockSWR);

      renderHook(() => useBalances("0x742d35Cc6634C0532925a3b8D8f5e3E56F1234567"));

      const [, , options] = mockSWR.mock.calls[0];
      expect(options.revalidateOnFocus).toBe(false);
    });
  });

  describe("hook behavior", () => {
    it("should update when address changes", () => {
      vi.clearAllMocks();

      const mockSWR = vi.fn().mockReturnValue({
        data: undefined,
        isLoading: false,
        error: undefined,
        mutate: vi.fn(),
        isValidating: false,
      });
      vi.mocked(mockUseSWR.default).mockImplementation(mockSWR);

      const address1 = "0x742d35Cc6634C0532925a3b8D8f5e3E56F123456";
      const address2 = "0xABCDEF1234567890ABCDEF1234567890ABCDEF12";

      const { rerender } = renderHook(({ addr }) => useBalances(addr), { initialProps: { addr: address1 } });

      expect(mockSWR).toHaveBeenCalledWith(["balances", address1], expect.any(Function), { revalidateOnFocus: false });

      rerender({ addr: address2 });

      expect(mockSWR).toHaveBeenLastCalledWith(["balances", address2], expect.any(Function), {
        revalidateOnFocus: false,
      });
    });

    it("should handle valid to invalid address change", () => {
      vi.clearAllMocks();

      const mockSWR = vi.fn().mockReturnValue({
        data: undefined,
        isLoading: false,
        error: undefined,
        mutate: vi.fn(),
        isValidating: false,
      });
      vi.mocked(mockUseSWR.default).mockImplementation(mockSWR);

      const validAddress = "0x742d35Cc6634C0532925a3b8D8f5e3E56F123456";
      const invalidAddress = "invalid-address";

      const { rerender } = renderHook(({ addr }) => useBalances(addr), { initialProps: { addr: validAddress } });

      expect(mockSWR).toHaveBeenCalledWith(["balances", validAddress], expect.any(Function), {
        revalidateOnFocus: false,
      });

      rerender({ addr: invalidAddress });

      expect(mockSWR).toHaveBeenLastCalledWith(null, expect.any(Function), { revalidateOnFocus: false });
    });
  });

  describe("interface consistency", () => {
    it("should return SWR response interface", () => {
      const mockResponse = {
        data: { sepolia: "1.0 ETH", bscTestnet: "2.0 BNB" },
        isLoading: false,
        error: undefined,
        mutate: vi.fn(),
        isValidating: false,
      };

      vi.mocked(mockUseSWR.default).mockReturnValue(mockResponse);

      const { result } = renderHook(() => useBalances("0x742d35Cc6634C0532925a3b8D8f5e3E56F123456"));

      expect(result.current).toEqual(mockResponse);
    });

    it("should maintain consistent keys across renders", () => {
      vi.mocked(mockUseSWR.default).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: undefined,
        mutate: vi.fn(),
        isValidating: false,
      });

      const { result, rerender } = renderHook(() => useBalances("0x742d35Cc6634C0532925a3b8D8f5e3E56F123456"));

      const initialKeys = Object.keys(result.current);

      rerender();

      const rerenderedKeys = Object.keys(result.current);
      expect(rerenderedKeys).toEqual(initialKeys);
    });
  });

});
