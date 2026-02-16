import express from "express"
import cors from "cors"
import modulesRouter from "./routes/modules"
import libraryRouter from "./routes/library"


const app = express()

app.use(cors())
app.use(express.json())

app.get("/", (req, res) => {
  res.json({ status: "Dungeon Delver API running" })
})


app.use("/api/modules", modulesRouter)
app.use("/api/library", libraryRouter)


app.listen(4000, () => {
  console.log("Backend running on http://localhost:4000")
})
