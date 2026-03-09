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

function writeFakeGhBinary(dir) {
  const bin = path.join(dir, "gh")
  fs.writeFileSync(bin, [
    "#!/usr/bin/env node",
    "const args = process.argv.slice(2);",
    "if (args.includes('--version')) { console.log('gh version 2.0.0-test'); process.exit(0); }",
    "if (args[0] === 'auth' && args[1] === 'status' && args.includes('--json')) {",
    "  console.log(JSON.stringify({ hosts: [{ hostname: 'github.com', status: 'logged_in', active: true }] }));",
    "  process.exit(0);",
    "}",
    "console.log(JSON.stringify({ ok: true, args }));"
  ].join("\n"), "utf-8")
  fs.chmodSync(bin, 0o755)
  return bin
}

describe("gh plugin", () => {
  const fakeDir = fs.mkdtempSync(path.join(os.tmpdir(), "dcli-gh-"))
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), "dcli-home-gh-"))
  writeFakeGhBinary(fakeDir)
  const env = { ...process.env, PATH: `${fakeDir}:${process.env.PATH || ""}`, SUPERCLI_HOME: tempHome }

  beforeAll(() => {
    runNoServer("plugins install ./plugins/gh --on-conflict replace --json", { env })
  })

  afterAll(() => {
    runNoServer("plugins remove gh --json", { env })
    fs.rmSync(fakeDir, { recursive: true, force: true })
    fs.rmSync(tempHome, { recursive: true, force: true })
  })

  test("routes account status wrapped command", () => {
    const r = runNoServer("gh account status --json", { env })
    expect(r.ok).toBe(true)
    const data = JSON.parse(r.output)
    expect(data.command).toBe("gh.account.status")
    expect(Array.isArray(data.data.hosts)).toBe(true)
    expect(data.data.hosts[0].hostname).toBe("github.com")
  })

  test("supports namespace passthrough", () => {
    const r = runNoServer("gh repo list --limit 1 --json name", { env })
    expect(r.ok).toBe(true)
    const data = JSON.parse(r.output)
    expect(data.command).toBe("gh.passthrough")
    expect(data.data.args[0]).toBe("repo")
    expect(data.data.args[1]).toBe("list")
    expect(data.data.args).toContain("--json")
  })

  test("doctor reports gh dependency as healthy", () => {
    const r = runNoServer("plugins doctor gh --json", { env })
    expect(r.ok).toBe(true)
    const data = JSON.parse(r.output)
    expect(data.ok).toBe(true)
    expect(data.checks.some(c => c.type === "binary" && c.binary === "gh" && c.ok === true)).toBe(true)
  })
})
