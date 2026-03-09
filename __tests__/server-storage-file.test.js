const fs = require("fs").promises
const path = require("path")
const FileAdapter = require("../server/storage/file")

jest.mock("fs", () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    unlink: jest.fn(),
    readdir: jest.fn(),
    mkdir: jest.fn()
  },
  existsSync: jest.fn()
}))
const fsMock = require("fs")

describe("FileAdapter", () => {
  const baseDir = "/tmp/storage"
  let adapter

  beforeEach(() => {
    jest.clearAllMocks()
    adapter = new FileAdapter(baseDir)
  })

  test("get returns parsed JSON", async () => {
    fs.readFile.mockResolvedValue('{"a": 1}')
    const result = await adapter.get("mykey")
    expect(result).toEqual({ a: 1 })
    expect(fs.readFile).toHaveBeenCalledWith(expect.stringContaining("mykey.json"), "utf-8")
  })

  test("get returns null on ENOENT", async () => {
    fs.readFile.mockRejectedValue({ code: "ENOENT" })
    expect(await adapter.get("missing")).toBeNull()
  })

  test("get throws other errors", async () => {
    fs.readFile.mockRejectedValue(new Error("crash"))
    await expect(adapter.get("err")).rejects.toThrow("crash")
  })

  test("set creates dir and writes file", async () => {
    await adapter.set("key", { x: 1 })
    expect(fs.mkdir).toHaveBeenCalledWith(baseDir, { recursive: true })
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining("key.json"),
      expect.stringContaining('"x": 1'),
      "utf-8"
    )
  })

  test("delete unlinks file", async () => {
    await adapter.delete("key")
    expect(fs.unlink).toHaveBeenCalled()
  })

  test("delete ignores ENOENT", async () => {
    fs.unlink.mockRejectedValue({ code: "ENOENT" })
    await expect(adapter.delete("key")).resolves.not.toThrow()
  })

  test("listKeys filters and maps files", async () => {
    fs.readdir.mockResolvedValue(["abc_1.json", "abc_2.json", "other.json", "abc_3.txt"])
    const keys = await adapter.listKeys("abc")
    expect(keys).toEqual(["abc_1", "abc_2"])
  })

  test("listKeys returns empty on ENOENT", async () => {
    fs.readdir.mockRejectedValue({ code: "ENOENT" })
    expect(await adapter.listKeys()).toEqual([])
  })
})
