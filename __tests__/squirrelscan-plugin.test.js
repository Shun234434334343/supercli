const fs = require("fs")
const os = require("os")
const path = require("path")
const { execSync } = require("child_process")

const CLI = path.join(__dirname, "..", "cli", "supercli.js")

function runNoServer(args, options = {}) {
  try {
    const env = { ...process.env }
    delete env.SUPERCLI_SERVER
    const out = execSync(`node ${CLI} ${args}`, {
      encoding: "utf-8",
      timeout: 15000,
      env: { ...env, ...(options.env || {}) }
    })
    return { ok: true, output: out.trim(), code: 0 }
  } catch (err) {
    return {
      ok: false,
      output: (err.stdout || "").trim(),
      stderr: (err.stderr || "").trim(),
      code: err.status
    }
  }
}

function writeFakeDockerBinary(dir) {
  const bin = path.join(dir, "docker")
  const statePath = path.join(dir, "docker-state.json")
  fs.writeFileSync(bin, [
    "#!/usr/bin/env node",
    "const fs = require('fs');",
    "const path = require('path');",
    "const args = process.argv.slice(2);",
    "const statePath = path.join(__dirname, 'docker-state.json');",
    "const state = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf-8')) : { built: false, buildCount: 0 };",
    "const save = () => fs.writeFileSync(statePath, JSON.stringify(state));",
    "if (args.includes('--version')) { console.log('Docker version 26.1.0, build test'); process.exit(0); }",
    "if (args[0] === 'image' && args[1] === 'inspect') { process.exit(state.built ? 0 : 1); }",
    "if (args[0] === 'build') { state.built = true; state.buildCount += 1; save(); console.log('build ok'); process.exit(0); }",
    "if (args[0] === 'run') { console.log(JSON.stringify({ ok: true, args })); process.exit(0); }",
    "console.log(JSON.stringify({ ok: true, args }));"
  ].join("\n"), "utf-8")
  fs.chmodSync(bin, 0o755)
  return statePath
}

describe("squirrelscan plugin", () => {
  const fakeDir = fs.mkdtempSync(path.join(os.tmpdir(), "dcli-squirrelscan-"))
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), "dcli-home-squirrelscan-"))
  const fakeUserHome = fs.mkdtempSync(path.join(os.tmpdir(), "dcli-user-home-squirrelscan-"))
  const statePath = writeFakeDockerBinary(fakeDir)
  const env = {
    ...process.env,
    PATH: `${fakeDir}:${process.env.PATH || ""}`,
    SUPERCLI_HOME: tempHome,
    HOME: fakeUserHome,
  }

  beforeAll(() => {
    runNoServer("plugins install ./plugins/squirrelscan --on-conflict replace --json", { env })
  })

  afterAll(() => {
    runNoServer("plugins remove squirrelscan --json", { env })
    fs.rmSync(fakeDir, { recursive: true, force: true })
    fs.rmSync(tempHome, { recursive: true, force: true })
    fs.rmSync(fakeUserHome, { recursive: true, force: true })
  })

  test("runs squirrel audit in docker with passthrough args", () => {
    const r = runNoServer("squirrel audit https://example.com -C quick --json", { env })
    expect(r.ok).toBe(true)

    const payload = JSON.parse(r.output)
    expect(payload.command).toBe("squirrel.passthrough")

    const dockerPayload = JSON.parse(payload.data.raw)
    expect(dockerPayload.args[0]).toBe("run")
    expect(dockerPayload.args).toContain("dcli-squirrelscan:0.0.38")
    expect(dockerPayload.args).toContain("audit")
    expect(dockerPayload.args).toContain("https://example.com")
    expect(dockerPayload.args).toContain("-C")
    expect(dockerPayload.args).toContain("quick")
    expect(dockerPayload.args).toContain("dcli-squirrelscan-home:/root/.squirrel")
  })

  test("routes structured audit command to squirrel audit", () => {
    const r = runNoServer("squirrel audit run --url https://example.com --coverage quick --json", { env })
    expect(r.ok).toBe(true)

    const payload = JSON.parse(r.output)
    expect(payload.command).toBe("squirrel.audit.run")

    const dockerPayload = JSON.parse(payload.data.raw)
    expect(dockerPayload.args).toContain("audit")
    expect(dockerPayload.args).toContain("https://example.com")
    expect(dockerPayload.args).toContain("--coverage")
    expect(dockerPayload.args).toContain("quick")
  })

  test("exposes learn content for agents", () => {
    const r = runNoServer("plugins learn squirrelscan --json", { env })
    expect(r.ok).toBe(true)
    const payload = JSON.parse(r.output)
    expect(payload.plugin).toBe("squirrelscan")
    expect(payload.learn_markdown).toContain("SquirrelScan Quickstart")
  })

  test("registers squirrelscan skills provider in catalog", () => {
    const r = runNoServer("skills list --catalog --provider squirrelscan --json", { env })
    expect(r.ok).toBe(true)
    const payload = JSON.parse(r.output)
    expect(Array.isArray(payload.skills)).toBe(true)
    expect(payload.skills.some(skill => skill.id === "squirrelscan:quickstart")).toBe(true)
  })

  test("builds image once and reuses on subsequent runs", () => {
    const first = runNoServer("squirrel audit https://example.com -C quick --json", { env })
    const second = runNoServer("squirrel audit https://example.com -C quick --json", { env })

    expect(first.ok).toBe(true)
    expect(second.ok).toBe(true)

    const state = JSON.parse(fs.readFileSync(statePath, "utf-8"))
    expect(state.buildCount).toBe(1)
  })
})
