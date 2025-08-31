import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Suspense } from "react";
import { ToastProvider } from "@/components/toast";
import { metadata } from "@/app/layout";

describe("RootLayout", () => {
  it("renders children and basic structure", () => {
    const { getByTestId } = render(
      <ToastProvider>
        <Suspense fallback={null}>
          <div data-testid="test-child">Test Content</div>
        </Suspense>
      </ToastProvider>
    );

    expect(getByTestId("test-child")).toBeInTheDocument();
    expect(getByTestId("test-child")).toHaveTextContent("Test Content");
  });

  it("exports correct metadata", () => {
    expect(metadata).toEqual({
      title: "Facil",
      description: "Facil - a simple wallet organizer",
    });
  });
});
