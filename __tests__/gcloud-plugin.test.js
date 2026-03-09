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

function writeFakeGcloudBinary(dir) {
  const bin = path.join(dir, "gcloud")
  fs.writeFileSync(bin, [
    "#!/usr/bin/env node",
    "const args = process.argv.slice(2);",
    "if (args.includes('--version')) { console.log('Google Cloud SDK 999.0.0-test'); process.exit(0); }",
    "if (args[0] === 'auth' && args[1] === 'list' && args.includes('--format=json')) {",
    "  console.log(JSON.stringify([{ account: 'mock@example.com', status: 'ACTIVE' }]));",
    "  process.exit(0);",
    "}",
    "console.log(JSON.stringify({ ok: true, args }));"
  ].join("\n"), "utf-8")
  fs.chmodSync(bin, 0o755)
  return bin
}

describe("gcloud plugin", () => {
  const fakeDir = fs.mkdtempSync(path.join(os.tmpdir(), "dcli-gcloud-"))
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), "dcli-home-gcloud-"))
  writeFakeGcloudBinary(fakeDir)
  const env = { ...process.env, PATH: `${fakeDir}:${process.env.PATH || ""}`, SUPERCLI_HOME: tempHome }

  beforeAll(() => {
    runNoServer("plugins install ./plugins/gcloud --on-conflict replace --json", { env })
  })

  afterAll(() => {
    runNoServer("plugins remove gcloud --json", { env })
    fs.rmSync(fakeDir, { recursive: true, force: true })
    fs.rmSync(tempHome, { recursive: true, force: true })
  })

  test("routes account list wrapped command", () => {
    const r = runNoServer("gcloud account list --json", { env })
    expect(r.ok).toBe(true)
    const data = JSON.parse(r.output)
    expect(data.command).toBe("gcloud.account.list")
    expect(Array.isArray(data.data)).toBe(true)
    expect(data.data[0].account).toBe("mock@example.com")
  })

  test("supports namespace passthrough", () => {
    const r = runNoServer("gcloud projects list --format=json", { env })
    expect(r.ok).toBe(true)
    const data = JSON.parse(r.output)
    expect(data.command).toBe("gcloud.passthrough")
    expect(data.data.args[0]).toBe("projects")
    expect(data.data.args[1]).toBe("list")
    expect(data.data.args).toContain("--format=json")
  })

  test("doctor reports gcloud dependency as healthy", () => {
    const r = runNoServer("plugins doctor gcloud --json", { env })
    expect(r.ok).toBe(true)
    const data = JSON.parse(r.output)
    expect(data.ok).toBe(true)
    expect(data.checks.some(c => c.type === "binary" && c.binary === "gcloud" && c.ok === true)).toBe(true)
  })
})
