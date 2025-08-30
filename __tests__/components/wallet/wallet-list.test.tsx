import WalletList from "@/components/wallet/wallet-list";
import type { EncryptedPayload } from "@/lib/crypto";
import type { StoredWallet } from "@/lib/storage";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// -- Mock dependencies --
vi.mock("@/hooks/use-balances", () => ({
  useBalances: vi.fn(),
}));

vi.mock("@/lib/crypto", () => ({
  decryptToString: vi.fn(),
}));

vi.mock("@/lib/utils", () => ({
  shortenAddress: vi.fn((addr: string) => `${addr.slice(0, 6)}…${addr.slice(-4)}`),
}));

// -- Mock navigator.clipboard --
Object.defineProperty(navigator, "clipboard", {
  value: {
    writeText: vi.fn(),
  },
  writable: true,
});

const { useBalances } = await import("@/hooks/use-balances");
const { decryptToString } = await import("@/lib/crypto");

const createMockWallet = (overrides: Partial<StoredWallet> = {}): StoredWallet => ({
  id: "test-id-123",
  address: "0x742d35Cc6634C0532925a3b8D8f5e3E56F123456" as const,
  enc: {
    ct: "mock-ciphertext",
    iv: "mock-iv",
    salt: "mock-salt",
    ver: 1,
  } as EncryptedPayload,
  createdAt: "2024-01-15T10:30:00.000Z",
  label: "Test Wallet",
  ...overrides,
});

