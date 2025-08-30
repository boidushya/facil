import { type EncryptedPayload, decryptToString, encryptString } from "@/lib/crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

// -- Mock crypto.subtle --
const mockCrypto = {
  getRandomValues: vi.fn((array: Uint8Array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = i % 256;
    }
    return array;
  }),
  subtle: {
    importKey: vi.fn().mockResolvedValue({ type: "secret" } as CryptoKey),
    deriveKey: vi.fn().mockResolvedValue({ type: "secret" } as CryptoKey),
    encrypt: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
    decrypt: vi.fn().mockResolvedValue(new TextEncoder().encode("test-plaintext")),
  },
};

Object.defineProperty(global, "crypto", {
  value: mockCrypto,
  writable: true,
});

describe("crypto utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mocks to default behavior
    mockCrypto.subtle.importKey.mockResolvedValue({ type: "secret" } as CryptoKey);
    mockCrypto.subtle.deriveKey.mockResolvedValue({ type: "secret" } as CryptoKey);
    mockCrypto.subtle.encrypt.mockResolvedValue(new ArrayBuffer(32));
    mockCrypto.subtle.decrypt.mockResolvedValue(new TextEncoder().encode("test-plaintext"));
  });

  describe("encryptString", () => {
    it("should encrypt a string with password", async () => {
      const plaintext = "hello world";
      const password = "testpassword123";

      const result = await encryptString(plaintext, password);

      expect(result).toHaveProperty("ct");
      expect(result).toHaveProperty("iv");
      expect(result).toHaveProperty("salt");
      expect(result).toHaveProperty("ver", 1);
      expect(typeof result.ct).toBe("string");
      expect(typeof result.iv).toBe("string");
      expect(typeof result.salt).toBe("string");
    });

    it("should call crypto APIs correctly", async () => {
      const plaintext = "test data";
      const password = "password";

      await encryptString(plaintext, password);

      expect(mockCrypto.getRandomValues).toHaveBeenCalledTimes(2); // IV and salt
      expect(mockCrypto.subtle.importKey).toHaveBeenCalledWith(
        "raw",
        new TextEncoder().encode(password),
        "PBKDF2",
        false,
        ["deriveKey"]
      );
      expect(mockCrypto.subtle.deriveKey).toHaveBeenCalled();
      expect(mockCrypto.subtle.encrypt).toHaveBeenCalled();
    });

    it("should handle empty string", async () => {
      const plaintext = "";
      const password = "testpassword123";

      const result = await encryptString(plaintext, password);

      expect(result).toHaveProperty("ct");
      expect(result).toHaveProperty("iv");
      expect(result).toHaveProperty("salt");
      expect(result).toHaveProperty("ver", 1);
    });

    it("should use PBKDF2 with correct parameters", async () => {
      await encryptString("test", "password");

      expect(mockCrypto.subtle.deriveKey).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "PBKDF2",
          iterations: 150_000,
          hash: "SHA-256",
        }),
        expect.anything(),
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
      );
    });

    it("should use AES-GCM for encryption", async () => {
      await encryptString("test", "password");

      expect(mockCrypto.subtle.encrypt).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "AES-GCM",
        }),
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe("decryptToString", () => {
    const mockPayload: EncryptedPayload = {
      ct: "dGVzdA==", // "test" in base64
      iv: "AAAAAAAAAAAA", // Mock IV
      salt: "AAAAAAAAAAAAAAAAAAAAAA==", // Mock salt
      ver: 1,
    };

    it("should decrypt encrypted payload", async () => {
      mockCrypto.subtle.decrypt.mockResolvedValue(new TextEncoder().encode("test-plaintext"));

      const result = await decryptToString(mockPayload, "password");

      expect(result).toBe("test-plaintext");
    });

    it("should call crypto APIs correctly", async () => {
      await decryptToString(mockPayload, "password");

      expect(mockCrypto.subtle.importKey).toHaveBeenCalledWith(
        "raw",
        new TextEncoder().encode("password"),
        "PBKDF2",
        false,
        ["deriveKey"]
      );
      expect(mockCrypto.subtle.deriveKey).toHaveBeenCalled();
      expect(mockCrypto.subtle.decrypt).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "AES-GCM",
        }),
        expect.anything(),
        expect.anything()
      );
    });

    it("should handle empty decrypted content", async () => {
      mockCrypto.subtle.decrypt.mockResolvedValue(new ArrayBuffer(0));

      const result = await decryptToString(mockPayload, "password");

      expect(result).toBe("");
    });

    it("should fail with crypto errors", async () => {
      mockCrypto.subtle.importKey.mockResolvedValueOnce({ type: "secret" } as CryptoKey);
      mockCrypto.subtle.deriveKey.mockResolvedValueOnce({ type: "secret" } as CryptoKey);
      mockCrypto.subtle.decrypt.mockRejectedValueOnce(new Error("Decryption failed"));

      await expect(decryptToString(mockPayload, "password")).rejects.toThrow("Decryption failed");
    });

    it("should validate payload structure", async () => {
      const invalidPayload = {
        ct: "invalid-base64!@#",
        iv: "invalid",
        salt: "invalid",
        ver: 1,
      } as EncryptedPayload;

      await expect(decryptToString(invalidPayload, "password")).rejects.toThrow();
    });
  });

  describe("base64 encoding/decoding", () => {
    it("should handle base64 encoding correctly", async () => {
      const testData = new Uint8Array([1, 2, 3, 4, 5]);

      mockCrypto.subtle.encrypt.mockResolvedValue(testData.buffer);

      const result = await encryptString("test", "password");

      expect(result.ct).toMatch(/^[A-Za-z0-9+/=]+$/);
    });

    it("should handle base64 decoding correctly", async () => {
      const validPayload: EncryptedPayload = {
        ct: "AQIDBA==", // [1,2,3,4] in base64
        iv: "AAAAAAAAAAAA",
        salt: "AAAAAAAAAAAAAAAAAAAAAA==",
        ver: 1,
      };

      mockCrypto.subtle.importKey.mockResolvedValueOnce({ type: "secret" } as CryptoKey);
      mockCrypto.subtle.deriveKey.mockResolvedValueOnce({ type: "secret" } as CryptoKey);
      mockCrypto.subtle.decrypt.mockResolvedValueOnce(new TextEncoder().encode("test"));

      await decryptToString(validPayload, "password");

      expect(mockCrypto.subtle.decrypt).toHaveBeenCalled();
    });
  });

  describe("EncryptedPayload type", () => {
    it("should create valid encrypted payload structure", async () => {
      const result = await encryptString("test", "password");

      expect(result).toEqual({
        ct: expect.any(String),
        iv: expect.any(String),
        salt: expect.any(String),
        ver: 1,
      });
    });

    it("should be JSON serializable", async () => {
      const result = await encryptString("test", "password");

      const jsonString = JSON.stringify(result);
      const parsed = JSON.parse(jsonString);

      expect(parsed).toEqual(result);
      expect(parsed).toHaveProperty("ct");
      expect(parsed).toHaveProperty("iv");
      expect(parsed).toHaveProperty("salt");
      expect(parsed).toHaveProperty("ver");
    });

    it("should maintain version field", async () => {
      const result = await encryptString("test", "password");

      expect(result.ver).toBe(1);
      expect(typeof result.ver).toBe("number");
    });
  });

  describe("security properties", () => {
    it("should use random IV and salt", async () => {
      await encryptString("test", "password");

      expect(mockCrypto.getRandomValues).toHaveBeenCalledTimes(2);

      const ivCall = mockCrypto.getRandomValues.mock.calls[0][0];
      expect(ivCall).toBeInstanceOf(Uint8Array);
      expect(ivCall.length).toBe(12);

      const saltCall = mockCrypto.getRandomValues.mock.calls[1][0];
      expect(saltCall).toBeInstanceOf(Uint8Array);
      expect(saltCall.length).toBe(16);
    });

    it("should use secure iteration count", async () => {
      await encryptString("test", "password");

      const deriveKeyCall = mockCrypto.subtle.deriveKey.mock.calls[0][0];
      expect(deriveKeyCall).toHaveProperty("iterations", 150_000);
    });

    it("should use AES-GCM with 256-bit key", async () => {
      await encryptString("test", "password");

      const deriveKeyCall = mockCrypto.subtle.deriveKey.mock.calls[0][2];
      expect(deriveKeyCall).toEqual({
        name: "AES-GCM",
        length: 256,
      });
    });
  });

  describe("error handling", () => {
    it("should handle importKey failure in encryptString", async () => {
      mockCrypto.subtle.importKey.mockRejectedValueOnce(new Error("Import failed"));

      await expect(encryptString("test", "password")).rejects.toThrow("Import failed");
    });

    it("should handle deriveKey failure in encryptString", async () => {
      mockCrypto.subtle.importKey.mockResolvedValueOnce({ type: "secret" } as CryptoKey);
      mockCrypto.subtle.deriveKey.mockRejectedValueOnce(new Error("Derive failed"));

      await expect(encryptString("test", "password")).rejects.toThrow("Derive failed");
    });

    it("should handle encrypt failure in encryptString", async () => {
      mockCrypto.subtle.importKey.mockResolvedValueOnce({ type: "secret" } as CryptoKey);
      mockCrypto.subtle.deriveKey.mockResolvedValueOnce({ type: "secret" } as CryptoKey);
      mockCrypto.subtle.encrypt.mockRejectedValueOnce(new Error("Encrypt failed"));

      await expect(encryptString("test", "password")).rejects.toThrow("Encrypt failed");
    });

    it("should handle decrypt failure in decryptToString", async () => {
      mockCrypto.subtle.importKey.mockResolvedValueOnce({ type: "secret" } as CryptoKey);
      mockCrypto.subtle.deriveKey.mockResolvedValueOnce({ type: "secret" } as CryptoKey);
      mockCrypto.subtle.decrypt.mockRejectedValueOnce(new Error("Decrypt failed"));

      const payload: EncryptedPayload = {
        ct: "test",
        iv: "test",
        salt: "test",
        ver: 1,
      };

      await expect(decryptToString(payload, "password")).rejects.toThrow("Decrypt failed");
    });
  });
});
