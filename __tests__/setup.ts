import { cleanup } from "@testing-library/react";
import { afterEach, expect } from "vitest";

// -- Matchers for DOM testing --
expect.extend({
  toBeInTheDocument(received: any) {
    const pass = received != null;
    return {
      pass,
      message: () => `Expected element ${pass ? "not " : ""}to be in document`,
    };
  },
  toHaveAttribute(received: any, attr: string, value?: string) {
    const hasAttr = received?.hasAttribute?.(attr);
    const attrValue = received?.getAttribute?.(attr);
    const pass = hasAttr && (value === undefined || attrValue === value);
    return {
      pass,
      message: () => `Expected element ${pass ? "not " : ""}to have attribute ${attr}`,
    };
  },
  toHaveTextContent(received: any, text: string | RegExp) {
    const textContent = received?.textContent || "";
    const pass = text instanceof RegExp ? text.test(textContent) : textContent.includes(text);
    return {
      pass,
      message: () => `Expected element ${pass ? "not " : ""}to have text content matching ${text}`,
    };
  },
  toHaveValue(received: any, value: string) {
    const pass = received?.value === value;
    return {
      pass,
      message: () => `Expected element ${pass ? "not " : ""}to have value ${value}`,
    };
  },
  toBeDisabled(received: any) {
    const pass = received?.disabled === true;
    return {
      pass,
      message: () => `Expected element ${pass ? "not " : ""}to be disabled`,
    };
  },
});

// -- Cleanup --
afterEach(() => {
  cleanup();
});

// -- Extend expected types --
declare module "vitest" {
  interface Assertion<T> {
    toBeInTheDocument(): T;
    toHaveAttribute(attr: string, value?: string): T;
    toHaveTextContent(text: string | RegExp): T;
    toHaveValue(value: string): T;
    toBeDisabled(): T;
  }
}
