import CreateWalletForm from "@/components/wallet/create-wallet-form";
import type { StoredWallet } from "@/lib/storage";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// -- Mock dependencies --
vi.mock("@/lib/crypto", () => ({
  encryptString: vi.fn(),
}));

vi.mock("viem/accounts", () => ({
  generatePrivateKey: vi.fn(),
  privateKeyToAccount: vi.fn(),
}));

const { encryptString } = await import("@/lib/crypto");
const { generatePrivateKey, privateKeyToAccount } = await import("viem/accounts");

Object.defineProperty(global, "crypto", {
  value: { randomUUID: () => "test-uuid-123" },
  writable: true,
});

describe("CreateWalletForm", () => {
  const mockOnCreated = vi.fn();
  const mockOnClose = vi.fn();
  const mockPrivateKey = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
  const mockAccount = {
    address: "0x742d35Cc6634C0532925a3b8D8f5e3E56F1234567" as const,
    publicKey: "0x123" as const,
    sign: vi.fn(),
    signAuthorization: vi.fn(),
    signMessage: vi.fn(),
    signTransaction: vi.fn(),
    signTypedData: vi.fn(),
    source: "privateKey" as const,
    type: "local" as const,
  };
  const mockEncryptedPayload = {
    ct: "mock-ciphertext",
    iv: "mock-iv",
    salt: "mock-salt",
    ver: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnClose.mockClear();
    vi.mocked(generatePrivateKey).mockReturnValue(mockPrivateKey);
    vi.mocked(privateKeyToAccount).mockReturnValue(mockAccount);
    vi.mocked(encryptString).mockResolvedValue(mockEncryptedPayload);
  });

  it("should render form fields", () => {
    render(<CreateWalletForm isOpen={true} onClose={mockOnClose} onCreated={mockOnCreated} />);

    expect(screen.getByLabelText(/label.*optional/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /generate wallet/i })).toBeInTheDocument();
  });

  it("should validate password length", () => {
    render(<CreateWalletForm isOpen={true} onClose={mockOnClose} onCreated={mockOnCreated} />);

    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "short" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "short" } });
    fireEvent.click(screen.getByRole("button", { name: /generate wallet/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/password must be at least 8 characters/i);
    expect(mockOnCreated).not.toHaveBeenCalled();
  });

  it("should validate password match", () => {
    render(<CreateWalletForm isOpen={true} onClose={mockOnClose} onCreated={mockOnCreated} />);

    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "different123" } });
    fireEvent.click(screen.getByRole("button", { name: /generate wallet/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/passwords do not match/i);
    expect(mockOnCreated).not.toHaveBeenCalled();
  });

  it("should create wallet with valid input", async () => {
    render(<CreateWalletForm isOpen={true} onClose={mockOnClose} onCreated={mockOnCreated} />);

    fireEvent.change(screen.getByLabelText(/label.*optional/i), { target: { value: "Test Wallet" } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /generate wallet/i }));

    await waitFor(() => {
      expect(mockOnCreated).toHaveBeenCalled();
    });

    const createdWallet: StoredWallet = mockOnCreated.mock.calls[0][0];
    expect(createdWallet.id).toBe("test-uuid-123");
    expect(createdWallet.address).toBe(mockAccount.address);
    expect(createdWallet.label).toBe("Test Wallet");
    expect(createdWallet.enc).toEqual(mockEncryptedPayload);

    expect(generatePrivateKey).toHaveBeenCalled();
    expect(privateKeyToAccount).toHaveBeenCalledWith(mockPrivateKey);
    expect(encryptString).toHaveBeenCalledWith(mockPrivateKey, "password123");
  });

  it("should create wallet without label", async () => {
    render(<CreateWalletForm isOpen={true} onClose={mockOnClose} onCreated={mockOnCreated} />);

    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /generate wallet/i }));

    await waitFor(() => {
      expect(mockOnCreated).toHaveBeenCalled();
    });

    const createdWallet: StoredWallet = mockOnCreated.mock.calls[0][0];
    expect(createdWallet.label).toBeUndefined();
  });

  it("should handle encryption errors", async () => {
    vi.mocked(encryptString).mockRejectedValue(new Error("Encryption failed"));

    render(<CreateWalletForm isOpen={true} onClose={mockOnClose} onCreated={mockOnCreated} />);

    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /generate wallet/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/failed to create wallet/i);
    });

    expect(mockOnCreated).not.toHaveBeenCalled();
  });
});
