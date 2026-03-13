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
      env: { ...env, ...(options.env || {}) },
      cwd: options.cwd || undefined
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

function writeFakeGooseBinary(dir) {
  const bin = path.join(dir, "goose")
  fs.writeFileSync(bin, [
    "#!/usr/bin/env node",
    "const args = process.argv.slice(2);",
    "if (args[0] === '--version') { console.log('goose 1.27.2-test'); process.exit(0); }",
    "if (args[0] === 'run' && args.includes('--output-format') && args.includes('stream-json')) {",
    "  console.log(JSON.stringify({ type: 'message', content: 'planning' }));",
    "  console.log(JSON.stringify({ type: 'result', ok: true }));",
    "  process.exit(0);",
    "}",
    "if (args[0] === 'run' && args.includes('--output-format') && args.includes('json')) {",
    "  if (args.includes('--text') && args[args.indexOf('--text') + 1] === 'Needs provider') {",
    "    console.error(JSON.stringify({ error: { message: \"No provider configured. Run 'goose configure' first\" } }));",
    "    process.exit(1);",
    "  }",
    "  const i = args.indexOf('--text');",
    "  console.log(JSON.stringify({ ok: true, mode: 'json', text: i >= 0 ? args[i + 1] : null, args, cwd: process.cwd() }));",
    "  process.exit(0);",
    "}",
    "if (args[0] === 'run' && args.includes('--instructions')) {",
    "  const i = args.indexOf('--instructions');",
    "  console.log(`file:${args[i + 1] || ''}`);",
    "  process.exit(0);",
    "}",
    "if (args[0] === 'run' && args.includes('--text')) {",
    "  const i = args.indexOf('--text');",
    "  console.log(`text:${args[i + 1] || ''}`);",
    "  process.exit(0);",
    "}",
    "console.log(JSON.stringify({ ok: true, args }));"
  ].join("\n"), "utf-8")
  fs.chmodSync(bin, 0o755)
  return bin
}

describe("goose plugin", () => {
  const fakeDir = fs.mkdtempSync(path.join(os.tmpdir(), "dcli-goose-"))
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), "dcli-home-goose-"))
  writeFakeGooseBinary(fakeDir)
  const env = { ...process.env, PATH: `${fakeDir}:${process.env.PATH || ""}`, SUPERCLI_HOME: tempHome }

  beforeAll(() => {
    const install = runNoServer("plugins install ./plugins/goose --on-conflict replace --json", { env })
    expect(install.ok).toBe(true)
  })

  afterAll(() => {
    runNoServer("plugins remove goose --json", { env })
    fs.rmSync(fakeDir, { recursive: true, force: true })
    fs.rmSync(tempHome, { recursive: true, force: true })
  })

  test("routes wrapped commands and passthrough", () => {
    const version = runNoServer("goose cli version --json", { env })
    expect(version.ok).toBe(true)
    expect(JSON.parse(version.output).data.raw).toBe("goose 1.27.2-test")

    const text = runNoServer("goose task text --text \"Summarize this repo\" --json", { env })
    expect(text.ok).toBe(true)
    expect(JSON.parse(text.output).data.raw).toBe("text:Summarize this repo")

    const json = runNoServer("goose task json --text \"Return JSON\" --json", { env })
    expect(json.ok).toBe(true)
    const jsonPayload = JSON.parse(json.output).data
    expect(jsonPayload.mode).toBe("json")
    expect(jsonPayload.text).toBe("Return JSON")
    expect(jsonPayload.args).toContain("--no-session")

    const file = runNoServer("goose task file --instructions ./task.txt --json", { env })
    expect(file.ok).toBe(true)
    expect(JSON.parse(file.output).data.raw).toBe("file:./task.txt")

    const passthrough = runNoServer("goose run --text \"raw mode\" --json", { env })
    expect(passthrough.ok).toBe(true)
    expect(JSON.parse(passthrough.output).command).toBe("goose.passthrough")
  })

  test("streams jsonl events and exposes learn content", () => {
    const stream = runNoServer("goose task stream --text \"Plan work\" --json", { env })
    expect(stream.ok).toBe(true)
    const lines = stream.output.split("\n").filter(Boolean).map(line => JSON.parse(line))
    expect(lines[0].command).toBe("goose.task.stream")
    expect(lines[0].data.type).toBe("message")
    expect(lines[1].data.type).toBe("result")
    expect(lines[2].data.streamed).toBe(true)
    expect(lines[2].data.event_count).toBe(2)

    const learn = runNoServer("plugins learn goose --json", { env })
    expect(learn.ok).toBe(true)
    expect(JSON.parse(learn.output).learn_markdown).toContain("Goose Quickstart")

    const doctor = runNoServer("plugins doctor goose --json", { env })
    expect(doctor.ok).toBe(true)
    expect(JSON.parse(doctor.output).checks.some(c => c.type === "binary" && c.binary === "goose" && c.ok === true)).toBe(true)
  })

  test("returns friendly escalation guidance when goose is unconfigured", () => {
    const result = runNoServer("goose task json --text \"Needs provider\" --json", { env })
    expect(result.ok).toBe(false)
    const payload = JSON.parse(result.stderr || result.output)
    expect(payload.error.message).toContain("not configured with a provider yet")
    expect(payload.error.suggestions[0]).toContain("goose configure")
    expect(payload.error.recoverable).toBe(true)
  })

  test("runs Goose task commands from the caller cwd", () => {
    const invokeDir = fs.mkdtempSync(path.join(os.tmpdir(), "dcli-goose-invoke-"))
    try {
      const result = runNoServer("goose task json --text \"Check cwd\" --json", {
        env,
        cwd: invokeDir
      })
      expect(result.ok).toBe(true)
      const payload = JSON.parse(result.output).data
      expect(payload.cwd).toBe(invokeDir)
    } finally {
      fs.rmSync(invokeDir, { recursive: true, force: true })
    }
  })
})
