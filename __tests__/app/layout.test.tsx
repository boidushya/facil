import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import RootLayout, { metadata } from "@/app/layout";

describe("RootLayout", () => {
  it("renders children and basic structure", () => {
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
});
