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

function writeFakeTerraformBinary(dir) {
  const bin = path.join(dir, "terraform")
  fs.writeFileSync(bin, [
    "#!/usr/bin/env node",
    "const args = process.argv.slice(2);",
    "if (args[0] === 'version' && args.includes('-json')) {",
    "  console.log(JSON.stringify({ terraform_version: '1.9.0-test', platform: 'linux_amd64' }));",
    "  process.exit(0);",
    "}",
    "console.log(JSON.stringify({ ok: true, args }));"
  ].join("\n"), "utf-8")
  fs.chmodSync(bin, 0o755)
  return bin
}

describe("terraform plugin", () => {
  const fakeDir = fs.mkdtempSync(path.join(os.tmpdir(), "dcli-terraform-"))
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), "dcli-home-terraform-"))
  writeFakeTerraformBinary(fakeDir)
  const env = { ...process.env, PATH: `${fakeDir}:${process.env.PATH || ""}`, SUPERCLI_HOME: tempHome }

  beforeAll(() => {
    runNoServer("plugins install ./plugins/terraform --on-conflict replace --json", { env })
  })

  afterAll(() => {
    runNoServer("plugins remove terraform --json", { env })
    fs.rmSync(fakeDir, { recursive: true, force: true })
    fs.rmSync(tempHome, { recursive: true, force: true })
  })

  test("routes cli version wrapped command", () => {
    const r = runNoServer("terraform cli version --json", { env })
    expect(r.ok).toBe(true)
    const data = JSON.parse(r.output)
    expect(data.command).toBe("terraform.cli.version")
    expect(data.data.terraform_version).toBe("1.9.0-test")
  })

  test("supports namespace passthrough", () => {
    const r = runNoServer("terraform output -json", { env })
    expect(r.ok).toBe(true)
    const data = JSON.parse(r.output)
    expect(data.command).toBe("terraform.passthrough")
    expect(data.data.args[0]).toBe("output")
    expect(data.data.args).toContain("-json")
  })

  test("doctor reports terraform dependency as healthy", () => {
    const r = runNoServer("plugins doctor terraform --json", { env })
    expect(r.ok).toBe(true)
    const data = JSON.parse(r.output)
    expect(data.ok).toBe(true)
    expect(data.checks.some(c => c.type === "binary" && c.binary === "terraform" && c.ok === true)).toBe(true)
  })
})
