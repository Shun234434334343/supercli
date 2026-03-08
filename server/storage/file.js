/**
 * FileAdapter implementation for DCLI Storage using JSON files
 */
const fs = require("fs").promises
const path = require("path")

class FileAdapter {
  constructor(baseDir = "./dcli_storage") {
    this.baseDir = path.resolve(baseDir)
  }

  filePath(key) {
    // Basic sanitization to avoid directory traversal inside the storage scope
    const safeKey = key.replace(/[^a-zA-Z0-9_.-]/g, "_")
    return path.join(this.baseDir, `${safeKey}.json`)
  }

  async get(key) {
    try {
      const data = await fs.readFile(this.filePath(key), "utf-8")
      return JSON.parse(data)
    } catch (e) {
      if (e.code === "ENOENT") return null
      throw e
    }
  }

  async set(key, value) {
    await fs.mkdir(this.baseDir, { recursive: true })
    await fs.writeFile(this.filePath(key), JSON.stringify(value, null, 2), "utf-8")
  }

  async delete(key) {
    try {
      await fs.unlink(this.filePath(key))
    } catch (e) {
      if (e.code !== "ENOENT") throw e
    }
  }

  async listKeys(prefix = "") {
    try {
      const files = await fs.readdir(this.baseDir)
      // Reverse the sanitization mapping in listKeys if we can,
      // but for prefix search, we just look at files matching the sanitized prefix.
      const safePrefix = prefix.replace(/[^a-zA-Z0-9_.-]/g, "_")
      return files
        .filter(f => f.endsWith(".json") && f.startsWith(safePrefix))
        // Here we just strip .json. Actual key might be slightly different if it had chars we sanitized out
        .map(f => f.replace(/\.json$/, ""))
    } catch (e) {
      if (e.code === "ENOENT") return []
      throw e
    }
  }
}

module.exports = FileAdapter
