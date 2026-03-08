const { Router } = require("express")
const { getStorage } = require("../storage/adapter")
const { bumpVersion } = require("../services/configService")

const router = Router()

async function getAllMCPs() {
  const storage = getStorage()
  const keys = await storage.listKeys("mcp:")
  const servers = await Promise.all(keys.map(k => storage.get(k)))
  return servers.sort((a, b) => a.name.localeCompare(b.name))
}

// GET /api/mcp
router.get("/", async (req, res) => {
  try {
    const servers = await getAllMCPs()
    if (req.query.format !== "json" && req.accepts("html") && !req.xhr && !req.headers["x-requested-with"]) {
      return res.render("mcp", { servers })
    }
    res.json(servers)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/mcp
router.post("/", async (req, res) => {
  try {
    const storage = getStorage()
    const { name, url } = req.body
    const key = `mcp:${name}`
    const doc = { _id: key, name, url, createdAt: new Date() }
    await storage.set(key, doc)
    await bumpVersion()
    if (req.headers["content-type"]?.includes("urlencoded")) {
      return res.redirect("/api/mcp")
    }
    res.status(201).json(doc)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/mcp/:id
router.put("/:id", async (req, res) => {
  try {
    const storage = getStorage()
    const id = decodeURIComponent(req.params.id)
    const { name, url } = req.body
    
    const newKey = `mcp:${name}`
    if (newKey !== id) {
      await storage.delete(id)
    }

    const doc = { _id: newKey, name, url }
    await storage.set(newKey, doc)
    await bumpVersion()
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/mcp/:id
router.delete("/:id", async (req, res) => {
  try {
    const storage = getStorage()
    const id = decodeURIComponent(req.params.id)
    await storage.delete(id)
    await bumpVersion()
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
