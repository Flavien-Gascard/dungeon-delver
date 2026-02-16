import fs from "fs"
import path from "path"

// Root data path
const DATA_ROOT = path.join(process.cwd(), "../data")

// ------------------------------------------------------------
// Generic JSON Reader
// ------------------------------------------------------------
export function readJsonFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return null
  }

  const raw = fs.readFileSync(filePath, "utf-8")
  return JSON.parse(raw)
}

// ------------------------------------------------------------
// Module Paths
// ------------------------------------------------------------
export function getModulePath(moduleId: string) {
  return path.join(DATA_ROOT, "modules", moduleId)
}

export function getChapterPath(moduleId: string, chapterId: string) {
  return path.join(
    getModulePath(moduleId),
    "chapters",
    `${chapterId}.json`
  )
}

export function getRoomPath(moduleId: string, roomId: string) {
  return path.join(
    getModulePath(moduleId),
    "rooms",
    `${roomId}.json`
  )
}

// ------------------------------------------------------------
// Library Paths
// ------------------------------------------------------------
export function getLibraryKindPath(kind: string) {
  return path.join(DATA_ROOT, "library", kind)
}

export function getLibraryEntityPath(kind: string, id: string) {
  return path.join(
    getLibraryKindPath(kind),
    `${id}.json`
  )
}
