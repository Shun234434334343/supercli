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

function writeFakeUipcliBinary(dir) {
  const bin = path.join(dir, "uipcli")
  fs.writeFileSync(bin, [
    "#!/usr/bin/env node",
    "const args = process.argv.slice(2);",
    "if (args[0] === '--version') { console.log('uipcli 25.10.0-test'); process.exit(0); }",
    "if (args[0] === 'package' && args[1] === 'pack') { console.log(JSON.stringify({ mode: 'pack', args })); process.exit(0); }",
    "if (args[0] === 'package' && args[1] === 'analyze') { console.log(JSON.stringify({ mode: 'analyze', args })); process.exit(0); }",
    "if (args[0] === 'package' && args[1] === 'deploy') { console.log(JSON.stringify({ mode: 'deploy', args })); process.exit(0); }",
    "console.log(JSON.stringify({ ok: true, args }));"
  ].join("\n"), "utf-8")
  fs.chmodSync(bin, 0o755)
  return bin
}

describe("uipathcli plugin", () => {
  const fakeDir = fs.mkdtempSync(path.join(os.tmpdir(), "dcli-uipathcli-"))
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), "dcli-home-uipathcli-"))
  writeFakeUipcliBinary(fakeDir)
  const env = { ...process.env, PATH: `${fakeDir}:${process.env.PATH || ""}`, SUPERCLI_HOME: tempHome }

  beforeAll(() => {
    runNoServer("plugins install ./plugins/uipathcli --on-conflict replace --json", { env })
  })

  afterAll(() => {
    runNoServer("plugins remove uipathcli --json", { env })
    fs.rmSync(fakeDir, { recursive: true, force: true })
    fs.rmSync(tempHome, { recursive: true, force: true })
  })

  test("routes version command", () => {
    const r = runNoServer("uipath self version --json", { env })
    expect(r.ok).toBe(true)
    const data = JSON.parse(r.output)
    expect(data.command).toBe("uipath.self.version")
    expect(data.data.raw).toBe("uipcli 25.10.0-test")
  })

  test("routes project pack wrapper", () => {
    const r = runNoServer("uipath project pack --project-path ./demo --json", { env })
    expect(r.ok).toBe(true)
    const data = JSON.parse(r.output)
    expect(data.command).toBe("uipath.project.pack")
    const payload = JSON.parse(data.data.raw)
    expect(payload.mode).toBe("pack")
    expect(payload.args).toContain("--project-path")
    expect(payload.args).toContain("./demo")
  })

  test("supports passthrough", () => {
    const r = runNoServer("uipath package analyze --project-path ./sample --json", { env })
    expect(r.ok).toBe(true)
    const data = JSON.parse(r.output)
    expect(data.command).toBe("uipath.passthrough")
    const payload = JSON.parse(data.data.raw)
    expect(payload.args).toContain("package")
    expect(payload.args).toContain("analyze")
  })

  test("doctor reports uipcli dependency as healthy", () => {
    const r = runNoServer("plugins doctor uipathcli --json", { env })
    expect(r.ok).toBe(true)
    const data = JSON.parse(r.output)
    expect(data.ok).toBe(true)
    expect(data.checks.some(c => c.type === "binary" && c.binary === "uipcli" && c.ok === true)).toBe(true)
  })
})
