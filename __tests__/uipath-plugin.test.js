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

function writeFakeUipcliBinary(dir) {
  const bin = path.join(dir, "uipcli")
  fs.writeFileSync(bin, [
    "#!/usr/bin/env node",
    "const args = process.argv.slice(2);",
    "if (args[0] === '--version') { console.log('uipcli 25.10.3-test'); process.exit(0); }",
    "if (args[0] === 'package' && args[1] === 'deploy') {",
    "  const pathArg = args[2] || null;",
    "  const appIdIndex = args.indexOf('--applicationId');",
    "  const appId = appIdIndex >= 0 ? args[appIdIndex + 1] : null;",
    "  console.log(JSON.stringify({ mode: 'deploy', path: pathArg, appId, args }));",
    "  process.exit(0);",
    "}",
    "if (args[0] === 'orchestrator' && args[1] === 'folders' && args[2] === 'list') {",
    "  console.log(JSON.stringify({ folders: [{ id: 1, name: 'Shared' }] }));",
    "  process.exit(0);",
    "}",
    "console.log(JSON.stringify({ ok: true, args }));"
  ].join("\n"), "utf-8")
  fs.chmodSync(bin, 0o755)
  return bin
}

describe("uipath plugin", () => {
  const fakeDir = fs.mkdtempSync(path.join(os.tmpdir(), "dcli-uipath-"))
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), "dcli-home-uipath-"))
  writeFakeUipcliBinary(fakeDir)
  const env = { ...process.env, PATH: `${fakeDir}:${process.env.PATH || ""}`, SUPERCLI_HOME: tempHome }

  beforeAll(() => {
    const install = runNoServer("plugins install ./plugins/uipath --on-conflict replace --json", { env })
    expect(install.ok).toBe(true)
  })

  afterAll(() => {
    runNoServer("plugins remove uipath --json", { env })
    fs.rmSync(fakeDir, { recursive: true, force: true })
    fs.rmSync(tempHome, { recursive: true, force: true })
  })

  test("routes wrapped deploy command and passthrough", () => {
    const version = runNoServer("uipath cli version --json", { env })
    expect(version.ok).toBe(true)
    expect(JSON.parse(version.output).data.raw).toBe("uipcli 25.10.3-test")

    const deploy = runNoServer("uipath package deploy --path ./dist/app --application-id app-123 --organization org --tenant t1 --uri https://example.test --json", { env })
    expect(deploy.ok).toBe(true)
    const deployPayload = JSON.parse(JSON.parse(deploy.output).data.raw)
    expect(deployPayload.mode).toBe("deploy")
    expect(deployPayload.path).toBe("./dist/app")
    expect(deployPayload.args).toContain("package")
    expect(deployPayload.args).toContain("deploy")
    expect(deployPayload.args).toContain("./dist/app")

    const passthrough = runNoServer("uipath orchestrator folders list --json", { env })
    expect(passthrough.ok).toBe(true)
    expect(JSON.parse(passthrough.output).command).toBe("uipath.passthrough")
  })

  test("exposes learn content and healthy dependency checks", () => {
    const learn = runNoServer("plugins learn uipath --json", { env })
    expect(learn.ok).toBe(true)
    const learnPayload = JSON.parse(learn.output)
    expect(learnPayload.plugin).toBe("uipath")
    expect(learnPayload.learn_markdown).toContain("uipath Quickstart")

    const explore = runNoServer("plugins explore --name uipath --json", { env })
    expect(explore.ok).toBe(true)
    const plugin = JSON.parse(explore.output).plugins.find(p => p.name === "uipath")
    expect(plugin).toBeDefined()
    expect(plugin.has_learn).toBe(true)

    const doctor = runNoServer("plugins doctor uipath --json", { env })
    expect(doctor.ok).toBe(true)
    expect(JSON.parse(doctor.output).checks.some(c => c.type === "binary" && c.binary === "uipcli" && c.ok === true)).toBe(true)
  })
})
