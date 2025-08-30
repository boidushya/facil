import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Page from "@/app/page";

vi.mock("@/hooks/use-wallets", () => ({
  useWallets: vi.fn(() => ({
    wallets: [],
    addWallet: vi.fn(),
    removeWallet: vi.fn(),
  })),
}));

vi.mock("@/components/wallet/create-wallet-form", () => ({
  default: vi.fn(({ onCreated }) => (
    <div data-testid="create-wallet-form">
      <button onClick={() => onCreated({ id: "test", address: "0x123" })}>Create Wallet</button>
    </div>
  )),
}));

vi.mock("@/components/wallet/wallet-list", () => ({
  default: vi.fn(({ wallets, onRemove }) => (
    <div data-testid="wallet-list">
      {wallets.length} wallets
      {wallets.map((wallet: any) => (
        <button key={wallet.id} onClick={() => onRemove(wallet.id)}>
          Remove {wallet.id}
        </button>
      ))}
    </div>
  )),
}));

describe("Page", () => {
  it("renders the main page structure", () => {
    render(<Page />);

    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByText("Fácil - Your Wallet Keeper")).toBeInTheDocument();
    expect(screen.getByText(/Generate EVM-compatible wallets/)).toBeInTheDocument();
    expect(screen.getByText("Your wallets")).toBeInTheDocument();
  });

  it("shows create wallet modal when button is clicked", () => {
    render(<Page />);

    const createButton = screen.getByLabelText("Create new wallet");
    fireEvent.click(createButton);

    expect(screen.getByText("Create a wallet")).toBeInTheDocument();
    expect(screen.getByTestId("create-wallet-form")).toBeInTheDocument();
  });

  it("closes modal when overlay is clicked", () => {
    render(<Page />);

    fireEvent.click(screen.getByLabelText("Create new wallet"));
    expect(screen.getByText("Create a wallet")).toBeInTheDocument();

    const overlay = document.querySelector(".modal-overlay");
    fireEvent.click(overlay!);

    expect(screen.queryByText("Create a wallet")).not.toBeInTheDocument();
  });

  it("closes modal when close button is clicked", () => {
    render(<Page />);

    fireEvent.click(screen.getByLabelText("Create new wallet"));
    expect(screen.getByText("Create a wallet")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Close modal"));

    expect(screen.queryByText("Create a wallet")).not.toBeInTheDocument();
  });

  it("does not close modal when modal content is clicked", () => {
    render(<Page />);

    fireEvent.click(screen.getByLabelText("Create new wallet"));

    const modalContent = document.querySelector(".modal-content");
    fireEvent.click(modalContent!);

    expect(screen.getByText("Create a wallet")).toBeInTheDocument();
  });

  it("handles wallet creation flow", () => {
    render(<Page />);

    fireEvent.click(screen.getByLabelText("Create new wallet"));
    fireEvent.click(screen.getByText("Create Wallet"));

    // Verify modal was handled (it should close)
    expect(screen.queryByText("Create a wallet")).not.toBeInTheDocument();
  });

  it("renders wallet components", () => {
    render(<Page />);

    expect(screen.getByTestId("wallet-list")).toBeInTheDocument();
  });
});
