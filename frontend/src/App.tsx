// =============================================================
// APP.TSX
// Main layout controller (Router lives in main.tsx)
// =============================================================

import { Routes, Route } from "react-router-dom"
import { useState } from "react"

import ChapterPage from "./pages/ChapterPage"
import { getEntity, type Entity } from "./api/entityService"
import ContentBlock from "./components/ContentBlock"
import { Navigate } from "react-router-dom"


function App() {
  // ===========================================================
  // REFERENCE PANEL STATE
  // ===========================================================
  const [referenceEntity, setReferenceEntity] = useState<Entity | null>(null)

  // ===========================================================
  // GLOBAL ENTITY HANDLER
  // ===========================================================
  async function handleReference(
    moduleId: string,
    ref: { kind: string; id: string } | null
  ) {
    if (!ref) return

    const entity = await getEntity(moduleId, ref.kind, ref.id)

    if (entity) {
      setReferenceEntity(entity)
    }
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>

      {/* ================= MAIN PANEL ================= */}
      <div
        style={{
          flex: 3,
          padding: "2rem",
          overflowY: "auto",
          borderRight: "1px solid #333"
        }}
      >
        <Routes>
          <Route
            path="/"
            element={
              <Navigate to="/modules/dungeon_of_the_mad_mage/chapters/01_dungeon_level" />
            }
          />

          <Route
            path="/modules/:moduleId/chapters/:chapterId"
            element={
              <ChapterPage
                setReference={(ref, moduleId) =>
                  handleReference(moduleId!, ref)
                }
              />
            }
          />
        </Routes>


      </div>

      {/* ================= REFERENCE PANEL ================= */}
      <div
        style={{
          flex: 2,
          padding: "1.5rem",
          overflowY: "auto",
          backgroundColor: "#111"
        }}
      >
        <h2>📖 Reference</h2>

        {!referenceEntity && (
          <p style={{ color: "#777" }}>
            Select a monster, trap, item, or faction to view details.
          </p>
        )}

        {referenceEntity && (
          <div>
            <h3>{referenceEntity.name}</h3>

            {Array.isArray(referenceEntity.content) ? (
              referenceEntity.content.map((block: any, index: number) => (
                <ContentBlock
                  key={index}
                  block={block}
                  setReference={(ref) =>
                    handleReference("", ref)
                  }
                />
              ))
            ) : (
              <ContentBlock
                block={{
                  type: "markdown",
                  text: referenceEntity.content
                }}
                setReference={(ref) =>
                  handleReference("", ref)
                }
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
