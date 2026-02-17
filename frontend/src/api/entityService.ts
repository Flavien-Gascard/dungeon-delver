// ======================================================
// ENTITY SERVICE
// Unified entity fetching + caching layer
// ======================================================

export interface Entity {
  id: string
  name: string
  type: string
  content?: any
  tags?: string[]
}

const entityCache: Record<string, Entity> = {}

function cacheKey(moduleId: string, kind: string, id: string) {
  return `${moduleId}:${kind}:${id}`
}

export async function getEntity(
  moduleId: string,
  kind: string,
  id: string
): Promise<Entity | null> {
  const key = cacheKey(moduleId, kind, id)

  // Return cached if exists
  if (entityCache[key]) {
    return entityCache[key]
  }

  try {
    let url = ""

    if (kind === "room") {
      url = `/api/modules/${moduleId}/rooms/${id}`
    } else {
      url = `/api/library/${kind}/${id}`
    }

    const res = await fetch(url)
    if (!res.ok) return null

    const data = await res.json()

    // Normalize shape
    const entity: Entity = {
      id: data.id,
      name: data.name || data.title || data.id,
      type: kind,
      content: data.content,
      tags: data.tags || []
    }

    entityCache[key] = entity

    return entity
  } catch (err) {
    console.error("Entity fetch failed:", err)
    return null
  }
}
