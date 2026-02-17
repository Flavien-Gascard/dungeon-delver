import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import ContentBlock from "../components/ContentBlock"
import { getEntity, type Entity } from "../api/entityService"

interface ChapterPageProps {
  setReference: (ref: { kind: string; id: string } | null) => void
}

interface Chapter {
  id: string
  title: string
  content: any[]
}

function ChapterPage({ setReference }: ChapterPageProps) {
  const { moduleId, chapterId } = useParams()

  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [currentRoom, setCurrentRoom] = useState<Entity | null>(null)

  // ------------------------------------------------------------
  // Load Chapter
  // ------------------------------------------------------------
  useEffect(() => {
    if (!moduleId || !chapterId) return

    fetch(`/api/modules/${moduleId}/chapters/${chapterId}`)
      .then(res => res.json())
      .then(data => {
        setChapter(data)
        setCurrentRoom(null) // reset room when chapter changes
      })
  }, [moduleId, chapterId])

  // ------------------------------------------------------------
  // Handle Link Clicks (Entity-driven)
  // ------------------------------------------------------------
  async function handleLink(ref: { kind: string; id: string } | null) {
    if (!ref || !moduleId) return

    if (ref.kind === "room") {
      const entity = await getEntity(moduleId, "room", ref.id)
      if (entity) {
        setCurrentRoom(entity)
      }
    } else {
      setReference(ref)
    }
  }

  if (!chapter) {
    return <p>Loading chapter...</p>
  }

  return (
    <div>
      {/* ---------------- Chapter Title ---------------- */}
      <h1>{chapter.title}</h1>

      {/* ---------------- Chapter Blocks ---------------- */}
      {chapter.content?.map((block, index) => (
        <ContentBlock
          key={index}
          block={block}
          setReference={handleLink}
        />
      ))}

      {/* ---------------- Inline Room View ---------------- */}
      {currentRoom && (
        <div
          style={{
            marginTop: "2rem",
            padding: "1rem",
            borderTop: "1px solid #444"
          }}
        >
          <h2>🏰 {currentRoom.name}</h2>

          {Array.isArray(currentRoom.content) ? (
            currentRoom.content.map((block: any, index: number) => (
              <ContentBlock
                key={index}
                block={block}
                setReference={handleLink}
              />
            ))
          ) : (
            <ContentBlock
              block={{
                type: "markdown",
                text: currentRoom.content
              }}
              setReference={handleLink}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default ChapterPage
