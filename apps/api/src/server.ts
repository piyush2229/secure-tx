import Fastify from "fastify"
import cors from "@fastify/cors"
import dotenv from "dotenv"
import { encryptEnvelope, decryptEnvelope, TxSecureRecord } from "@repo/crypto"

// Load .env only in local development
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: "../../.env" })
}

const buildApp = async () => {
  const fastify = Fastify({ logger: true })

  await fastify.register(cors, {
    origin: true,
  })

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

      return record
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

    return record
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
      return { payload: decrypted }
    } catch (err: any) {
      fastify.log.error(err)
      return reply.status(400).send({ error: "Decryption failed" })
    }
  })

  return fastify
}

export default async function handler(req: any, res: any) {
  const app = await buildApp()
  await app.ready()
  app.server.emit("request", req, res)
}

// 👇 Only run locally
if (require.main === module) {
  buildApp().then((app) => {
    app.listen({ port: 3001 }, (err, address) => {
      if (err) {
        app.log.error(err)
        process.exit(1)
      }
      console.log(`API running on ${address}`)
    })
  })
}
