import { Routes, Route } from "react-router-dom"
import { useState } from "react"

import HomePage from "./pages/HomePage"
import ModulePage from "./pages/ModulePage"
import ChapterPage from "./pages/ChapterPage"
import ReferencePanel from "./components/ReferencePanel"

export interface ReferenceState {
  kind: string
  id: string
}

function App() {
  const [reference, setReference] = useState<ReferenceState | null>(null)

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* MAIN PANEL */}
      <div style={{ flex: 3, overflowY: "auto", padding: "2rem" }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/modules/:moduleId"
            element={<ModulePage />}
          />
          <Route
            path="/modules/:moduleId/chapters/:chapterId"
            element={
              <ChapterPage setReference={setReference} />
            }
          />
        </Routes>
      </div>

      {/* REFERENCE PANEL */}
      <div
        style={{
          flex: 1,
          borderLeft: "1px solid #333",
          padding: "1rem",
          overflowY: "auto",
          background: "#111",
          color: "white"
        }}
      >
        <ReferencePanel
          reference={reference}
          setReference={setReference}
        />
      </div>
    </div>
  )
}

export default App
