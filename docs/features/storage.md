# Pluggable Storage

By default, the backend of DCLI is incredibly lightweight. However, for scaled enterprise deployments, its datastore is fully pluggable.

## Key Features

- **Key-Value Abstraction Layer**: Rather than tying the application to a specific database driver (e.g., MongoDB), DCLI operates strictly against a generic `delete`, `set`, `get`, and `listKeys` interface.
- **Natural Entity Keys**: Data records internally utilize human-readable string IDs (like `command:namespace.resource.action`) rather than opaque ObjectIDs to improve portability.
- **Zero-Dependency Native Backend (`FileAdapter`)**: Without MongoDB configured, DCLI defaults to reading and writing `.json` files in a local directory (`./dcli_storage`). This makes local testing completely frictionless and allows backing up configurations natively into Git if desired.
- **Enterprise Scale (`MongoAdapter`)**: Toggling an environment variable enables MongoDB persistence for shared, concurrent, high-availability deployments.

## Usage

The storage adapter is entirely determined by your environment variables in `.env` or process spawn.

```bash
# Default behavior (uses FileAdapter producing ./dcli_storage/*.json files)
npm start

# Enable MongoDB Mode
export DCLI_USE_MONGO=true
export MONGO_URL=mongodb://127.0.0.1:27017
export DCLI_DB=dcli
npm start
```
