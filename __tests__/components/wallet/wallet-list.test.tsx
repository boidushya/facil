import { ToastProvider } from "@/components/toast";
import WalletList from "@/components/wallet/wallet-list";
import type { EncryptedPayload } from "@/lib/crypto";
import type { StoredWallet } from "@/lib/storage";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
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
  formatRelativeTime: vi.fn((_date: Date | string) => "2d ago"),
  generateAvatarColor: vi.fn((address: string) => `hsl(${address.slice(-2)}, 50%, 60%)`),
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

const renderWithToast = (ui: React.ReactElement) => {
  return render(<ToastProvider>{ui}</ToastProvider>);
};

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
      renderWithToast(<WalletList wallets={[]} onRemove={mockOnRemove} />);

      expect(screen.getByText(/no wallets yet/i)).toBeInTheDocument();
      expect(screen.getByText(/create one above to get started/i)).toBeInTheDocument();
    });

    it("should not render list when empty", () => {
      renderWithToast(<WalletList wallets={[]} onRemove={mockOnRemove} />);

      expect(screen.queryByRole("list")).not.toBeInTheDocument();
    });

    it("should show loader when isLoading is true", () => {
      renderWithToast(<WalletList wallets={[]} onRemove={mockOnRemove} isLoading={true} />);

      expect(screen.getByRole("loader")).toBeInTheDocument();
      expect(screen.queryByText(/no wallets yet/i)).not.toBeInTheDocument();
    });
  });

  describe("wallet list rendering", () => {
    it("should render single wallet", () => {
      const wallet = createMockWallet();
      renderWithToast(<WalletList wallets={[wallet]} onRemove={mockOnRemove} />);

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

      renderWithToast(<WalletList wallets={wallets} onRemove={mockOnRemove} />);

      expect(screen.getByRole("list")).toBeInTheDocument();
      expect(screen.getAllByRole("listitem")).toHaveLength(2);
      expect(screen.getByText(/first wallet/i)).toBeInTheDocument();
      expect(screen.getByText(/second wallet/i)).toBeInTheDocument();
    });

    it("should render wallet without label", () => {
      const wallet = createMockWallet({ label: undefined });
      renderWithToast(<WalletList wallets={[wallet]} onRemove={mockOnRemove} />);

      expect(screen.getByText(/0x742d…3456/)).toBeInTheDocument();
      expect(screen.queryByText("Test Wallet")).not.toBeInTheDocument();
    });

    it("should render creation date", () => {
      const wallet = createMockWallet();
      renderWithToast(<WalletList wallets={[wallet]} onRemove={mockOnRemove} />);

      expect(screen.getByText(/created/i)).toBeInTheDocument();
    });
  });

  describe("wallet actions", () => {
    it("should render action buttons", () => {
      const wallet = createMockWallet();
      renderWithToast(<WalletList wallets={[wallet]} onRemove={mockOnRemove} />);

      expect(screen.getByRole("button", { name: /copy.*address/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /show.*private.*key.*form/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /remove.*wallet/i })).toBeInTheDocument();
    });

    it("should open confirmation modal with password verification when remove button clicked", () => {
      const wallet = createMockWallet();
      renderWithToast(<WalletList wallets={[wallet]} onRemove={mockOnRemove} />);

      fireEvent.click(screen.getByRole("button", { name: /remove.*wallet/i }));

      expect(screen.getByText("Remove wallet")).toBeInTheDocument();
      expect(screen.getByText(/are you sure you want to remove/i)).toBeInTheDocument();
      expect(screen.getByText("Enter password to enable deletion")).toBeInTheDocument();
      expect(screen.getByText("Verify Password")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /verify/i })).toBeInTheDocument();
      expect(mockOnRemove).not.toHaveBeenCalled();
    });

    it("should copy address to clipboard", () => {
      const wallet = createMockWallet();
      renderWithToast(<WalletList wallets={[wallet]} onRemove={mockOnRemove} />);

      fireEvent.click(screen.getByRole("button", { name: /copy.*address/i }));

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(wallet.address);
    });

    it("should toggle reveal key form", () => {
      const wallet = createMockWallet();
      renderWithToast(<WalletList wallets={[wallet]} onRemove={mockOnRemove} />);

      expect(screen.queryByText(/enter password to reveal/i)).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /show.*private.*key.*form/i }));

      expect(screen.getByText(/enter password to reveal/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /hide.*private.*key.*form/i })).toBeInTheDocument();
    });

    it("should close modal when close button clicked", () => {
      const wallet = createMockWallet();
      renderWithToast(<WalletList wallets={[wallet]} onRemove={mockOnRemove} />);

      fireEvent.click(screen.getByRole("button", { name: /remove.*wallet/i }));
      expect(screen.getByText("Remove wallet")).toBeInTheDocument();

      fireEvent.click(screen.getByLabelText("Close modal"));
      expect(screen.queryByText("Remove wallet")).not.toBeInTheDocument();
    });

    it("should close modal when overlay clicked", () => {
      const wallet = createMockWallet();
      renderWithToast(<WalletList wallets={[wallet]} onRemove={mockOnRemove} />);

      fireEvent.click(screen.getByRole("button", { name: /remove.*wallet/i }));
      expect(screen.getByText("Remove wallet")).toBeInTheDocument();

      const overlay = document.querySelector(".modal-overlay");
      fireEvent.click(overlay!);
      expect(screen.queryByText("Remove wallet")).not.toBeInTheDocument();
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
      renderWithToast(<WalletList wallets={[wallet]} onRemove={mockOnRemove} />);

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
      renderWithToast(<WalletList wallets={[wallet]} onRemove={mockOnRemove} />);

      expect(screen.getAllByText(/failed to load/i)).toHaveLength(2);
    });

    it("should show balance data", () => {
      const wallet = createMockWallet();
      renderWithToast(<WalletList wallets={[wallet]} onRemove={mockOnRemove} />);

      expect(screen.getByText("1.5 ETH")).toBeInTheDocument();
      expect(screen.getByText("0.8 BNB")).toBeInTheDocument();
      expect(screen.getByText("Sepolia ETH")).toBeInTheDocument();
      expect(screen.getByText("BSC Testnet BNB")).toBeInTheDocument();
    });

    it("should call useBalances with wallet address", () => {
      const wallet = createMockWallet();
      renderWithToast(<WalletList wallets={[wallet]} onRemove={mockOnRemove} />);

      expect(useBalances).toHaveBeenCalledWith(wallet.address);
    });
  });

  describe("private key revelation", () => {
    it("should show password form when reveal clicked", () => {
      const wallet = createMockWallet();
      renderWithToast(<WalletList wallets={[wallet]} onRemove={mockOnRemove} />);

      fireEvent.click(screen.getByRole("button", { name: /show.*private.*key.*form/i }));

      expect(screen.getByLabelText(/enter password to reveal/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^reveal$/i })).toBeInTheDocument();
    });

    it("should reveal private key with correct password", async () => {
      const wallet = createMockWallet();
      const mockPrivateKey = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

      vi.mocked(decryptToString).mockResolvedValue(mockPrivateKey);

      renderWithToast(<WalletList wallets={[wallet]} onRemove={mockOnRemove} />);

      fireEvent.click(screen.getByRole("button", { name: /show.*private.*key.*form/i }));
      fireEvent.change(screen.getByLabelText(/enter password to reveal/i), { target: { value: "password123" } });
      fireEvent.click(screen.getByRole("button", { name: /^reveal$/i }));

      await waitFor(() => {
        expect(screen.getByText(mockPrivateKey)).toBeInTheDocument();
      });

      expect(decryptToString).toHaveBeenCalledWith(wallet.enc, "password123");
      expect(screen.getAllByText(/private key/i)).toHaveLength(2);
      expect(screen.getByRole("button", { name: /copy key/i })).toBeInTheDocument();
    });

    it("should show error with wrong password", async () => {
      const wallet = createMockWallet();

      vi.mocked(decryptToString).mockRejectedValue(new Error("Decryption failed"));

      renderWithToast(<WalletList wallets={[wallet]} onRemove={mockOnRemove} />);

      fireEvent.click(screen.getByRole("button", { name: /show.*private.*key.*form/i }));
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

      renderWithToast(<WalletList wallets={[wallet]} onRemove={mockOnRemove} />);

      fireEvent.click(screen.getByRole("button", { name: /show.*private.*key.*form/i }));
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

      renderWithToast(<WalletList wallets={wallets} onRemove={mockOnRemove} />);

      const revealButtons = screen.getAllByRole("button", { name: /show.*private.*key.*form/i });
      expect(revealButtons).toHaveLength(2);

      fireEvent.click(revealButtons[0]);

      expect(screen.getAllByLabelText(/enter password to reveal/i)).toHaveLength(1);

      fireEvent.click(revealButtons[1]);

      expect(screen.getAllByLabelText(/enter password to reveal/i)).toHaveLength(2);
    });
  });

  describe("wallet deletion with password verification", () => {
    it("should require password verification before allowing hold-to-delete", () => {
      const wallet = createMockWallet();
      renderWithToast(<WalletList wallets={[wallet]} onRemove={mockOnRemove} />);

      fireEvent.click(screen.getByRole("button", { name: /remove.*wallet/i }));

      expect(screen.getByText("Verify Password")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /press and hold to confirm deletion/i })).not.toBeInTheDocument();
      const verifyButton = screen.getByRole("button", { name: /verify/i });
      expect(verifyButton).toBeDisabled();
    });

    it("should show error for invalid password", async () => {
      vi.mocked(decryptToString).mockRejectedValue(new Error("Decryption failed"));

      const wallet = createMockWallet();
      renderWithToast(<WalletList wallets={[wallet]} onRemove={mockOnRemove} />);

      fireEvent.click(screen.getByRole("button", { name: /remove.*wallet/i }));
      fireEvent.change(screen.getByLabelText(/enter password to enable deletion/i), {
        target: { value: "wrongpassword" },
      });
      fireEvent.click(screen.getByRole("button", { name: /verify/i }));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(/invalid password/i);
      });

      expect(screen.queryByRole("button", { name: /press and hold to confirm deletion/i })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /verify/i })).toBeInTheDocument();
    });

    it("should enable hold-to-delete after successful password verification", async () => {
      vi.mocked(decryptToString).mockResolvedValue("mock-private-key");

      const wallet = createMockWallet();
      renderWithToast(<WalletList wallets={[wallet]} onRemove={mockOnRemove} />);

      fireEvent.click(screen.getByRole("button", { name: /remove.*wallet/i }));
      fireEvent.change(screen.getByLabelText(/enter password to enable deletion/i), {
        target: { value: "correctpassword" },
      });
      fireEvent.click(screen.getByRole("button", { name: /verify/i }));

      await waitFor(() => {
        const holdButton = screen.getByRole("button", { name: /press and hold to confirm deletion/i });
        expect(holdButton).toBeInTheDocument();
        expect(screen.getByText("Hold to delete")).toBeInTheDocument();
      });

      expect(decryptToString).toHaveBeenCalledWith(wallet.enc, "correctpassword");
    });

    it("should hide password form after successful verification", async () => {
      vi.mocked(decryptToString).mockResolvedValue("mock-private-key");

      const wallet = createMockWallet();
      renderWithToast(<WalletList wallets={[wallet]} onRemove={mockOnRemove} />);

      fireEvent.click(screen.getByRole("button", { name: /remove.*wallet/i }));

      expect(screen.getByLabelText(/enter password to enable deletion/i)).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText(/enter password to enable deletion/i), {
        target: { value: "correctpassword" },
      });
      fireEvent.click(screen.getByRole("button", { name: /verify/i }));

      await waitFor(() => {
        expect(screen.queryByLabelText(/enter password to enable deletion/i)).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /verify/i })).not.toBeInTheDocument();
      });
    });

    it("should verify button be disabled when password is empty", () => {
      const wallet = createMockWallet();
      renderWithToast(<WalletList wallets={[wallet]} onRemove={mockOnRemove} />);

      fireEvent.click(screen.getByRole("button", { name: /remove.*wallet/i }));

      const verifyButton = screen.getByRole("button", { name: /verify/i });
      expect(verifyButton).toBeDisabled();

      fireEvent.change(screen.getByLabelText(/enter password to enable deletion/i), { target: { value: "test" } });
      expect(verifyButton).not.toBeDisabled();

      fireEvent.change(screen.getByLabelText(/enter password to enable deletion/i), { target: { value: "" } });
      expect(verifyButton).toBeDisabled();
    });
  });
});
