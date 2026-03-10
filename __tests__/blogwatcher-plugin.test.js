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

function writeFakeCurlBinary(dir) {
  const bin = path.join(dir, "curl")
  fs.writeFileSync(bin, [
    "#!/usr/bin/env node",
    "const args = process.argv.slice(2);",
    "const url = args[args.length - 1] || '';",
    "if (args.includes('--version')) { console.log('curl 8.0.0-test'); process.exit(0); }",
    "if (url.endsWith('/SKILL.md')) { console.log('---\\nname: blogwatcher-cli\\ndescription: Test skill\\n---\\n# BlogWatcher CLI'); process.exit(0); }",
    "if (url.endsWith('/README.md')) { console.log('# BlogWatcher\\n\\nTest readme.'); process.exit(0); }",
    "console.error(`unsupported url: ${url}`);",
    "process.exit(22);"
  ].join("\n"), "utf-8")
  fs.chmodSync(bin, 0o755)
  return bin
}

function writeFakeBlogwatcherBinary(dir) {
  const bin = path.join(dir, "blogwatcher")
  fs.writeFileSync(bin, [
    "#!/usr/bin/env node",
    "const args = process.argv.slice(2);",
    "if (args[0] === '--version') { console.log('blogwatcher 0.0.2-test'); process.exit(0); }",
    "if (args[0] === 'blogs' && args.length === 1) { console.log('Tracked blogs (0):'); process.exit(0); }",
    "if (args[0] === 'add') { console.log(`Added blog '${args[1]}'`); process.exit(0); }",
    "if (args[0] === 'remove' && args.includes('--yes')) { console.log(`Removed blog '${args[args.length - 1]}'`); process.exit(0); }",
    "if (args[0] === 'scan' && args.includes('--silent')) { console.log('scan done'); process.exit(0); }",
    "if (args[0] === 'articles' && args[1] !== 'read-all') { console.log('No unread articles!'); process.exit(0); }",
    "if (args[0] === 'read') { console.log(`Marked article ${args[1]} as read`); process.exit(0); }",
    "if (args[0] === 'unread') { console.log(`Marked article ${args[1]} as unread`); process.exit(0); }",
    "if (args[0] === 'read-all' && args.includes('--yes')) { console.log('Marked 0 article(s) as read'); process.exit(0); }",
    "console.log(JSON.stringify({ ok: true, args }));"
  ].join("\n"), "utf-8")
  fs.chmodSync(bin, 0o755)
  return bin
}

describe("blogwatcher hybrid plugin", () => {
  const fakeDir = fs.mkdtempSync(path.join(os.tmpdir(), "dcli-blogwatcher-"))
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), "dcli-home-blogwatcher-"))
  const fakeUserHome = fs.mkdtempSync(path.join(os.tmpdir(), "dcli-user-home-blogwatcher-"))
  writeFakeCurlBinary(fakeDir)
  writeFakeBlogwatcherBinary(fakeDir)
  const env = {
    ...process.env,
    PATH: `${fakeDir}:${process.env.PATH || ""}`,
    SUPERCLI_HOME: tempHome,
    HOME: fakeUserHome
  }
  let removed = false

  beforeAll(() => {
    const install = runNoServer("plugins install ./plugins/blogwatcher --on-conflict replace --json", { env })
    expect(install.ok).toBe(true)
  })

  afterAll(() => {
    if (!removed) runNoServer("plugins remove blogwatcher --json", { env })
    fs.rmSync(fakeDir, { recursive: true, force: true })
    fs.rmSync(tempHome, { recursive: true, force: true })
    fs.rmSync(fakeUserHome, { recursive: true, force: true })
  })

  test("indexes blogwatcher skills provider", () => {
    const provider = runNoServer("skills providers show --name blogwatcher --json", { env })
    expect(provider.ok).toBe(true)
    const providerData = JSON.parse(provider.output)
    expect(providerData.provider.name).toBe("blogwatcher")

    const list = runNoServer("skills list --catalog --provider blogwatcher --json", { env })
    expect(list.ok).toBe(true)
    const listData = JSON.parse(list.output)
    expect(listData.skills.some(skill => skill.id === "blogwatcher:root.skill")).toBe(true)
    expect(listData.skills.some(skill => skill.id === "blogwatcher:root.readme")).toBe(true)
  })

  test("fetches indexed remote skill markdown", () => {
    const skill = runNoServer("skills get blogwatcher:root.skill", { env })
    expect(skill.ok).toBe(true)
    expect(skill.output).toContain("BlogWatcher CLI")
  })

  test("routes wrapped commands", () => {
    const version = runNoServer("blogwatcher cli version --json", { env })
    expect(version.ok).toBe(true)
    expect(JSON.parse(version.output).data.raw).toBe("blogwatcher 0.0.2-test")

    const add = runNoServer("blogwatcher blogs add --name \"Example\" --url \"https://example.com/blog\" --feed-url \"https://example.com/feed.xml\" --json", { env })
    expect(add.ok).toBe(true)
    expect(JSON.parse(add.output).data.raw).toBe("Added blog 'Example'")

    const scan = runNoServer("blogwatcher scan run --workers 2 --json", { env })
    expect(scan.ok).toBe(true)
    expect(JSON.parse(scan.output).data.raw).toBe("scan done")

    const readAll = runNoServer("blogwatcher articles read-all --blog \"Example\" --json", { env })
    expect(readAll.ok).toBe(true)
    expect(JSON.parse(readAll.output).data.raw).toBe("Marked 0 article(s) as read")
  })

  test("supports blogwatcher namespace passthrough", () => {
    const r = runNoServer("blogwatcher articles --all --json", { env })
    expect(r.ok).toBe(true)
    const data = JSON.parse(r.output)
    expect(data.command).toBe("blogwatcher.passthrough")
    expect(data.data.raw).toBe("No unread articles!")
  })

  test("doctor reports curl and blogwatcher dependencies as healthy", () => {
    const r = runNoServer("plugins doctor blogwatcher --json", { env })
    expect(r.ok).toBe(true)
    const data = JSON.parse(r.output)
    expect(data.ok).toBe(true)
    expect(data.checks.some(c => c.type === "binary" && c.binary === "curl" && c.ok === true)).toBe(true)
    expect(data.checks.some(c => c.type === "binary" && c.binary === "blogwatcher" && c.ok === true)).toBe(true)
  })

  test("removal cleans up the skills provider", () => {
    const remove = runNoServer("plugins remove blogwatcher --json", { env })
    expect(remove.ok).toBe(true)
    removed = true

    const provider = runNoServer("skills providers show --name blogwatcher --json", { env })
    expect(provider.ok).toBe(false)

    const list = runNoServer("skills list --catalog --provider blogwatcher --json", { env })
    expect(list.ok).toBe(true)
    const listData = JSON.parse(list.output)
    expect(listData.skills).toEqual([])
  })
})
