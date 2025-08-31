import { generateAvatarColor, shortenAddress } from "@/lib/utils";
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

describe("generateAvatarColor", () => {
  it("should generate consistent colors for the same address", () => {
    const address = "0x742d35Cc6634C0532925a3b8D8f5e3E56F1234567";
    const result1 = generateAvatarColor(address);
    const result2 = generateAvatarColor(address);

    expect(result1).toBe(result2);
    expect(result1).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
  });

  it("should generate different colors for different addresses", () => {
    const address1 = "0x742d35Cc6634C0532925a3b8D8f5e3E56F1234567";
    const address2 = "0x1111111111111111111111111111111111111111";
    const result1 = generateAvatarColor(address1);
    const result2 = generateAvatarColor(address2);

    expect(result1).not.toBe(result2);
    expect(result1).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
    expect(result2).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
  });

  it("should handle case insensitive addresses consistently", () => {
    const lowerAddress = "0x742d35cc6634c0532925a3b8d8f5e3e56f1234567";
    const upperAddress = "0x742D35CC6634C0532925A3B8D8F5E3E56F1234567";
    const result1 = generateAvatarColor(lowerAddress);
    const result2 = generateAvatarColor(upperAddress);

    expect(result1).toBe(result2);
  });

  it("should generate valid HSL color values", () => {
    const address = "0x742d35Cc6634C0532925a3b8D8f5e3E56F1234567";
    const result = generateAvatarColor(address);

    expect(result).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);

    const matches = result.match(/hsl\((\d+), (\d+)%, (\d+)%\)/);
    expect(matches).toBeTruthy();

    if (matches) {
      const [, hue, saturation, lightness] = matches;
      expect(Number(hue)).toBeGreaterThanOrEqual(0);
      expect(Number(hue)).toBeLessThan(360);
      expect(Number(saturation)).toBeGreaterThanOrEqual(45);
      expect(Number(saturation)).toBeLessThan(75);
      expect(Number(lightness)).toBeGreaterThanOrEqual(50);
      expect(Number(lightness)).toBeLessThan(70);
    }
  });
});
