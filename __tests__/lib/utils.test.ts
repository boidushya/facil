import { generateAvatarColor, shortenAddress, formatRelativeTime } from "@/lib/utils";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

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
      expect(Number(saturation)).toBeGreaterThanOrEqual(65);
      expect(Number(saturation)).toBeLessThan(85);
      expect(Number(lightness)).toBeGreaterThanOrEqual(50);
      expect(Number(lightness)).toBeLessThan(75);
    }
  });
});

describe("formatRelativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2023-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return 'just now' for very recent times", () => {
    const recent = new Date("2022-12-31T23:59:30Z"); // 30 seconds ago
    expect(formatRelativeTime(recent)).toBe("just now");
  });

  it("should format minutes correctly", () => {
    const fiveMinutesAgo = new Date("2022-12-31T23:55:00Z");
    expect(formatRelativeTime(fiveMinutesAgo)).toBe("5m ago");

    const oneMinuteAgo = new Date("2022-12-31T23:59:00Z");
    expect(formatRelativeTime(oneMinuteAgo)).toBe("1m ago");
  });

  it("should format hours correctly", () => {
    const twoHoursAgo = new Date("2022-12-31T22:00:00Z");
    expect(formatRelativeTime(twoHoursAgo)).toBe("2h ago");

    const oneHourAgo = new Date("2022-12-31T23:00:00Z");
    expect(formatRelativeTime(oneHourAgo)).toBe("1h ago");
  });

  it("should format days correctly", () => {
    const threeDaysAgo = new Date("2022-12-29T00:00:00Z");
    expect(formatRelativeTime(threeDaysAgo)).toBe("3d ago");

    const oneDayAgo = new Date("2022-12-31T00:00:00Z");
    expect(formatRelativeTime(oneDayAgo)).toBe("1d ago");
  });

  it("should format weeks correctly", () => {
    const twoWeeksAgo = new Date("2022-12-18T00:00:00Z");
    expect(formatRelativeTime(twoWeeksAgo)).toBe("2w ago");

    const oneWeekAgo = new Date("2022-12-25T00:00:00Z");
    expect(formatRelativeTime(oneWeekAgo)).toBe("1w ago");
  });

  it("should format months correctly", () => {
    const twoMonthsAgo = new Date("2022-11-01T00:00:00Z");
    expect(formatRelativeTime(twoMonthsAgo)).toBe("2mo ago");

    const oneMonthAgo = new Date("2022-12-01T00:00:00Z");
    expect(formatRelativeTime(oneMonthAgo)).toBe("1mo ago");
  });

  it("should format years correctly", () => {
    const twoYearsAgo = new Date("2021-01-01T00:00:00Z");
    expect(formatRelativeTime(twoYearsAgo)).toBe("2y ago");

    const oneYearAgo = new Date("2022-01-01T00:00:00Z");
    expect(formatRelativeTime(oneYearAgo)).toBe("1y ago");
  });

  it("should handle string dates", () => {
    const dateString = "2022-12-31T23:55:00Z";
    expect(formatRelativeTime(dateString)).toBe("5m ago");
  });

  it("should handle edge cases for time boundaries", () => {
    // Exactly 1 minute
    const exactlyOneMinute = new Date("2022-12-31T23:59:00Z");
    expect(formatRelativeTime(exactlyOneMinute)).toBe("1m ago");

    // Exactly 1 hour
    const exactlyOneHour = new Date("2022-12-31T23:00:00Z");
    expect(formatRelativeTime(exactlyOneHour)).toBe("1h ago");

    // Exactly 1 day
    const exactlyOneDay = new Date("2022-12-31T00:00:00Z");
    expect(formatRelativeTime(exactlyOneDay)).toBe("1d ago");
  });

  it("should handle future dates gracefully", () => {
    const futureDate = new Date("2023-01-02T00:00:00Z");
    const result = formatRelativeTime(futureDate);
    // Should still work even with negative differences
    expect(typeof result).toBe("string");
  });
});
