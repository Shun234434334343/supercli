const fs = require("fs")
const os = require("os")

jest.mock("fs")
jest.mock("os", () => ({
  homedir: jest.fn(() => "/home/user")
}))

const {
  readPluginsLock,
  writePluginsLock,
  listInstalledPlugins,
  getInstalledPluginCommands
} = require("../cli/plugins-store")
const path = require("path")

describe("plugins-store", () => {
  const mockHomedir = "/home/user"
  const dcliDir = path.join(mockHomedir, ".dcli")
  const pluginsFile = path.join(dcliDir, "plugins.lock.json")

  beforeEach(() => {
    jest.clearAllMocks()
    os.homedir.mockReturnValue(mockHomedir)
  })

  describe("readPluginsLock", () => {
    test("returns empty lock if file does not exist", () => {
      fs.existsSync.mockReturnValue(false)
      const lock = readPluginsLock()
      expect(lock).toEqual({ version: 1, installed: {} })
    })

    test("returns parsed lock if file exists", () => {
      fs.existsSync.mockReturnValue(true)
      const mockLock = { version: 1, installed: { p1: { name: "p1" } } }
      fs.readFileSync.mockReturnValue(JSON.stringify(mockLock))
      const lock = readPluginsLock()
      expect(lock).toEqual(mockLock)
    })

    test("returns empty lock if file is invalid JSON", () => {
      fs.existsSync.mockReturnValue(true)
      fs.readFileSync.mockReturnValue("invalid-json")
      const lock = readPluginsLock()
      expect(lock).toEqual({ version: 1, installed: {} })
    })

    test("returns empty lock if parsed content is not an object", () => {
      fs.existsSync.mockReturnValue(true)
      fs.readFileSync.mockReturnValue("null")
      const lock = readPluginsLock()
      expect(lock).toEqual({ version: 1, installed: {} })
    })

    test("ensures installed field is an object", () => {
      fs.existsSync.mockReturnValue(true)
      fs.readFileSync.mockReturnValue(JSON.stringify({ version: 1 }))
      const lock = readPluginsLock()
      expect(lock.installed).toEqual({})
    })
  })

  describe("writePluginsLock", () => {
    test("creates directory if missing and writes file", () => {
      fs.existsSync.mockReturnValue(false)
      const lock = { version: 1, installed: {} }
      writePluginsLock(lock)
      expect(fs.mkdirSync).toHaveBeenCalledWith(dcliDir, { recursive: true })
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        pluginsFile,
        expect.stringContaining('"version": 1')
      )
    })
  })

  describe("listInstalledPlugins", () => {
    test("returns array of plugins", () => {
      fs.existsSync.mockReturnValue(true)
      const p1 = { name: "p1" }
      fs.readFileSync.mockReturnValue(JSON.stringify({
        installed: { p1 }
      }))
      const list = listInstalledPlugins()
      expect(list).toEqual([p1])
    })
  })

  describe("getInstalledPluginCommands", () => {
    test("returns flattened array of commands", () => {
      fs.existsSync.mockReturnValue(true)
      const c1 = { id: "c1" }
      const c2 = { id: "c2" }
      fs.readFileSync.mockReturnValue(JSON.stringify({
        installed: {
          p1: { commands: [c1] },
          p2: { commands: [c2] }
        }
      }))
      const commands = getInstalledPluginCommands()
      expect(commands).toEqual([c1, c2])
    })

    test("handles plugins with missing commands field", () => {
      fs.existsSync.mockReturnValue(true)
      fs.readFileSync.mockReturnValue(JSON.stringify({
        installed: {
          p1: { name: "p1" }
        }
      }))
      const commands = getInstalledPluginCommands()
      expect(commands).toEqual([])
    })
  })
})
