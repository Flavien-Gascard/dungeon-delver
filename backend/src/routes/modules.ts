import { Router } from "express"
import fs from "fs"
import path from "path"

import {
  readJsonFile,
  getModulePath,
  getChapterPath,
  getRoomPath
} from "../services/fileService"

const router = Router()

// ------------------------------------------------------------
// GET /api/modules
// List all modules
// ------------------------------------------------------------
router.get("/", (req, res) => {
  try {
    const modulesRoot = path.join(process.cwd(), "../data/modules")

    if (!fs.existsSync(modulesRoot)) {
      return res.json([])
    }

    const moduleFolders = fs.readdirSync(modulesRoot)

    const results = moduleFolders
      .map((folderName) => {
        const modulePath = path.join(modulesRoot, folderName, "module.json")
        const parsed = readJsonFile(modulePath)

        if (!parsed) return null

        return {
          id: parsed.id,
          title: parsed.title
        }
      })
      .filter(Boolean)

    res.json(results)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to load modules" })
  }
})

// ------------------------------------------------------------
// GET /api/modules/:id
// Get module metadata
// ------------------------------------------------------------
router.get("/:id", (req, res) => {
  try {
    const { id } = req.params

    const modulePath = path.join(getModulePath(id), "module.json")
    const parsed = readJsonFile(modulePath)

    if (!parsed) {
      return res.status(404).json({ error: "Module not found" })
    }

    res.json(parsed)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to load module" })
  }
})

// ------------------------------------------------------------
// GET /api/modules/:id/chapters
// List chapters for module
// ------------------------------------------------------------
router.get("/:id/chapters", (req, res) => {
  try {
    const { id } = req.params

    const chaptersDir = path.join(getModulePath(id), "chapters")

    if (!fs.existsSync(chaptersDir)) {
      return res.status(404).json({ error: "Chapters not found" })
    }

    const chapterFiles = fs.readdirSync(chaptersDir)

    const chapters = chapterFiles
      .map((fileName) => {
        const filePath = path.join(chaptersDir, fileName)
        const parsed = readJsonFile(filePath)

        if (!parsed) return null

        return {
          id: parsed.id,
          title: parsed.title
        }
      })
      .filter(Boolean)

    res.json(chapters)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to load chapters" })
  }
})

// ------------------------------------------------------------
// GET /api/modules/:id/chapters/:chapterId
// Get specific chapter
// ------------------------------------------------------------
router.get("/:id/chapters/:chapterId", (req, res) => {
  try {
    const { id, chapterId } = req.params

    const chapterPath = getChapterPath(id, chapterId)
    const parsed = readJsonFile(chapterPath)

    if (!parsed) {
      return res.status(404).json({ error: "Chapter not found" })
    }

    res.json(parsed)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to load chapter" })
  }
})

// ------------------------------------------------------------
// GET /api/modules/:id/rooms/:roomId
// Get specific room
// ------------------------------------------------------------
router.get("/:id/rooms/:roomId", (req, res) => {
  try {
    const { id, roomId } = req.params

    const roomPath = getRoomPath(id, roomId)
    const parsed = readJsonFile(roomPath)

    if (!parsed) {
      return res.status(404).json({ error: "Room not found" })
    }

    res.json(parsed)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to load room" })
  }
})

export default router
