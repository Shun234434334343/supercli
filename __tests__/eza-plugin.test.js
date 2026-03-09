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

function writeFakeEzaBinary(dir) {
  const bin = path.join(dir, "eza")
  fs.writeFileSync(bin, [
    "#!/usr/bin/env node",
    "const args = process.argv.slice(2);",
    "if (args[0] === '--version') { console.log('eza 0.23.4-test'); process.exit(0); }",
    "console.log(JSON.stringify({ ok: true, args }));"
  ].join("\n"), "utf-8")
  fs.chmodSync(bin, 0o755)
  return bin
}

describe("eza plugin", () => {
  const fakeDir = fs.mkdtempSync(path.join(os.tmpdir(), "dcli-eza-"))
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), "dcli-home-eza-"))
  writeFakeEzaBinary(fakeDir)
  const env = { ...process.env, PATH: `${fakeDir}:${process.env.PATH || ""}`, SUPERCLI_HOME: tempHome }

  beforeAll(() => {
    runNoServer("plugins install ./plugins/eza --on-conflict replace --json", { env })
  })

  afterAll(() => {
    runNoServer("plugins remove eza --json", { env })
    fs.rmSync(fakeDir, { recursive: true, force: true })
    fs.rmSync(tempHome, { recursive: true, force: true })
  })

  test("routes cli version wrapped command", () => {
    const r = runNoServer("eza cli version --json", { env })
    expect(r.ok).toBe(true)
    const data = JSON.parse(r.output)
    expect(data.command).toBe("eza.cli.version")
    expect(data.data.raw).toBe("eza 0.23.4-test")
  })

  test("supports namespace passthrough", () => {
    const r = runNoServer("eza --oneline --color=never --json", { env })
    expect(r.ok).toBe(true)
    const data = JSON.parse(r.output)
    expect(data.command).toBe("eza.passthrough")
    expect(data.data.args).toContain("--oneline")
    expect(data.data.args).toContain("--color=never")
    expect(data.data.args).toContain("--json")
  })

  test("doctor reports eza dependency as healthy", () => {
    const r = runNoServer("plugins doctor eza --json", { env })
    expect(r.ok).toBe(true)
    const data = JSON.parse(r.output)
    expect(data.ok).toBe(true)
    expect(data.checks.some(c => c.type === "binary" && c.binary === "eza" && c.ok === true)).toBe(true)
  })
})
