import Fastify from "fastify"
import cors from "@fastify/cors"
import dotenv from "dotenv"
import { encryptEnvelope, decryptEnvelope, TxSecureRecord } from "@repo/crypto"

dotenv.config({ path: "../../.env" })

const fastify = Fastify({ logger: true })

void fastify.register(cors, {
  origin: ["http://localhost:3000"],
})

// In-memory storage
const store = new Map<string, TxSecureRecord>()

// ------------------
// POST /tx/encrypt
// ------------------
fastify.post("/tx/encrypt", async (request, reply) => {
  try {
    const body = request.body as {
      partyId?: string
      payload?: unknown
    }

    if (!body.partyId || !body.payload) {
      return reply.status(400).send({ error: "partyId and payload required" })
    }

    const record = encryptEnvelope(body.partyId, body.payload)

    store.set(record.id, record)

    return reply.send(record)
  } catch (err: any) {
    fastify.log.error(err)
    return reply.status(500).send({ error: err.message })
  }
})

// ------------------
// GET /tx/:id
// ------------------
fastify.get("/tx/:id", async (request, reply) => {
  const { id } = request.params as { id: string }

  const record = store.get(id)

  if (!record) {
    return reply.status(404).send({ error: "Record not found" })
  }

  return reply.send(record)
})

// ------------------
// POST /tx/:id/decrypt
// ------------------
fastify.post("/tx/:id/decrypt", async (request, reply) => {
  try {
    const { id } = request.params as { id: string }

    const record = store.get(id)

    if (!record) {
      return reply.status(404).send({ error: "Record not found" })
    }

    const decrypted = decryptEnvelope(record)

    return reply.send({ payload: decrypted })
  } catch (err: any) {
    fastify.log.error(err)
    return reply.status(400).send({ error: "Decryption failed" })
  }
})

const start = async () => {
  try {
    await fastify.listen({ port: 3001 })
    console.log("API running on http://localhost:3001")
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
