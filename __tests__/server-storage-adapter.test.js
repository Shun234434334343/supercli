const { getStorage } = require("../server/storage/adapter")
const MongoAdapter = require("../server/storage/mongo")
const FileAdapter = require("../server/storage/file")

jest.mock("../server/storage/mongo")
jest.mock("../server/storage/file")

describe("storage adapter factory", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    delete process.env.SUPERCLI_USE_MONGO
    // We can't easily reset the singleton without resetModules, 
    // so we'll just test the logic via fresh requires if needed.
    jest.resetModules()
  })

  test("returns FileAdapter by default", () => {
    const FileAdapterMock = require("../server/storage/file")
    const { getStorage } = require("../server/storage/adapter")
    const storage = getStorage()
    expect(FileAdapterMock).toHaveBeenCalled()
    expect(storage).toBeInstanceOf(FileAdapterMock)
  })

  test("returns MongoAdapter if SUPERCLI_USE_MONGO=true", () => {
    process.env.SUPERCLI_USE_MONGO = "true"
    const MongoAdapterMock = require("../server/storage/mongo")
    const { getStorage } = require("../server/storage/adapter")
    const storage = getStorage()
    expect(MongoAdapterMock).toHaveBeenCalled()
    expect(storage).toBeInstanceOf(MongoAdapterMock)
  })

  test("singleton behavior", () => {
    const { getStorage } = require("../server/storage/adapter")
    const s1 = getStorage()
    const s2 = getStorage()
    expect(s1).toBe(s2)
  })
})
