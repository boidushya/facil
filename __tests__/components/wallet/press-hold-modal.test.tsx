import PressHoldModal from "@/components/wallet/press-hold-modal";
import type { EncryptedPayload } from "@/lib/crypto";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock crypto module
vi.mock("@/lib/crypto", () => ({
  decryptToString: vi.fn(),
}));

const { decryptToString } = await import("@/lib/crypto");

// Mock timer functions
vi.useFakeTimers();

describe("PressHoldModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: "Test Modal",
    description: "Test description",
  };

  const mockEncryptedPayload: EncryptedPayload = {
    ct: "mock-ciphertext",
    iv: "mock-iv", 
    salt: "mock-salt",
    ver: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.mocked(decryptToString).mockResolvedValue("mock-private-key");
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.useFakeTimers();
  });

  it("renders modal when open", () => {
    render(<PressHoldModal {...defaultProps} />);

    expect(screen.getByText("Test Modal")).toBeInTheDocument();
    expect(screen.getByText("Test description")).toBeInTheDocument();
    expect(screen.getByText("Hold to confirm")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<PressHoldModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText("Test Modal")).not.toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    render(<PressHoldModal {...defaultProps} />);

    const closeButton = screen.getByLabelText("Close modal");
    fireEvent.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when overlay is clicked", () => {
    render(<PressHoldModal {...defaultProps} />);

    const overlay = document.querySelector(".modal-overlay");
    fireEvent.click(overlay!);

    expect(defaultProps.onClose).toHaveBeenCalledOnce();
  });

  it("does not call onClose when modal content is clicked", () => {
    render(<PressHoldModal {...defaultProps} />);

    const content = document.querySelector(".modal-content");
    fireEvent.click(content!);

    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it("uses custom confirm text when provided", () => {
    render(<PressHoldModal {...defaultProps} confirmText="Custom hold text" />);

    expect(screen.getByText("Custom hold text")).toBeInTheDocument();
  });

  it("shows holding state when mouse is pressed down", () => {
    render(<PressHoldModal {...defaultProps} />);

    const holdButton = screen.getByLabelText("Press and hold to confirm deletion");

    act(() => {
      fireEvent.mouseDown(holdButton);
    });

    expect(holdButton).toHaveClass("holding");
    expect(screen.getByText("Keep holding to confirm...")).toBeInTheDocument();
  });

  it("resets state when mouse is released before completion", () => {
    render(<PressHoldModal {...defaultProps} />);

    const holdButton = screen.getByLabelText("Press and hold to confirm deletion");

    // Start holding
    act(() => {
      fireEvent.mouseDown(holdButton);
    });
    expect(holdButton).toHaveClass("holding");

    // Release before completion
    act(() => {
      fireEvent.mouseUp(holdButton);
    });
    expect(holdButton).not.toHaveClass("holding");
    expect(screen.queryByText("Keep holding to confirm...")).not.toBeInTheDocument();
  });

  it("calls onConfirm and onClose when hold duration is completed", async () => {
    render(<PressHoldModal {...defaultProps} holdDuration={1000} />);

    const holdButton = screen.getByLabelText("Press and hold to confirm deletion");

    // Start holding
    act(() => {
      fireEvent.mouseDown(holdButton);
    });

    // Fast-forward time to complete the hold
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(defaultProps.onConfirm).toHaveBeenCalledOnce();
    expect(defaultProps.onClose).toHaveBeenCalledOnce();
  });

  it("supports touch events for mobile", () => {
    render(<PressHoldModal {...defaultProps} />);

    const holdButton = screen.getByLabelText("Press and hold to confirm deletion");

    // Start touch
    act(() => {
      fireEvent.touchStart(holdButton);
    });
    expect(holdButton).toHaveClass("holding");

    // End touch
    act(() => {
      fireEvent.touchEnd(holdButton);
    });
    expect(holdButton).not.toHaveClass("holding");
  });

  it("resets state when mouse leaves button", () => {
    render(<PressHoldModal {...defaultProps} />);

    const holdButton = screen.getByLabelText("Press and hold to confirm deletion");

    // Start holding
    act(() => {
      fireEvent.mouseDown(holdButton);
    });
    expect(holdButton).toHaveClass("holding");

    // Mouse leaves
    act(() => {
      fireEvent.mouseLeave(holdButton);
    });
    expect(holdButton).not.toHaveClass("holding");
  });

  it("updates progress during hold", () => {
    render(<PressHoldModal {...defaultProps} holdDuration={1000} />);

    const holdButton = screen.getByLabelText("Press and hold to confirm deletion");
    const progressBar = document.querySelector(".press-hold-progress");

    // Start holding
    act(() => {
      fireEvent.mouseDown(holdButton);
    });

    // Advance time partially
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Check that progress bar has some width (between 40% and 60% to account for timing variations)
    const style = window.getComputedStyle(progressBar!);
    const width = parseFloat(style.width);
    expect(width).toBeGreaterThan(0);
  });

  it("resets state when modal is closed and reopened", () => {
    const { rerender } = render(<PressHoldModal {...defaultProps} />);

    const holdButton = screen.getByLabelText("Press and hold to confirm deletion");

    // Start holding
    act(() => {
      fireEvent.mouseDown(holdButton);
    });
    expect(holdButton).toHaveClass("holding");

    // Close modal
    rerender(<PressHoldModal {...defaultProps} isOpen={false} />);

    // Reopen modal
    rerender(<PressHoldModal {...defaultProps} isOpen={true} />);

    const newHoldButton = screen.getByLabelText("Press and hold to confirm deletion");
    expect(newHoldButton).not.toHaveClass("holding");
    expect(screen.queryByText("Keep holding to confirm...")).not.toBeInTheDocument();
  });

  it("cleans up timers when component unmounts", () => {
    const { unmount } = render(<PressHoldModal {...defaultProps} />);

    const holdButton = screen.getByLabelText("Press and hold to confirm deletion");

    // Start holding
    act(() => {
      fireEvent.mouseDown(holdButton);
    });

    // Unmount component
    unmount();

    // Advance time - should not trigger callbacks since component is unmounted
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(defaultProps.onConfirm).not.toHaveBeenCalled();
  });

  describe("password verification", () => {
    it("should not show password form when requirePassword is false", () => {
      render(<PressHoldModal {...defaultProps} requirePassword={false} />);

      expect(screen.queryByLabelText(/enter password to enable/i)).not.toBeInTheDocument();
    });

    it("should show password form when requirePassword is true", () => {
      render(
        <PressHoldModal 
          {...defaultProps} 
          requirePassword={true}
          encryptedPayload={mockEncryptedPayload} 
        />
      );

      expect(screen.getByLabelText(/enter password to enable/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /verify/i })).toBeInTheDocument();
    });

    it("should disable hold button initially when password required", () => {
      render(
        <PressHoldModal 
          {...defaultProps} 
          requirePassword={true}
          encryptedPayload={mockEncryptedPayload}
        />
      );

      const holdButton = screen.getByLabelText("Press and hold to confirm deletion");
      expect(holdButton).toBeDisabled();
      expect(screen.getByText("Verify password to enable")).toBeInTheDocument();
    });

    it("should disable verify button when password is empty", () => {
      render(
        <PressHoldModal 
          {...defaultProps} 
          requirePassword={true}
          encryptedPayload={mockEncryptedPayload}
        />
      );

      const verifyButton = screen.getByRole("button", { name: /verify/i });
      expect(verifyButton).toBeDisabled();
    });

    it("should enable verify button when password is entered", () => {
      render(
        <PressHoldModal 
          {...defaultProps} 
          requirePassword={true}
          encryptedPayload={mockEncryptedPayload}
        />
      );

      fireEvent.change(screen.getByLabelText(/enter password to enable/i), { 
        target: { value: "test password" } 
      });

      const verifyButton = screen.getByRole("button", { name: /verify/i });
      expect(verifyButton).not.toBeDisabled();
    });

    it("should show error for invalid password", async () => {
      vi.useRealTimers();
      vi.mocked(decryptToString).mockRejectedValue(new Error("Decryption failed"));
      
      render(
        <PressHoldModal 
          {...defaultProps} 
          requirePassword={true}
          encryptedPayload={mockEncryptedPayload}
        />
      );

      fireEvent.change(screen.getByLabelText(/enter password to enable/i), { 
        target: { value: "wrong password" } 
      });
      
      fireEvent.click(screen.getByRole("button", { name: /verify/i }));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(/invalid password/i);
      });

      const holdButton = screen.getByLabelText("Press and hold to confirm deletion");
      expect(holdButton).toBeDisabled();
      vi.useFakeTimers();
    });

    it("should enable hold button after successful password verification", async () => {
      vi.useRealTimers();
      
      render(
        <PressHoldModal 
          {...defaultProps} 
          requirePassword={true}
          encryptedPayload={mockEncryptedPayload}
          confirmText="Hold to delete"
        />
      );

      fireEvent.change(screen.getByLabelText(/enter password to enable/i), { 
        target: { value: "correct password" } 
      });
      
      fireEvent.click(screen.getByRole("button", { name: /verify/i }));

      await waitFor(() => {
        const holdButton = screen.getByLabelText("Press and hold to confirm deletion");
        expect(holdButton).not.toBeDisabled();
        expect(screen.getByText("Hold to delete")).toBeInTheDocument();
      });

      expect(decryptToString).toHaveBeenCalledWith(mockEncryptedPayload, "correct password");
      vi.useFakeTimers();
    });

    it("should hide password form after successful verification", async () => {
      vi.useRealTimers();
      
      render(
        <PressHoldModal 
          {...defaultProps} 
          requirePassword={true}
          encryptedPayload={mockEncryptedPayload}
        />
      );

      expect(screen.getByLabelText(/enter password to enable/i)).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText(/enter password to enable/i), { 
        target: { value: "correct password" } 
      });
      
      fireEvent.click(screen.getByRole("button", { name: /verify/i }));

      await waitFor(() => {
        expect(screen.queryByLabelText(/enter password to enable/i)).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /verify/i })).not.toBeInTheDocument();
      });
      
      vi.useFakeTimers();
    });

    it("should reset password state when modal is closed and reopened", () => {
      const { rerender } = render(
        <PressHoldModal 
          {...defaultProps} 
          requirePassword={true}
          encryptedPayload={mockEncryptedPayload}
        />
      );

      fireEvent.change(screen.getByLabelText(/enter password to enable/i), { 
        target: { value: "test" } 
      });

      rerender(
        <PressHoldModal 
          {...defaultProps} 
          isOpen={false}
          requirePassword={true}
          encryptedPayload={mockEncryptedPayload}
        />
      );

      rerender(
        <PressHoldModal 
          {...defaultProps} 
          requirePassword={true}
          encryptedPayload={mockEncryptedPayload}
        />
      );

      expect(screen.getByLabelText(/enter password to enable/i)).toHaveValue("");
    });

    it("should prevent hold action when password is not verified", () => {
      render(
        <PressHoldModal 
          {...defaultProps} 
          requirePassword={true}
          encryptedPayload={mockEncryptedPayload}
          holdDuration={1000}
        />
      );

      const holdButton = screen.getByLabelText("Press and hold to confirm deletion");

      // Try to start holding (should not work since password not verified)
      act(() => {
        fireEvent.mouseDown(holdButton);
      });

      expect(holdButton).not.toHaveClass("holding");
      
      // Advance time to where hold would complete
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(defaultProps.onConfirm).not.toHaveBeenCalled();
    });
  });
});
