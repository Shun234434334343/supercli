const { Router } = require("express")
const { getStorage } = require("../storage/adapter")
const { bumpVersion } = require("../services/configService")

const router = Router()

// Helper to list all commands
async function getAllCommands() {
  const storage = getStorage()
  const keys = await storage.listKeys("command:")
  const commands = await Promise.all(keys.map(k => storage.get(k)))
  return commands.sort((a, b) => a._id.localeCompare(b._id))
}

// GET /api/commands
router.get("/", async (req, res) => {
  try {
    const commands = await getAllCommands()
    if (req.query.format !== "json" && req.accepts("html") && !req.xhr && !req.headers["x-requested-with"]) {
      return res.render("commands", { commands })
    }
    res.json(commands)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/commands/new
router.get("/new", async (req, res) => {
  res.render("command-edit", { command: null })
})

// GET /api/commands/:id/edit
router.get("/:id/edit", async (req, res) => {
  try {
    const storage = getStorage()
    // id could be URL encoded if it's a natural key
    const id = decodeURIComponent(req.params.id)
    const command = await storage.get(id)
    if (!command) return res.status(404).send("Not found")
    res.render("command-edit", { command })
  } catch (err) {
    res.status(500).send(err.message)
  }
})

// POST /api/commands
router.post("/", async (req, res) => {
  try {
    const storage = getStorage()
    const { namespace, resource, action, description, adapter, adapterConfig, args } = req.body
    const key = `command:${namespace}.${resource}.${action}`
    
    // Check if exists? Overwrite is allowed for now, acts as upsert.

    const doc = {
      _id: key, // Store the key inside the document as well
      namespace,
      resource,
      action,
      description: description || "",
      adapter: adapter || "http",
      adapterConfig: typeof adapterConfig === "string" ? JSON.parse(adapterConfig || "{}") : (adapterConfig || {}),
      args: Array.isArray(args) ? args : JSON.parse(args || "[]"),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await storage.set(key, doc)
    await bumpVersion()
    
    if (req.headers["content-type"]?.includes("urlencoded")) {
      return res.redirect("/api/commands")
    }
    res.status(201).json(doc)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/commands/:id
router.put("/:id", async (req, res) => {
  try {
    const storage = getStorage()
    const id = decodeURIComponent(req.params.id)
    const { namespace, resource, action, description, adapter, adapterConfig, args } = req.body
    
    // If n/r/a changed, the ID changes, we should delete the old one.
    const newKey = `command:${namespace}.${resource}.${action}`
    if (newKey !== id) {
      await storage.delete(id)
    }

    const update = {
      _id: newKey,
      namespace,
      resource,
      action,
      description: description || "",
      adapter: adapter || "http",
      adapterConfig: typeof adapterConfig === "string" ? JSON.parse(adapterConfig || "{}") : (adapterConfig || {}),
      args: Array.isArray(args) ? args : JSON.parse(args || "[]"),
      updatedAt: new Date()
    }
    await storage.set(newKey, update)
    await bumpVersion()
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/commands/:id
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
