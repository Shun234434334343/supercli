/**
 * MongoAdapter implementation for SUPERCLI Storage
 */
const { MongoClient } = require("mongodb");

class MongoAdapter {
  constructor(uri, dbName = "supercli", collectionName = "storage") {
    this.client = new MongoClient(uri);
    this.dbName = dbName;
    this.collectionName = collectionName;
    this.connected = false;
    this.collection = null;
  }

  async connect() {
    if (!this.connected) {
      await this.client.connect();
      this.collection = this.client
        .db(this.dbName)
        .collection(this.collectionName);
      this.connected = true;
    }
  }

  async get(key) {
    await this.connect();
    const doc = await this.collection.findOne({ _id: key });
    return doc ? doc.value : null;
  }

  async set(key, value) {
    await this.connect();
    await this.collection.updateOne(
      { _id: key },
      { $set: { value } },
      { upsert: true },
    );
  }

  async delete(key) {
    await this.connect();
    await this.collection.deleteOne({ _id: key });
  }

  async listKeys(prefix = "") {
    await this.connect();
    const query = prefix ? { _id: { $regex: `^${prefix}` } } : {};
    const docs = await this.collection
      .find(query, { projection: { _id: 1 } })
      .toArray();
    return docs.map((doc) => doc._id);
  }
}

module.exports = MongoAdapter;
