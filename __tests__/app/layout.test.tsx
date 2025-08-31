import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import RootLayout, { metadata } from "@/app/layout";

describe("RootLayout", () => {
  it("renders children and validates structure", () => {
    const { getByTestId } = render(
      <RootLayout>
        <div data-testid="test-child">Test Content</div>
      </RootLayout>
    );

    expect(getByTestId("test-child")).toBeInTheDocument();
    expect(getByTestId("test-child")).toHaveTextContent("Test Content");
  });

  it("renders children within ToastProvider and Suspense", () => {
    const { getByTestId } = render(
      <RootLayout>
        <div data-testid="test-child">Test Content</div>
      </RootLayout>
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

  it("handles multiple children correctly", () => {
    const { getByTestId } = render(
      <RootLayout>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </RootLayout>
    );

    expect(getByTestId("child-1")).toBeInTheDocument();
    expect(getByTestId("child-2")).toBeInTheDocument();
  });

  it("renders with proper TypeScript types", () => {
    const TestComponent = () => <div data-testid="typed-child">Typed Content</div>;

    const { getByTestId } = render(
      <RootLayout>
        <TestComponent />
      </RootLayout>
    );

    expect(getByTestId("typed-child")).toBeInTheDocument();
  });
});
