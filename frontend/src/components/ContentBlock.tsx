import { useParams } from "react-router-dom"

interface ContentBlockProps {
  block: any
  setReference?: (ref: { kind: string; id: string } | null) => void
}

function ContentBlock({ block, setReference }: ContentBlockProps) {
  const { moduleId } = useParams()

  // ------------------------------------------------------------
  // Inline Link Parser
  // ------------------------------------------------------------
  function renderWithLinks(text: string) {
    const parts = text.split(/(\[\[[^\]]+\]\])/g)

    return parts.map((part, index) => {
      const match = part.match(/\[\[([^:]+):([^\]]+)\]\]/)

      if (match) {
        const kind = match[1]
        const id = match[2]

        return (
          <span
            key={index}
            style={{
              color: "cyan",
              cursor: "pointer",
              textDecoration: "underline"
            }}
            onClick={() => {
              if (setReference) {
                setReference({ kind, id })
              }
            }}
          >
            {id}
          </span>
        )
      }

      return <span key={index}>{part}</span>
    })
  }

  // ------------------------------------------------------------
  // BLOCK RENDERING
  // ------------------------------------------------------------
  switch (block.type) {

    // ---------------- MARKDOWN ----------------
    case "markdown":
      return <p>{renderWithLinks(block.text)}</p>

    // ---------------- IMAGE ----------------
    case "image":
      return (
        <div style={{ margin: "1rem 0" }}>
          <img
            src={`http://localhost:4000/assets/${moduleId}/images/${block.image}`}
            alt={block.caption || ""}
            style={{ maxWidth: "100%" }}
          />
          {block.caption && <small>{block.caption}</small>}
        </div>
      )

    // ---------------- MAP ----------------
    case "map":
      return (
        <div style={{ margin: "1rem 0" }}>
          <img
            src={`http://localhost:4000/assets/${moduleId}/images/${block.image}`}
            alt="Map"
            style={{ maxWidth: "100%" }}
          />

          {/* Pins List */}
          {block.pins && block.pins.length > 0 && (
            <div style={{ marginTop: "1rem" }}>
              <h3>🧭 Locations</h3>

              {block.pins.map((pin: any, index: number) => (
                <div
                  key={index}
                  style={{
                    color: "cyan",
                    cursor: "pointer",
                    marginBottom: "0.5rem"
                  }}
                  onClick={() => {
                    if (setReference) {
                      setReference({ kind: "room", id: pin.room })
                    }
                  }}
                >
                  📍 {pin.room}
                </div>
              ))}
            </div>
          )}
        </div>
      )

    // ---------------- DEFAULT ----------------
    default:
      return (
        <p style={{ color: "gray" }}>
          Unknown block type: {block.type}
        </p>
      )
  }
}

export default ContentBlock
