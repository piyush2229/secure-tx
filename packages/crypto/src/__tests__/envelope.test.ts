import { describe, it, expect, beforeAll } from "vitest"
import { encryptEnvelope, decryptEnvelope } from "../envelope"
import { TxSecureRecord } from "../types"

beforeAll(() => {
  process.env.MASTER_KEY =
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
})

describe("Envelope Encryption", () => {
  it("1. encrypt -> decrypt roundtrip works", () => {
    const record = encryptEnvelope("party_1", { amount: 100 })
    const decrypted = decryptEnvelope(record)

    expect(decrypted).toEqual({ amount: 100 })
  })

  it("2. generates unique IDs", () => {
    const r1 = encryptEnvelope("p", { a: 1 })
    const r2 = encryptEnvelope("p", { a: 1 })

    expect(r1.id).not.toBe(r2.id)
  })

  it("3. payload nonce is 12 bytes", () => {
    const record = encryptEnvelope("p", { a: 1 })
    expect(record.payload_nonce.length).toBe(24) // 12 bytes hex
  })

  it("4. payload tag is 16 bytes", () => {
    const record = encryptEnvelope("p", { a: 1 })
    expect(record.payload_tag.length).toBe(32) // 16 bytes hex
  })

  it("5. tampered ciphertext fails", () => {
    const record = encryptEnvelope("p", { a: 1 })

    const tampered: TxSecureRecord = {
      ...record,
      payload_ct: record.payload_ct.slice(0, -2) + "ff",
    }

    expect(() => decryptEnvelope(tampered)).toThrow()
  })

  it("6. tampered tag fails", () => {
    const record = encryptEnvelope("p", { a: 1 })

    const tampered: TxSecureRecord = {
      ...record,
      payload_tag: record.payload_tag.slice(0, -2) + "ff",
    }

    expect(() => decryptEnvelope(tampered)).toThrow()
  })

  it("7. tampered wrapped DEK fails", () => {
    const record = encryptEnvelope("p", { a: 1 })

    const tampered: TxSecureRecord = {
      ...record,
      dek_wrapped: record.dek_wrapped.slice(0, -2) + "ff",
    }

    expect(() => decryptEnvelope(tampered)).toThrow()
  })

  it("8. invalid nonce length throws", () => {
    const record = encryptEnvelope("p", { a: 1 })

    const tampered: TxSecureRecord = {
      ...record,
      payload_nonce: "aa", // too short
    }

    expect(() => decryptEnvelope(tampered)).toThrow()
  })

  it("9. invalid hex throws", () => {
    const record = encryptEnvelope("p", { a: 1 })

    const tampered: TxSecureRecord = {
      ...record,
      payload_ct: "zzzzzz",
    }

    expect(() => decryptEnvelope(tampered)).toThrow()
  })

  it("10. wrong master key fails decryption", () => {
    const record = encryptEnvelope("p", { a: 1 })

    process.env.MASTER_KEY =
      "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"

    expect(() => decryptEnvelope(record)).toThrow()
  })
})
