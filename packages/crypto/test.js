require("dotenv").config({ path: "../../.env" })

const { encryptEnvelope, decryptEnvelope } = require("./dist")

const record = encryptEnvelope("party_123", {
  amount: 100,
  currency: "AED"
})

console.log("Encrypted Record:")
console.log(record)

const decrypted = decryptEnvelope(record)

console.log("\nDecrypted:")
console.log(decrypted)
