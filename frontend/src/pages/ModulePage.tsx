import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { getModule } from "../api/client"

interface ModuleData {
  id: string
  title: string
  description?: string
  chapters?: { id: string; title: string }[]
}

function ModulePage() {
  const { moduleId } = useParams()
  const [module, setModule] = useState<ModuleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!moduleId) return

    async function load() {
      try {
        const data = await getModule(moduleId)
        setModule(data)
      } catch (err) {
        setError("Failed to load module")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [moduleId])

  if (loading) return <p>Loading module...</p>
  if (error) return <p>{error}</p>
  if (!module) return <p>Module not found</p>

  return (
    <div style={{ padding: "2rem" }}>
      <Link to="/">← Back</Link>

      <h1>{module.title}</h1>

      {module.description && <p>{module.description}</p>}

        {module.chapters && (
        <>
            <h2>Chapters</h2>
            <ul>
            {module.chapters.map((chapter) => (
                <li key={chapter.id}>
                <Link
                    to={`/modules/${module.id}/chapters/${chapter.id}`}
                >
                    {chapter.title}
                </Link>
                </li>
            ))}
            </ul>
        </>
        )}
    </div>
  )
}

export default ModulePage
