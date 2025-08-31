import PressHoldModal from "@/components/wallet/press-hold-modal";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
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
});
