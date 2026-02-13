import { createCipheriv, createDecipheriv, randomUUID } from "crypto"
import {
  generateNonce,
  generateDEK,
  bufferToHex,
  hexToBuffer,
  NONCE_LENGTH,
  TAG_LENGTH,
} from "./utils"
import { TxSecureRecord } from "./types"

const ALGORITHM = "aes-256-gcm"
const MK_VERSION = 1

function getMasterKey(): Buffer {
  const mkHex = process.env.MASTER_KEY
  if (!mkHex) {
    throw new Error("MASTER_KEY not set")
  }

  const key = hexToBuffer(mkHex)

  if (key.length !== 32) {
    throw new Error("MASTER_KEY must be 32 bytes")
  }

  return key
}

export function encryptEnvelope(
  partyId: string,
  payload: unknown
): TxSecureRecord {
  const masterKey = getMasterKey()
  const dek = generateDEK()

  // --- Encrypt payload with DEK ---
  const payloadNonce = generateNonce()
  const cipher = createCipheriv(ALGORITHM, dek, payloadNonce)

  const plaintext = Buffer.from(JSON.stringify(payload))
  const payloadCt = Buffer.concat([
    cipher.update(plaintext),
    cipher.final(),
  ])
  const payloadTag = cipher.getAuthTag()

  // --- Wrap DEK with master key ---
  const wrapNonce = generateNonce()
  const wrapCipher = createCipheriv(ALGORITHM, masterKey, wrapNonce)

  const wrappedDek = Buffer.concat([
    wrapCipher.update(dek),
    wrapCipher.final(),
  ])
  const wrapTag = wrapCipher.getAuthTag()

  return {
    id: randomUUID(),
    partyId,
    createdAt: new Date().toISOString(),

    payload_nonce: bufferToHex(payloadNonce),
    payload_ct: bufferToHex(payloadCt),
    payload_tag: bufferToHex(payloadTag),

    dek_wrap_nonce: bufferToHex(wrapNonce),
    dek_wrapped: bufferToHex(wrappedDek),
    dek_wrap_tag: bufferToHex(wrapTag),

    alg: "AES-256-GCM",
    mk_version: MK_VERSION,
  }
}

export function decryptEnvelope(record: TxSecureRecord): unknown {
  const masterKey = getMasterKey()

  const payloadNonce = hexToBuffer(record.payload_nonce)
  const payloadCt = hexToBuffer(record.payload_ct)
  const payloadTag = hexToBuffer(record.payload_tag)

  const wrapNonce = hexToBuffer(record.dek_wrap_nonce)
  const wrappedDek = hexToBuffer(record.dek_wrapped)
  const wrapTag = hexToBuffer(record.dek_wrap_tag)

  if (payloadNonce.length !== NONCE_LENGTH) {
    throw new Error("Invalid payload nonce length")
  }

  if (payloadTag.length !== TAG_LENGTH) {
    throw new Error("Invalid payload tag length")
  }

  if (wrapNonce.length !== NONCE_LENGTH) {
    throw new Error("Invalid wrap nonce length")
  }

  if (wrapTag.length !== TAG_LENGTH) {
    throw new Error("Invalid wrap tag length")
  }

  // --- Unwrap DEK ---
  const unwrapCipher = createDecipheriv(ALGORITHM, masterKey, wrapNonce)
  unwrapCipher.setAuthTag(wrapTag)

  const dek = Buffer.concat([
    unwrapCipher.update(wrappedDek),
    unwrapCipher.final(),
  ])

  // --- Decrypt payload ---
  const decipher = createDecipheriv(ALGORITHM, dek, payloadNonce)
  decipher.setAuthTag(payloadTag)

  const decrypted = Buffer.concat([
    decipher.update(payloadCt),
    decipher.final(),
  ])

  return JSON.parse(decrypted.toString())
}

