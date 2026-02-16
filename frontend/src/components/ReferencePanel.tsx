import { useEffect, useState } from "react"
import { getModule } from "../api/client"
import apiFetch from "../api/client"

interface ReferenceState {
  kind: string
  id: string
}

interface ReferencePanelProps {
  reference: ReferenceState | null
  setReference: (ref: ReferenceState | null) => void
}

function ReferencePanel({
  reference,
  setReference
}: ReferencePanelProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!reference) {
      setData(null)
      return
    }

    async function load() {
      setLoading(true)
      try {
        const result = await apiFetch(
          `/api/library/${reference.kind}/${reference.id}`
        )
        setData(result)
      } catch (err) {
        console.error(err)
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [reference])

  // ------------------------------------------------------------
  // Default State
  // ------------------------------------------------------------
  if (!reference) {
    return (
      <div>
        <h2>Reference</h2>
        <p>Select a monster, item, trap, or NPC.</p>

        <img
          src="/default-art.png"
          alt="Default"
          style={{ width: "100%", marginTop: "1rem" }}
        />
      </div>
    )
  }

  // ------------------------------------------------------------
  // Loading
  // ------------------------------------------------------------
  if (loading) {
    return <p>Loading reference...</p>
  }

  // ------------------------------------------------------------
  // Loaded
  // ------------------------------------------------------------
  if (!data) {
    return <p>Reference not found.</p>
  }

  return (
    <div>
      <button onClick={() => setReference(null)}>
        Clear
      </button>

      <h2>{data.name}</h2>

      {data.content && <p>{data.content}</p>}
    </div>
  )
}

export default ReferencePanel
