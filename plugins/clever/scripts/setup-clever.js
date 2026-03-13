const { spawnSync } = require("child_process")

function fail(message, code = 1) {
  console.error(message)
  process.exit(code)
}

function run() {
  console.log("Installing Clever Tools globally...")
  const result = spawnSync("npm", ["install", "-g", "clever-tools"], {
    encoding: "utf-8",
    stdio: "inherit"
  })

  if (result.error) {
    fail(`Failed to start npm: ${result.error.message}`)
  }
  if (result.status !== 0) {
    fail(`npm install failed with exit code ${result.status}`, result.status || 1)
  }

  console.log("Clever Tools installed.")
  console.log("Tip: export CLEVER_TOKEN and CLEVER_SECRET for non-interactive use.")
}

if (require.main === module) {
  run()
}
