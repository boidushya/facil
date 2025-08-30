import { shortenAddress } from "@/lib/utils";
import { describe, expect, it } from "vitest";

describe("shortenAddress", () => {
  it("should shorten a valid Ethereum address", () => {
    const address = "0x742d35Cc6634C0532925a3b8D8f5e3E56F1234567";
    const result = shortenAddress(address);

    expect(result).toBe("0x742d…4567");
  });

  it("should handle custom character count", () => {
    const address = "0x742d35Cc6634C0532925a3b8D8f5e3E56F1234567";
    const result = shortenAddress(address, 6);

    expect(result).toBe("0x742d35…234567");
  });

  it("should return original if too short", () => {
    const shortAddress = "0x1234";
    const result = shortenAddress(shortAddress, 4);

    expect(result).toBe("0x1234");
  });

  it("should handle empty string", () => {
    const result = shortenAddress("");

    expect(result).toBe("");
  });

  it("should handle non-0x prefixed strings", () => {
    const address = "742d35Cc6634C0532925a3b8D8f5e3E56F1234567";
    const result = shortenAddress(address);

    expect(result).toBe("742d35Cc6634C0532925a3b8D8f5e3E56F1234567");
  });

  it("should preserve case", () => {
    const mixedCaseAddress = "0x742D35cC6634c0532925A3B8d8F5E3e56f1234567";
    const result = shortenAddress(mixedCaseAddress);

    expect(result).toBe("0x742D…4567");
  });
});
