import { webcrypto } from "crypto"
if (!(globalThis as any).crypto) {
  ;(globalThis as any).crypto = webcrypto
}

import { encryptString, decryptToString } from "@/lib/crypto"

type Test = { name: string; run: () => Promise<void> }

function assert(condition: any, msg: string) {
  if (!condition) throw new Error(`Assertion failed: ${msg}`)
}

const tests: Test[] = [
  {
    name: "encrypt/decrypt roundtrip",
    async run() {
      const plain = "hello-world"
      const pwd = "passw0rd-12345"
      const enc = await encryptString(plain, pwd)
      const dec = await decryptToString(enc, pwd)
      assert(dec === plain, "decrypted text must match original")
    },
  },
  {
    name: "wrong password fails",
    async run() {
      const plain = "secret"
      const enc = await encryptString(plain, "correct-horse")
      let failed = false
      try {
        await decryptToString(enc, "wrong-battery")
      } catch {
        failed = true
      }
      assert(failed, "decrypt must fail with wrong password")
    },
  },
  {
    name: "encryption is randomized",
    async run() {
      const plain = "same-plaintext"
      const pwd = "some-password"
      const a = await encryptString(plain, pwd)
      const b = await encryptString(plain, pwd)
      // Different iv or ciphertext should indicate randomness
      assert(a.iv !== b.iv || a.ct !== b.ct, "encryption should produce different outputs")
    },
  },
]

// Simple runner
;(async () => {
  let passed = 0
  for (const t of tests) {
    try {
      await t.run()
      console.log(`[v0][PASS] ${t.name}`)
      passed++
    } catch (err: any) {
      console.log(`[v0][FAIL] ${t.name}: ${err?.message || err}`)
    }
  }
  console.log(`[v0] ${passed}/${tests.length} tests passed`)
})()
