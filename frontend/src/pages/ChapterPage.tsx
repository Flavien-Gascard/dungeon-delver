import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import ContentBlock from "../components/ContentBlock"

interface ChapterPageProps {
  setReference: (ref: { kind: string; id: string } | null) => void
}

interface Chapter {
  id: string
  title: string
  content: any[]
}

interface Room {
  id: string
  name: string
  content: any
}

function ChapterPage({ setReference }: ChapterPageProps) {
  const { moduleId, chapterId } = useParams()

  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null)

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
  // Handle Link Clicks
  // ------------------------------------------------------------
  function handleLink(ref: { kind: string; id: string } | null) {
    if (!ref) return

    if (ref.kind === "room") {
      fetch(`/api/modules/${moduleId}/rooms/${ref.id}`)
        .then(res => res.json())
        .then(data => {
          setCurrentRoom(data)
        })
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

      {/* ---------------- Chapter Content ---------------- */}
      {chapter.content?.map((block, index) => (
        <ContentBlock
          key={index}
          block={block}
          setReference={handleLink}
        />
      ))}

      {/* ---------------- Inline Room Display ---------------- */}
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
