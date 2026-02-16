// ------------------------------------------------------------
// Generic API helper
// ------------------------------------------------------------

async function apiFetch<T>(endpoint: string): Promise<T> {
  const response = await fetch(endpoint)

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`)
  }

  return response.json()
}

export default apiFetch


// ------------------------------------------------------------
// Module API
// ------------------------------------------------------------

export interface ModuleSummary {
  id: string
  title: string
}

export async function getModules(): Promise<ModuleSummary[]> {
  return apiFetch<ModuleSummary[]>("/api/modules")
}

export async function getModule(id: string) {
  return apiFetch(`/api/modules/${id}`)
}


export async function getChapter(
  moduleId: string,
  chapterId: string
) {
  return apiFetch(
    `/api/modules/${moduleId}/chapters/${chapterId}`
  )
}
