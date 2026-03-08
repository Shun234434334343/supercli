const { spawn } = require("child_process")

function toCliFlags(flags) {
  const args = []
  for (const [k, v] of Object.entries(flags)) {
    if (["human", "json", "compact"].includes(k) || k.startsWith("__")) continue
    if (v === true) args.push(`--${k}`)
    else args.push(`--${k}`, String(v))
  }
  return args
}

async function execute(cmd, flags) {
  const cfg = cmd.adapterConfig || {}
  const binary = cfg.command
  if (!binary) throw new Error("Process adapter requires adapterConfig.command")

  const baseArgs = Array.isArray(cfg.baseArgs) ? cfg.baseArgs.slice() : []
  const passthroughMode = cfg.passthrough === true
  const positionalNames = Array.isArray(cfg.positionalArgs) ? cfg.positionalArgs : []
  const parsedAsJson = cfg.parseJson !== false
  const includeJsonFlag = cfg.jsonFlag || null
  const timeoutMs = Number(cfg.timeout_ms) > 0 ? Number(cfg.timeout_ms) : 15000

  const remainingFlags = { ...flags }
  const args = [...baseArgs]

  if (passthroughMode) {
    const passthroughArgs = Array.isArray(flags.__rawArgs) ? flags.__rawArgs : []
    args.push(...passthroughArgs)
  } else {
    for (const name of positionalNames) {
      if (remainingFlags[name] !== undefined) {
        args.push(String(remainingFlags[name]))
        delete remainingFlags[name]
      }
    }

    if (includeJsonFlag) args.push(includeJsonFlag)
    args.push(...toCliFlags(remainingFlags))
  }

  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, { stdio: ["ignore", "pipe", "pipe"] })
    let out = ""
    let err = ""
    let settled = false

    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      child.kill("SIGTERM")
      reject(Object.assign(new Error(`Process command timed out after ${timeoutMs}ms`), {
        code: 105,
        type: "integration_error",
        recoverable: true
      }))
    }, timeoutMs)

    child.stdout.setEncoding("utf-8")
    child.stderr.setEncoding("utf-8")
    child.stdout.on("data", chunk => { out += chunk })
    child.stderr.on("data", chunk => { err += chunk })

    child.on("error", e => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (e && e.code === "ENOENT") {
        const help = cfg.missingDependencyHelp || `Run: dcli plugins doctor`
        reject(Object.assign(new Error(`Missing dependency '${binary}'. ${help}`), {
          code: 85,
          type: "invalid_argument",
          recoverable: false
        }))
        return
      }
      reject(Object.assign(new Error(`Failed to start process adapter: ${e.message}`), {
        code: 105,
        type: "integration_error",
        recoverable: true
      }))
    })

    child.on("close", code => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (code !== 0) {
        reject(Object.assign(new Error(`Process adapter failed (${binary} ${args.join(" ")}): ${err.trim()}`), {
          code: 105,
          type: "integration_error",
          recoverable: true
        }))
        return
      }

      const text = out.trim()
      if (!parsedAsJson) {
        resolve({ raw: text })
        return
      }
      try {
        resolve(text ? JSON.parse(text) : {})
      } catch {
        resolve({ raw: text })
      }
    })
  })
}

module.exports = { execute }
