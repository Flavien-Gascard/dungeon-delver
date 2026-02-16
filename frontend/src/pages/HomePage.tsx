import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getModules } from "../api/client"
import type { ModuleSummary } from "../api/client"

function HomePage() {
  const [modules, setModules] = useState<ModuleSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const data = await getModules()
        setModules(data)
      } catch (err) {
        setError("Failed to load modules")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  if (loading) return <p>Loading modules...</p>
  if (error) return <p>{error}</p>

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Dungeon Delver</h1>

      <ul>
        {modules.map((mod) => (
          <li key={mod.id}>
            <Link to={`/modules/${mod.id}`}>
              {mod.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default HomePage
