"use client"

import { useState } from "react"

const API_BASE = "http://localhost:3001"

export default function Home() {
  const [partyId, setPartyId] = useState("")
  const [payload, setPayload] = useState('{\n  "amount": 100,\n  "currency": "AED"\n}')
  const [recordId, setRecordId] = useState("")
  const [encrypted, setEncrypted] = useState<any>(null)
  const [decrypted, setDecrypted] = useState<any>(null)
  const [error, setError] = useState("")

  const encrypt = async () => {
    try {
      setError("")
      const parsedPayload = JSON.parse(payload)

      const res = await fetch(`${API_BASE}/tx/encrypt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partyId, payload: parsedPayload }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Encryption failed")

      setEncrypted(data)
      setRecordId(data.id)
      setDecrypted(null)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const fetchRecord = async () => {
    try {
      setError("")
      const res = await fetch(`${API_BASE}/tx/${recordId}`)
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Fetch failed")

      setEncrypted(data)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const decrypt = async () => {
    try {
      setError("")
      const res = await fetch(`${API_BASE}/tx/${recordId}/decrypt`, {
        method: "POST",
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Decrypt failed")

      setDecrypted(data)
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div style={{ padding: 40, fontFamily: "monospace" }}>
      <h1>Secure Transaction Demo</h1>

      <div>
        <label>Party ID:</label>
        <input
          value={partyId}
          onChange={(e) => setPartyId(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        />
      </div>

      <div>
        <label>Payload (JSON):</label>
        <textarea
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          rows={6}
          style={{ width: "100%", marginBottom: 10 }}
        />
      </div>

      <button onClick={encrypt}>Encrypt & Save</button>
      <button onClick={fetchRecord} style={{ marginLeft: 10 }}>
        Fetch
      </button>
      <button onClick={decrypt} style={{ marginLeft: 10 }}>
        Decrypt
      </button>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      <h3>Record ID:</h3>
      <pre>{recordId}</pre>

      <h3>Encrypted Record:</h3>
      <pre>{JSON.stringify(encrypted, null, 2)}</pre>

      <h3>Decrypted:</h3>
      <pre>{JSON.stringify(decrypted, null, 2)}</pre>
    </div>
  )
}