describe("WalletList", () => {
  const mockOnRemove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useBalances).mockReturnValue({
      data: {
        sepolia: "1.5 ETH",
        bscTestnet: "0.8 BNB",
      },
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
      isValidating: false,
    });

    vi.mocked(decryptToString).mockResolvedValue("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
    vi.mocked(navigator.clipboard.writeText).mockResolvedValue();
  });

  describe("empty state", () => {
    it("should show placeholder message when no wallets", () => {
      render(<WalletList wallets={[]} onRemove={mockOnRemove} />);

      expect(screen.getByText(/no wallets yet/i)).toBeInTheDocument();
      expect(screen.getByText(/create one above to get started/i)).toBeInTheDocument();
    });

    it("should not render list when empty", () => {
      render(<WalletList wallets={[]} onRemove={mockOnRemove} />);

      expect(screen.queryByRole("list")).not.toBeInTheDocument();
    });
  });

  describe("wallet list rendering", () => {
    it("should render single wallet", () => {
      const wallet = createMockWallet();
      render(<WalletList wallets={[wallet]} onRemove={mockOnRemove} />);

      expect(screen.getByRole("list")).toBeInTheDocument();
      expect(screen.getByRole("listitem")).toBeInTheDocument();
      expect(screen.getByText(/test wallet/i)).toBeInTheDocument();
    });

    it("should render multiple wallets", () => {
      const wallets = [
        createMockWallet({
          id: "wallet-1",
          label: "First Wallet",
          address: "0x1111111111111111111111111111111111111111" as const,
        }),
        createMockWallet({
          id: "wallet-2",
          label: "Second Wallet",
          address: "0x2222222222222222222222222222222222222222" as const,
        }),
      ];

      render(<WalletList wallets={wallets} onRemove={mockOnRemove} />);

      expect(screen.getByRole("list")).toBeInTheDocument();
      expect(screen.getAllByRole("listitem")).toHaveLength(2);
      expect(screen.getByText(/first wallet/i)).toBeInTheDocument();
      expect(screen.getByText(/second wallet/i)).toBeInTheDocument();
    });

    it("should render wallet without label", () => {
      const wallet = createMockWallet({ label: undefined });
      render(<WalletList wallets={[wallet]} onRemove={mockOnRemove} />);

      expect(screen.getByText(/0x742d…3456/)).toBeInTheDocument();
      expect(screen.queryByText("Test Wallet")).not.toBeInTheDocument();
    });

    it("should render creation date", () => {
      const wallet = createMockWallet();
      render(<WalletList wallets={[wallet]} onRemove={mockOnRemove} />);

      expect(screen.getByText(/created/i)).toBeInTheDocument();
    });
  });

  describe("wallet actions", () => {
    it("should render action buttons", () => {
      const wallet = createMockWallet();
      render(<WalletList wallets={[wallet]} onRemove={mockOnRemove} />);

      expect(screen.getByRole("button", { name: /copy address/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /reveal key/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /remove/i })).toBeInTheDocument();
    });

    it("should call onRemove when remove button clicked", () => {
      const wallet = createMockWallet();
      render(<WalletList wallets={[wallet]} onRemove={mockOnRemove} />);

      fireEvent.click(screen.getByRole("button", { name: /remove/i }));

      expect(mockOnRemove).toHaveBeenCalledWith(wallet.id);
    });

    it("should copy address to clipboard", () => {
      const wallet = createMockWallet();
      render(<WalletList wallets={[wallet]} onRemove={mockOnRemove} />);

      fireEvent.click(screen.getByRole("button", { name: /copy address/i }));

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(wallet.address);
    });

    it("should toggle reveal key form", () => {
      const wallet = createMockWallet();
      render(<WalletList wallets={[wallet]} onRemove={mockOnRemove} />);

      expect(screen.queryByText(/enter password to reveal/i)).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /reveal key/i }));

      expect(screen.getByText(/enter password to reveal/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /hide/i })).toBeInTheDocument();
    });
  });

  describe("balance display", () => {
    it("should show loading state", () => {
      vi.mocked(useBalances).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: undefined,
        mutate: vi.fn(),
        isValidating: false,
      });

      const wallet = createMockWallet();
      render(<WalletList wallets={[wallet]} onRemove={mockOnRemove} />);

      expect(screen.getAllByText(/loading…/i)).toHaveLength(2);
    });

    it("should show error state", () => {
      vi.mocked(useBalances).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Network error"),
        mutate: vi.fn(),
        isValidating: false,
      });

      const wallet = createMockWallet();
      render(<WalletList wallets={[wallet]} onRemove={mockOnRemove} />);

      expect(screen.getAllByText("—")).toHaveLength(2);
    });

    it("should show balance data", () => {
      const wallet = createMockWallet();
      render(<WalletList wallets={[wallet]} onRemove={mockOnRemove} />);

      expect(screen.getByText("1.5 ETH")).toBeInTheDocument();
      expect(screen.getByText("0.8 BNB")).toBeInTheDocument();
      expect(screen.getByText("Sepolia ETH")).toBeInTheDocument();
      expect(screen.getByText("BSC Testnet BNB")).toBeInTheDocument();
    });

    it("should call useBalances with wallet address", () => {
      const wallet = createMockWallet();
      render(<WalletList wallets={[wallet]} onRemove={mockOnRemove} />);

      expect(useBalances).toHaveBeenCalledWith(wallet.address);
    });
  });

  describe("private key revelation", () => {
    it("should show password form when reveal clicked", () => {
      const wallet = createMockWallet();
      render(<WalletList wallets={[wallet]} onRemove={mockOnRemove} />);

      fireEvent.click(screen.getByRole("button", { name: /reveal key/i }));

      expect(screen.getByLabelText(/enter password to reveal/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^reveal$/i })).toBeInTheDocument();
    });

    it("should reveal private key with correct password", async () => {
      const wallet = createMockWallet();
      const mockPrivateKey = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

      vi.mocked(decryptToString).mockResolvedValue(mockPrivateKey);

      render(<WalletList wallets={[wallet]} onRemove={mockOnRemove} />);

      fireEvent.click(screen.getByRole("button", { name: /reveal key/i }));
      fireEvent.change(screen.getByLabelText(/enter password to reveal/i), { target: { value: "password123" } });
      fireEvent.click(screen.getByRole("button", { name: /^reveal$/i }));

      await waitFor(() => {
        expect(screen.getByText(mockPrivateKey)).toBeInTheDocument();
      });

      expect(decryptToString).toHaveBeenCalledWith(wallet.enc, "password123");
      expect(screen.getAllByText(/private key/i)).toHaveLength(2); // Label and header
      expect(screen.getByRole("button", { name: /copy key/i })).toBeInTheDocument();
    });

    it("should show error with wrong password", async () => {
      const wallet = createMockWallet();

      vi.mocked(decryptToString).mockRejectedValue(new Error("Decryption failed"));

      render(<WalletList wallets={[wallet]} onRemove={mockOnRemove} />);

      fireEvent.click(screen.getByRole("button", { name: /reveal key/i }));
      fireEvent.change(screen.getByLabelText(/enter password to reveal/i), { target: { value: "wrongpassword" } });
      fireEvent.click(screen.getByRole("button", { name: /^reveal$/i }));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(/invalid password or corrupted data/i);
      });

      expect(decryptToString).toHaveBeenCalledWith(wallet.enc, "wrongpassword");
    });

    it("should copy private key to clipboard", async () => {
      const wallet = createMockWallet();
      const mockPrivateKey = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

      vi.mocked(decryptToString).mockResolvedValue(mockPrivateKey);

      render(<WalletList wallets={[wallet]} onRemove={mockOnRemove} />);

      fireEvent.click(screen.getByRole("button", { name: /reveal key/i }));
      fireEvent.change(screen.getByLabelText(/enter password to reveal/i), { target: { value: "password123" } });
      fireEvent.click(screen.getByRole("button", { name: /^reveal$/i }));

      await waitFor(() => {
        expect(screen.getByText(mockPrivateKey)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /copy key/i }));

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockPrivateKey);
    });

    it("should handle multiple wallets independently", () => {
      const wallets = [
        createMockWallet({
          id: "wallet-1",
          label: "First",
          address: "0x1111111111111111111111111111111111111111" as const,
        }),
        createMockWallet({
          id: "wallet-2",
          label: "Second",
          address: "0x2222222222222222222222222222222222222222" as const,
        }),
      ];

      render(<WalletList wallets={wallets} onRemove={mockOnRemove} />);

      const revealButtons = screen.getAllByRole("button", { name: /reveal key/i });
      expect(revealButtons).toHaveLength(2);

      fireEvent.click(revealButtons[0]);

      expect(screen.getAllByLabelText(/enter password to reveal/i)).toHaveLength(1);

      fireEvent.click(revealButtons[1]);

      expect(screen.getAllByLabelText(/enter password to reveal/i)).toHaveLength(2);
    });
  });
});
