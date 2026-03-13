#!/usr/bin/env node

const { spawnSync } = require("child_process")
const path = require("path")

const IMAGE_NAME = "dcli-squirrelscan"
const IMAGE_TAG = "0.0.38"
const FULL_IMAGE = `${IMAGE_NAME}:${IMAGE_TAG}`
const CACHE_VOLUME = "dcli-squirrelscan-cache"
const HOME_VOLUME = "dcli-squirrelscan-home"

function runDocker(args, options = {}) {
  return spawnSync("docker", args, {
    encoding: "utf-8",
    timeout: options.timeout || 180000,
    cwd: options.cwd,
    env: process.env,
  })
}

function exitWithResult(result, fallbackMessage) {
  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)

  if (result.error) {
    process.stderr.write(`${fallbackMessage}: ${result.error.message}\n`)
    process.exit(1)
  }
  process.exit(typeof result.status === "number" ? result.status : 1)
}

function ensureImage(pluginDir) {
  const inspect = runDocker(["image", "inspect", FULL_IMAGE], { timeout: 15000 })
  if (!inspect.error && inspect.status === 0) return

  const build = runDocker([
    "build",
    "--tag",
    FULL_IMAGE,
    "--file",
    path.join(pluginDir, "Dockerfile"),
    pluginDir,
  ], { cwd: pluginDir, timeout: 180000 })

  if (build.error || build.status !== 0) {
    exitWithResult(build, `Failed to build Docker image ${FULL_IMAGE}`)
  }
}

function run() {
  const pluginDir = process.env.SUPERCLI_PLUGIN_DIR || process.cwd()
  const passthroughArgs = process.argv.slice(2)

  ensureImage(pluginDir)

  const dockerArgs = [
    "run",
    "--rm",
    "--volume",
    `${HOME_VOLUME}:/root/.squirrel`,
    "--volume",
    `${CACHE_VOLUME}:/var/squirrel-cache`,
    "--env",
    "XDG_CACHE_HOME=/var/squirrel-cache",
    FULL_IMAGE,
    ...passthroughArgs,
  ]

  const result = runDocker(dockerArgs, { timeout: 180000 })
  exitWithResult(result, "Failed to run squirrelscan Docker container")
}

run()
