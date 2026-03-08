const { Router } = require("express")
const { getStorage } = require("../storage/adapter")
const { createPlan } = require("../../cli/planner")

const router = Router()

// POST /api/plans — create a plan
router.post("/", async (req, res) => {
  try {
    const storage = getStorage()
    const { command, args, cmd } = req.body

    let planCmd = cmd
    if (!planCmd) {
      // Resolve command from DB
      const [namespace, resource, action] = command.split(".")
      planCmd = await storage.get(`command:${namespace}.${resource}.${action}`)
      if (!planCmd) return res.status(404).json({ error: "Command not found" })
    }

    const plan = createPlan(planCmd, args || {})
    
    // Auto-expiry for file storage logic could go here, but for now we just store it
    await storage.set(`plan:${plan.plan_id}`, plan)
    res.status(201).json(plan)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/plans — list recent plans
router.get("/", async (req, res) => {
  try {
    const storage = getStorage()
    const keys = await storage.listKeys("plan:")
    const plans = await Promise.all(keys.map(k => storage.get(k)))
    
    // Sort descending by created_at and limit to 50
    const sorted = plans
      .filter(p => !!p)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 50)
      
    res.json(sorted)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/plans/:id — inspect plan
router.get("/:id", async (req, res) => {
  try {
    const storage = getStorage()
    const id = decodeURIComponent(req.params.id)
    const plan = await storage.get(`plan:${id}`)
    if (!plan) return res.status(404).json({ error: "Plan not found" })
    res.json(plan)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/plans/:id/execute — execute a stored plan
router.post("/:id/execute", async (req, res) => {
  try {
    const storage = getStorage()
    const id = decodeURIComponent(req.params.id)
    const plan = await storage.get(`plan:${id}`)
    if (!plan) return res.status(404).json({ error: "Plan not found" })
    if (plan.status !== "planned") {
      return res.status(400).json({ error: `Plan status is '${plan.status}', expected 'planned'` })
    }

    // Resolve command
    const [namespace, resource, action] = plan.command.split(".")
    const cmd = await storage.get(`command:${namespace}.${resource}.${action}`)
    if (!cmd) return res.status(404).json({ error: "Command no longer exists" })

    // Execute via adapter
    const { execute } = require("../../cli/executor")
    const start = Date.now()
    let result, status = "success"
    try {
      result = await execute(cmd, plan.args || {}, { server: `http://localhost:${process.env.PORT || 3000}` })
    } catch (err) {
      result = { error: err.message }
      status = "failed"
    }
    const duration = Date.now() - start

    // Update plan status
    plan.status = status
    plan.executed_at = new Date().toISOString()
    plan.duration_ms = duration
    await storage.set(`plan:${id}`, plan)

    // Record job
    const jobId = `job:${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    await storage.set(jobId, {
      _id: jobId,
      command: plan.command,
      plan_id: plan.plan_id,
      args: plan.args,
      status,
      duration_ms: duration,
      timestamp: new Date().toISOString()
    })

    res.json({
      version: "1.0",
      plan_id: plan.plan_id,
      command: plan.command,
      status,
      duration_ms: duration,
      data: result
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/plans/:id — cancel plan
router.delete("/:id", async (req, res) => {
  try {
    const storage = getStorage()
    const id = decodeURIComponent(req.params.id)
    await storage.delete(`plan:${id}`)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
