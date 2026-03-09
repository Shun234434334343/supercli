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

function writeFakePulumiBinary(dir) {
  const bin = path.join(dir, "pulumi")
  fs.writeFileSync(bin, [
    "#!/usr/bin/env node",
    "const args = process.argv.slice(2);",
    "if (args[0] === 'version') { console.log('v3.160.0-test'); process.exit(0); }",
    "console.log(JSON.stringify({ ok: true, args }));"
  ].join("\n"), "utf-8")
  fs.chmodSync(bin, 0o755)
  return bin
}

describe("pulumi plugin", () => {
  const fakeDir = fs.mkdtempSync(path.join(os.tmpdir(), "dcli-pulumi-"))
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), "dcli-home-pulumi-"))
  writeFakePulumiBinary(fakeDir)
  const env = { ...process.env, PATH: `${fakeDir}:${process.env.PATH || ""}`, SUPERCLI_HOME: tempHome }

  beforeAll(() => {
    runNoServer("plugins install ./plugins/pulumi --on-conflict replace --json", { env })
  })

  afterAll(() => {
    runNoServer("plugins remove pulumi --json", { env })
    fs.rmSync(fakeDir, { recursive: true, force: true })
    fs.rmSync(tempHome, { recursive: true, force: true })
  })

  test("routes cli version wrapped command", () => {
    const r = runNoServer("pulumi cli version --json", { env })
    expect(r.ok).toBe(true)
    const data = JSON.parse(r.output)
    expect(data.command).toBe("pulumi.cli.version")
    expect(data.data.raw).toBe("v3.160.0-test")
  })

  test("supports namespace passthrough", () => {
    const r = runNoServer("pulumi stack ls --json", { env })
    expect(r.ok).toBe(true)
    const data = JSON.parse(r.output)
    expect(data.command).toBe("pulumi.passthrough")
    expect(data.data.args[0]).toBe("stack")
    expect(data.data.args[1]).toBe("ls")
    expect(data.data.args).toContain("--json")
  })

  test("doctor reports pulumi dependency as healthy", () => {
    const r = runNoServer("plugins doctor pulumi --json", { env })
    expect(r.ok).toBe(true)
    const data = JSON.parse(r.output)
    expect(data.ok).toBe(true)
    expect(data.checks.some(c => c.type === "binary" && c.binary === "pulumi" && c.ok === true)).toBe(true)
  })
})
