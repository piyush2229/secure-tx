import { randomBytes } from "crypto"

export const NONCE_LENGTH = 12
export const TAG_LENGTH = 16
export const DEK_LENGTH = 32

export function generateNonce(): Buffer {
  return randomBytes(NONCE_LENGTH)
}

export function generateDEK(): Buffer {
  return randomBytes(DEK_LENGTH)
}

export function bufferToHex(buf: Buffer): string {
  return buf.toString("hex")
}

export function hexToBuffer(hex: string): Buffer {
  if (!/^[0-9a-fA-F]+$/.test(hex)) {
    throw new Error("Invalid hex string")
    
  }
  return Buffer.from(hex, "hex")
}
