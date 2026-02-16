import { Router } from "express"
import fs from "fs"
import path from "path"

import {
  readJsonFile,
  getLibraryKindPath,
  getLibraryEntityPath
} from "../services/fileService"

const router = Router()

// ------------------------------------------------------------
// GET /api/library/:kind
// List all entities of a kind
// ------------------------------------------------------------
router.get("/:kind", (req, res) => {
  try {
    const { kind } = req.params

    const kindDir = getLibraryKindPath(kind)

    if (!fs.existsSync(kindDir)) {
      return res.status(404).json({ error: "Library kind not found" })
    }

    const files = fs.readdirSync(kindDir)

    const results = files
      .map((fileName) => {
        const filePath = path.join(kindDir, fileName)
        const parsed = readJsonFile(filePath)

        if (!parsed) return null

        return {
          id: parsed.id,
          name: parsed.name
        }
      })
      .filter(Boolean)

    res.json(results)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to load library kind" })
  }
})

// ------------------------------------------------------------
// GET /api/library/:kind/:id
// Get specific entity
// ------------------------------------------------------------
router.get("/:kind/:id", (req, res) => {
  try {
    const { kind, id } = req.params

    const entityPath = getLibraryEntityPath(kind, id)
    const parsed = readJsonFile(entityPath)

    if (!parsed) {
      return res.status(404).json({ error: "Entity not found" })
    }

    res.json(parsed)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to load entity" })
  }
})

export default router
