#!/usr/bin/env node

const fs = require("fs")
const { spawnSync } = require("child_process")

function isExecutableAvailable(binary) {
  const result = spawnSync(binary, ["--version"], { encoding: "utf-8" })
  return !result.error && result.status === 0
}

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf-8" })

  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)

  if (result.error) {
    process.stderr.write(`${result.error.message}\n`)
    process.exit(1)
  }

  process.exit(typeof result.status === "number" ? result.status : 1)
}

function resolveRuntime() {
  if (isExecutableAvailable("uipcli")) {
    return { command: "uipcli", prefix: [] }
  }

  const dllPath = process.env.UIPCLI_DLL
  if (dllPath) {
    if (!fs.existsSync(dllPath)) {
      process.stderr.write(`UIPCLI_DLL does not exist: ${dllPath}\n`)
      process.exit(1)
    }
    if (!isExecutableAvailable("dotnet")) {
      process.stderr.write("dotnet runtime is required when UIPCLI_DLL is set.\n")
      process.exit(1)
    }
    return { command: "dotnet", prefix: [dllPath] }
  }

  process.stderr.write("UiPath CLI not found. Install a uipcli launcher or set UIPCLI_DLL to your extracted uipcli.dll path.\n")
  process.exit(1)
}

const runtime = resolveRuntime()
const args = runtime.prefix.concat(process.argv.slice(2))
run(runtime.command, args)
