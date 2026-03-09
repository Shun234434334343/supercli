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

function writeFakeAzBinary(dir) {
  const bin = path.join(dir, "az")
  fs.writeFileSync(bin, [
    "#!/usr/bin/env node",
    "const args = process.argv.slice(2);",
    "if (args[0] === 'version') { console.log(JSON.stringify({ 'azure-cli': '2.0.0-test' })); process.exit(0); }",
    "if (args[0] === 'account' && args[1] === 'show') {",
    "  console.log(JSON.stringify({ id: 'sub-123', name: 'mock-subscription', state: 'Enabled' }));",
    "  process.exit(0);",
    "}",
    "console.log(JSON.stringify({ ok: true, args }));"
  ].join("\n"), "utf-8")
  fs.chmodSync(bin, 0o755)
  return bin
}

describe("az plugin", () => {
  const fakeDir = fs.mkdtempSync(path.join(os.tmpdir(), "dcli-az-"))
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), "dcli-home-az-"))
  writeFakeAzBinary(fakeDir)
  const env = { ...process.env, PATH: `${fakeDir}:${process.env.PATH || ""}`, SUPERCLI_HOME: tempHome }

  beforeAll(() => {
    runNoServer("plugins install ./plugins/az --on-conflict replace --json", { env })
  })

  afterAll(() => {
    runNoServer("plugins remove az --json", { env })
    fs.rmSync(fakeDir, { recursive: true, force: true })
    fs.rmSync(tempHome, { recursive: true, force: true })
  })

  test("routes account show wrapped command", () => {
    const r = runNoServer("az account show --json", { env })
    expect(r.ok).toBe(true)
    const data = JSON.parse(r.output)
    expect(data.command).toBe("az.account.show")
    expect(data.data.id).toBe("sub-123")
  })

  test("supports namespace passthrough", () => {
    const r = runNoServer("az group list", { env })
    expect(r.ok).toBe(true)
    const data = JSON.parse(r.output)
    expect(data.command).toBe("az.passthrough")
    expect(data.data.args[0]).toBe("group")
    expect(data.data.args[1]).toBe("list")
  })

  test("doctor reports az dependency as healthy", () => {
    const r = runNoServer("plugins doctor az --json", { env })
    expect(r.ok).toBe(true)
    const data = JSON.parse(r.output)
    expect(data.ok).toBe(true)
    expect(data.checks.some(c => c.type === "binary" && c.binary === "az" && c.ok === true)).toBe(true)
  })
})
