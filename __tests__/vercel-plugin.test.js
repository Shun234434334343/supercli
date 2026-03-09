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

function writeFakeVercelBinary(dir) {
  const bin = path.join(dir, "vercel")
  fs.writeFileSync(bin, [
    "#!/usr/bin/env node",
    "const args = process.argv.slice(2);",
    "if (args.includes('--version')) { console.log('vercel 33.0.0'); process.exit(0); }",
    "if (args[0] === 'whoami') { console.log('mock-vercel-user'); process.exit(0); }",
    "console.log(JSON.stringify({ ok: true, args }));"
  ].join("\n"), "utf-8")
  fs.chmodSync(bin, 0o755)
  return bin
}

describe("vercel plugin", () => {
  const fakeDir = fs.mkdtempSync(path.join(os.tmpdir(), "dcli-vercel-"))
  writeFakeVercelBinary(fakeDir)
  const env = { ...process.env, PATH: `${fakeDir}:${process.env.PATH || ""}` }

  beforeAll(() => {
    runNoServer("plugins install ./plugins/vercel --on-conflict replace --json", { env })
  })

  afterAll(() => {
    runNoServer("plugins remove vercel --json", { env })
    fs.rmSync(fakeDir, { recursive: true, force: true })
  })

  test("routes account whoami wrapped command", () => {
    const r = runNoServer("vercel account whoami", { env })
    expect(r.ok).toBe(true)
    const data = JSON.parse(r.output)
    expect(data.command).toBe("vercel.account.whoami")
    expect(data.data.raw).toBe("mock-vercel-user")
  })

  test("supports namespace passthrough", () => {
    const r = runNoServer("vercel project ls", { env })
    expect(r.ok).toBe(true)
    const data = JSON.parse(r.output)
    expect(data.command).toBe("vercel.passthrough")
    expect(data.data.args[0]).toBe("project")
    expect(data.data.args[1]).toBe("ls")
  })

  test("doctor reports vercel dependency as healthy", () => {
    const r = runNoServer("plugins doctor vercel --json", { env })
    expect(r.ok).toBe(true)
    const data = JSON.parse(r.output)
    expect(data.ok).toBe(true)
    expect(data.checks.some(c => c.type === "binary" && c.binary === "vercel" && c.ok === true)).toBe(true)
  })
})
