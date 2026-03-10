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

function writeFakeMongoshBinary(dir) {
  const bin = path.join(dir, "mongosh")
  fs.writeFileSync(bin, [
    "#!/usr/bin/env node",
    "const args = process.argv.slice(2);",
    "if (args[0] === '--version') { console.log('2.3.9-test'); process.exit(0); }",
    "const evalIndex = args.indexOf('--eval');",
    "if (evalIndex >= 0) {",
    "  const script = args[evalIndex + 1];",
    "  if (script === 'db.adminCommand({ ping: 1 })') {",
    "    console.log(JSON.stringify({ ok: 1 }));",
    "    process.exit(0);",
    "  }",
    "  console.log(JSON.stringify({ ok: 1, script }));",
    "  process.exit(0);",
    "}",
    "console.log(JSON.stringify({ ok: true, args }));"
  ].join("\n"), "utf-8")
  fs.chmodSync(bin, 0o755)
  return bin
}

describe("mongosh plugin", () => {
  const fakeDir = fs.mkdtempSync(path.join(os.tmpdir(), "dcli-mongosh-"))
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), "dcli-home-mongosh-"))
  writeFakeMongoshBinary(fakeDir)
  const env = { ...process.env, PATH: `${fakeDir}:${process.env.PATH || ""}`, SUPERCLI_HOME: tempHome }

  beforeAll(() => {
    runNoServer("plugins install ./plugins/mongosh --on-conflict replace --json", { env })
  })

  afterAll(() => {
    runNoServer("plugins remove mongosh --json", { env })
    fs.rmSync(fakeDir, { recursive: true, force: true })
    fs.rmSync(tempHome, { recursive: true, force: true })
  })

  test("routes cli version wrapped command", () => {
    const r = runNoServer("mongosh cli version --json", { env })
    expect(r.ok).toBe(true)
    const data = JSON.parse(r.output)
    expect(data.command).toBe("mongosh.cli.version")
    expect(data.data.raw).toBe("2.3.9-test")
  })

  test("routes server ping wrapped command", () => {
    const r = runNoServer("mongosh server ping --host 127.0.0.1 --port 27017 --json", { env })
    expect(r.ok).toBe(true)
    const data = JSON.parse(r.output)
    expect(data.command).toBe("mongosh.server.ping")
    expect(data.data.ok).toBe(1)
  })

  test("routes eval run wrapped command", () => {
    const r = runNoServer("mongosh eval run --javascript \"db.runCommand({ buildInfo: 1 })\" --json", { env })
    expect(r.ok).toBe(true)
    const data = JSON.parse(r.output)
    expect(data.command).toBe("mongosh.eval.run")
    expect(data.data.script).toBe("db.runCommand({ buildInfo: 1 })")
  })

  test("supports namespace passthrough", () => {
    const r = runNoServer("mongosh --help --json", { env })
    expect(r.ok).toBe(true)
    const data = JSON.parse(r.output)
    expect(data.command).toBe("mongosh.passthrough")
    expect(data.data.args).toContain("--help")
    expect(data.data.args).toContain("--json")
  })

  test("doctor reports mongosh dependency as healthy", () => {
    const r = runNoServer("plugins doctor mongosh --json", { env })
    expect(r.ok).toBe(true)
    const data = JSON.parse(r.output)
    expect(data.ok).toBe(true)
    expect(data.checks.some(c => c.type === "binary" && c.binary === "mongosh" && c.ok === true)).toBe(true)
  })
})
