const MongoAdapter = require("../server/storage/mongo")
const { MongoClient } = require("mongodb")

jest.mock("mongodb")

describe("MongoAdapter", () => {
  let adapter
  let mockCollection
  let mockDb
  let mockClient

  beforeEach(() => {
    jest.clearAllMocks()
    mockCollection = {
      findOne: jest.fn(),
      updateOne: jest.fn(),
      deleteOne: jest.fn(),
      find: jest.fn().mockReturnThis(),
      toArray: jest.fn()
    }
    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection)
    }
    mockClient = {
      connect: jest.fn().mockResolvedValue({}),
      db: jest.fn().mockReturnValue(mockDb)
    }
    MongoClient.mockImplementation(() => mockClient)

    adapter = new MongoAdapter("mongodb://uri")
  })

  test("get returns value field", async () => {
    mockCollection.findOne.mockResolvedValue({ _id: "k", value: { x: 1 } })
    const result = await adapter.get("k")
    expect(result).toEqual({ x: 1 })
    expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: "k" })
  })

  test("get returns null if doc missing", async () => {
    mockCollection.findOne.mockResolvedValue(null)
    expect(await adapter.get("k")).toBeNull()
  })

  test("set updates with upsert", async () => {
    await adapter.set("k", { y: 2 })
    expect(mockCollection.updateOne).toHaveBeenCalledWith(
      { _id: "k" },
      { $set: { value: { y: 2 } } },
      { upsert: true }
    )
  })

  test("delete removes by _id", async () => {
    await adapter.delete("k")
    expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: "k" })
  })

  test("listKeys uses regex and maps ids", async () => {
    mockCollection.toArray.mockResolvedValue([{ _id: "pre:1" }, { _id: "pre:2" }])
    const keys = await adapter.listKeys("pre:")
    expect(keys).toEqual(["pre:1", "pre:2"])
    expect(mockCollection.find).toHaveBeenCalledWith(
      { _id: { $regex: "^pre:" } },
      { projection: { _id: 1 } }
    )
  })

  test("listKeys without prefix", async () => {
    mockCollection.toArray.mockResolvedValue([])
    await adapter.listKeys()
    expect(mockCollection.find).toHaveBeenCalledWith({}, expect.anything())
  })
})
