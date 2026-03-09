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

function writeFakeUvBinary(dir) {
  const bin = path.join(dir, "uv")
  fs.writeFileSync(bin, [
    "#!/usr/bin/env node",
    "const args = process.argv.slice(2);",
    "if (args[0] === '--version') { console.log('uv 0.6.5-test'); process.exit(0); }",
    "console.log(JSON.stringify({ ok: true, args }));"
  ].join("\n"), "utf-8")
  fs.chmodSync(bin, 0o755)
  return bin
}

describe("uv plugin", () => {
  const fakeDir = fs.mkdtempSync(path.join(os.tmpdir(), "dcli-uv-"))
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), "dcli-home-uv-"))
  writeFakeUvBinary(fakeDir)
  const env = { ...process.env, PATH: `${fakeDir}:${process.env.PATH || ""}`, SUPERCLI_HOME: tempHome }

  beforeAll(() => {
    runNoServer("plugins install ./plugins/uv --on-conflict replace --json", { env })
  })

  afterAll(() => {
    runNoServer("plugins remove uv --json", { env })
    fs.rmSync(fakeDir, { recursive: true, force: true })
    fs.rmSync(tempHome, { recursive: true, force: true })
  })

  test("routes cli version wrapped command", () => {
    const r = runNoServer("uv cli version --json", { env })
    expect(r.ok).toBe(true)
    const data = JSON.parse(r.output)
    expect(data.command).toBe("uv.cli.version")
    expect(data.data.raw).toBe("uv 0.6.5-test")
  })

  test("supports namespace passthrough", () => {
    const r = runNoServer("uv python list --json", { env })
    expect(r.ok).toBe(true)
    const data = JSON.parse(r.output)
    expect(data.command).toBe("uv.passthrough")
    expect(data.data.args[0]).toBe("python")
    expect(data.data.args[1]).toBe("list")
    expect(data.data.args).toContain("--json")
  })

  test("doctor reports uv dependency as healthy", () => {
    const r = runNoServer("plugins doctor uv --json", { env })
    expect(r.ok).toBe(true)
    const data = JSON.parse(r.output)
    expect(data.ok).toBe(true)
    expect(data.checks.some(c => c.type === "binary" && c.binary === "uv" && c.ok === true)).toBe(true)
  })
})
