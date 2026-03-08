/**
 * Storage Adapter Factory
 * Provides a unified KV store interface (get, set, delete, listKeys)
 * driven by either MongoDB or local JSON files.
 */
const MongoAdapter = require("./mongo")
const FileAdapter = require("./file")

// Singleton storage instance
let currentAdapter = null

function getStorage() {
  if (currentAdapter) return currentAdapter

  const useMongo = process.env.DCLI_USE_MONGO === "true"
  if (useMongo) {
    const mongoUrl = process.env.MONGO_URL || "mongodb://localhost:27017"
    const dbName = process.env.DCLI_DB || "dcli"
    currentAdapter = new MongoAdapter(mongoUrl, dbName)
    console.log(`[Storage] Initialized MongoDB adapter (${mongoUrl}/${dbName})`)
  } else {
    const storageDir = process.env.DCLI_STORAGE_DIR || "./dcli_storage"
    currentAdapter = new FileAdapter(storageDir)
    console.log(`[Storage] Initialized File adapter (${storageDir})`)
  }

  return currentAdapter
}

module.exports = { getStorage }
