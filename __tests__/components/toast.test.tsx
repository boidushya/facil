import { ToastProvider, useToast } from "@/components/toast";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// -- Mock dependencies --
const mockUUID = vi.fn();
vi.stubGlobal("crypto", {
  randomUUID: mockUUID,
});

// -- Mock components--
function TestComponent() {
  const { addToast, toasts } = useToast();

  return (
    <div>
      <p>Toast count: {toasts.length}</p>
      <button onClick={() => addToast("Success message", "success")} data-testid="add-success">
        Add Success
      </button>
      <button onClick={() => addToast("Error message", "error")} data-testid="add-error">
        Add Error
      </button>
      <button onClick={() => addToast("Info message", "info")} data-testid="add-info">
        Add Info
      </button>
      <button onClick={() => addToast("Default message")} data-testid="add-default">
        Add Default
      </button>
      <button onClick={() => addToast("Custom duration", "info", 1000)} data-testid="add-custom-duration">
        Add Custom Duration
      </button>
    </div>
  );
}

function TestComponentOutsideProvider() {
  const { addToast } = useToast();
  return <button onClick={() => addToast("Test")}>Add Toast</button>;
}

describe("Toast System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUUID.mockReturnValue("test-uuid");
  });

  describe("useToast hook", () => {
    it("should throw error when used outside ToastProvider", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        render(<TestComponentOutsideProvider />);
      }).toThrow("useToast must be used within ToastProvider");

      consoleSpy.mockRestore();
    });

    it("should provide toast context when used within ToastProvider", () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      expect(screen.getByText("Toast count: 0")).toBeInTheDocument();
      expect(screen.getByTestId("add-success")).toBeInTheDocument();
    });
  });

  describe("ToastProvider", () => {
    it("should render children without toasts initially", () => {
      render(
        <ToastProvider>
          <div data-testid="child">Child content</div>
        </ToastProvider>
      );

      expect(screen.getByTestId("child")).toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.queryByText(/toast-container/)).not.toBeInTheDocument();
    });

    it("should render toast container when toasts exist", () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId("add-success"));

      expect(screen.getByText("Success message")).toBeInTheDocument();
      expect(document.querySelector(".toast-container")).toBeInTheDocument();
    });
  });

  describe("Toast creation and display", () => {
    beforeEach(() => {
      let counter = 0;
      mockUUID.mockImplementation(() => `test-uuid-${counter++}`);
    });

    it("should create success toast with correct styling and icon", () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId("add-success"));

      const toast = screen.getByRole("alert");
      expect(toast).toBeInTheDocument();
      expect(toast).toHaveAttribute("aria-live", "polite");
      expect(toast).toHaveClass("toast");
      expect(toast).toHaveClass("toast-success");
      expect(screen.getByText("Success message")).toBeInTheDocument();

      const icon = toast.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("should create error toast with correct styling and icon", () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId("add-error"));

      const toast = screen.getByRole("alert");
      expect(toast).toHaveClass("toast");
      expect(toast).toHaveClass("toast-error");
      expect(screen.getByText("Error message")).toBeInTheDocument();
    });

    it("should create info toast with correct styling and icon", () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId("add-info"));

      const toast = screen.getByRole("alert");
      expect(toast).toHaveClass("toast");
      expect(toast).toHaveClass("toast-info");
      expect(screen.getByText("Info message")).toBeInTheDocument();
    });

    it("should default to info type when no type specified", () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId("add-default"));

      const toast = screen.getByRole("alert");
      expect(toast).toHaveClass("toast");
      expect(toast).toHaveClass("toast-info");
      expect(screen.getByText("Default message")).toBeInTheDocument();
    });

    it("should create multiple toasts", () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId("add-success"));
      fireEvent.click(screen.getByTestId("add-error"));

      expect(screen.getAllByRole("alert")).toHaveLength(2);
      expect(screen.getByText("Success message")).toBeInTheDocument();
      expect(screen.getByText("Error message")).toBeInTheDocument();
      expect(screen.getByText("Toast count: 2")).toBeInTheDocument();
    });
  });

  describe("Toast interaction", () => {
    beforeEach(() => {
      let counter = 0;
      mockUUID.mockImplementation(() => `test-uuid-${counter++}`);
    });

    it("should have close button with proper accessibility", () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId("add-success"));

      const closeButton = screen.getByRole("button", { name: /close notification/i });
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveAttribute("aria-label", "Close notification");
      expect(closeButton).toHaveAttribute("type", "button");
    });

    it("should remove toast when close button clicked", async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId("add-success"));
      expect(screen.getByText("Success message")).toBeInTheDocument();
      expect(screen.getByText("Toast count: 1")).toBeInTheDocument();

      const closeButton = screen.getByRole("button", { name: /close notification/i });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText("Success message")).not.toBeInTheDocument();
        expect(screen.getByText("Toast count: 0")).toBeInTheDocument();
      });
    });

    it("should apply exit animation when closing", () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId("add-success"));
      const toast = screen.getByRole("alert");
      expect(toast).not.toHaveClass("toast-exit");

      const closeButton = screen.getByRole("button", { name: /close notification/i });
      fireEvent.click(closeButton);

      expect(toast).toHaveClass("toast-exit");
    });
  });

  describe("Toast auto-dismiss", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      let counter = 0;
      mockUUID.mockImplementation(() => `test-uuid-${counter++}`);
    });

    afterEach(() => {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    });

    it("should auto-dismiss after default duration (3000ms)", () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId("add-success"));
      expect(screen.getByText("Success message")).toBeInTheDocument();
      expect(screen.getByText("Toast count: 1")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(screen.getByRole("alert")).toHaveClass("toast-exit");

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(screen.queryByText("Success message")).not.toBeInTheDocument();
      expect(screen.getByText("Toast count: 0")).toBeInTheDocument();
    });

    it("should auto-dismiss after custom duration", () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId("add-custom-duration"));
      expect(screen.getByText("Custom duration")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByRole("alert")).toHaveClass("toast-exit");

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(screen.queryByText("Custom duration")).not.toBeInTheDocument();
    });

    it("should handle multiple toasts with different durations", () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId("add-custom-duration"));
      fireEvent.click(screen.getByTestId("add-success"));

      expect(screen.getAllByRole("alert")).toHaveLength(2);
      expect(screen.getByText("Toast count: 2")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByText("Custom duration").closest(".toast")).toHaveClass("toast-exit");
      expect(screen.getByText("Success message").closest(".toast")).not.toHaveClass("toast-exit");

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(screen.queryByText("Custom duration")).not.toBeInTheDocument();
      expect(screen.getByText("Success message")).toBeInTheDocument();
      expect(screen.getByText("Toast count: 1")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1800);
      });

      expect(screen.getByText("Success message").closest(".toast")).toHaveClass("toast-exit");

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(screen.queryByText("Success message")).not.toBeInTheDocument();
      expect(screen.getByText("Toast count: 0")).toBeInTheDocument();
    });
  });

  describe("Toast content and accessibility", () => {
    beforeEach(() => {
      mockUUID.mockReturnValue("test-uuid");
    });

    it("should render toast message correctly", () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId("add-success"));

      const message = screen.getByText("Success message");
      expect(message).toBeInTheDocument();
      expect(message).toHaveClass("toast-message");
    });

    it("should have proper ARIA attributes", () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId("add-success"));

      const toast = screen.getByRole("alert");
      expect(toast).toHaveAttribute("role", "alert");
      expect(toast).toHaveAttribute("aria-live", "polite");
    });

    it("should contain all required elements", () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId("add-success"));

      const toast = screen.getByRole("alert");

      const content = toast.querySelector(".toast-content");
      expect(content).toBeInTheDocument();

      const icon = toast.querySelector(".toast-icon");
      expect(icon).toBeInTheDocument();

      const message = toast.querySelector(".toast-message");
      expect(message).toBeInTheDocument();

      const closeButton = toast.querySelector(".toast-close");
      expect(closeButton).toBeInTheDocument();
    });
  });
});
