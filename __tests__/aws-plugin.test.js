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

function writeFakeAwsBinary(dir) {
  const bin = path.join(dir, "aws")
  fs.writeFileSync(bin, [
    "#!/usr/bin/env node",
    "const args = process.argv.slice(2);",
    "if (args.includes('--version')) { console.log('aws-cli/2.0.0-test Python/3.11'); process.exit(0); }",
    "if (args[0] === 'sts' && args[1] === 'get-caller-identity') {",
    "  console.log(JSON.stringify({ Account: '123456789012', Arn: 'arn:aws:iam::123456789012:user/mock', UserId: 'AIDTEST' }));",
    "  process.exit(0);",
    "}",
    "console.log(JSON.stringify({ ok: true, args }));"
  ].join("\n"), "utf-8")
  fs.chmodSync(bin, 0o755)
  return bin
}

describe("aws plugin", () => {
  const fakeDir = fs.mkdtempSync(path.join(os.tmpdir(), "dcli-aws-"))
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), "dcli-home-aws-"))
  writeFakeAwsBinary(fakeDir)
  const env = { ...process.env, PATH: `${fakeDir}:${process.env.PATH || ""}`, SUPERCLI_HOME: tempHome }

  beforeAll(() => {
    runNoServer("plugins install ./plugins/aws --on-conflict replace --json", { env })
  })

  afterAll(() => {
    runNoServer("plugins remove aws --json", { env })
    fs.rmSync(fakeDir, { recursive: true, force: true })
    fs.rmSync(tempHome, { recursive: true, force: true })
  })

  test("routes account identity wrapped command", () => {
    const r = runNoServer("aws account identity --json", { env })
    expect(r.ok).toBe(true)
    const data = JSON.parse(r.output)
    expect(data.command).toBe("aws.account.identity")
    expect(data.data.Account).toBe("123456789012")
  })

  test("supports namespace passthrough", () => {
    const r = runNoServer("aws s3api list-buckets", { env })
    expect(r.ok).toBe(true)
    const data = JSON.parse(r.output)
    expect(data.command).toBe("aws.passthrough")
    expect(data.data.args[0]).toBe("s3api")
    expect(data.data.args[1]).toBe("list-buckets")
  })

  test("doctor reports aws dependency as healthy", () => {
    const r = runNoServer("plugins doctor aws --json", { env })
    expect(r.ok).toBe(true)
    const data = JSON.parse(r.output)
    expect(data.ok).toBe(true)
    expect(data.checks.some(c => c.type === "binary" && c.binary === "aws" && c.ok === true)).toBe(true)
  })
})
