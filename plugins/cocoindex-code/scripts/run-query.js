const fs = require("fs")
const path = require("path")
const { spawnSync } = require("child_process")

function resolvePythonFromLauncher() {
  const which = spawnSync("which", ["cocoindex-code"], { encoding: "utf-8", timeout: 3000 })
  if (which.error || which.status !== 0) {
    throw new Error("Could not locate 'cocoindex-code' in PATH")
  }

  const launcher = (which.stdout || "").trim()
  const firstLine = fs.readFileSync(launcher, "utf-8").split("\n", 1)[0] || ""
  if (!firstLine.startsWith("#!")) {
    throw new Error("Could not resolve cocoindex-code Python interpreter from launcher")
  }

  return firstLine.slice(2).trim()
}

function run() {
  const python = resolvePythonFromLauncher()
  const script = path.resolve(__dirname, "query.py")
  const args = process.argv.slice(2)
  const result = spawnSync(python, [script, ...args], {
    encoding: "utf-8",
    timeout: 300000,
    env: process.env,
  })

  if (result.error) {
    throw result.error
  }

  if (result.stdout) process.stdout.write(result.stdout)
  if (result.status !== 0) {
    if (result.stderr) process.stderr.write(result.stderr)
    process.exit(result.status || 1)
  }
}

if (require.main === module) {
  try {
    run()
  } catch (err) {
    process.stderr.write(err.message)
    process.exit(1)
  }
}

module.exports = { run, resolvePythonFromLauncher }
