# Operation Vocabulary Reference

This document provides a complete reference for all operations available in the goodpackagerepo pipeline system.

## Overview

The repository uses a **closed-world operations model**, meaning only explicitly allowed operations can be used in pipeline definitions. This ensures security, predictability, and static validation.

## Operation Categories

### Authentication Operations

#### `auth.require_scopes`
Require specific authentication scopes for access.

**Arguments:**
- `scopes` (array of strings) - Required scopes (e.g., `["read"]`, `["write"]`, `["admin"]`)

**Example:**
```json
{
  "op": "auth.require_scopes",
  "args": {
    "scopes": ["write"]
  }
}
```

---

### Parsing Operations

#### `parse.path`
Parse URL path parameters into entity fields.

**Arguments:**
- `entity` (string) - Entity type to parse into (e.g., `"artifact"`)

**Example:**
```json
{
  "op": "parse.path",
  "args": {
    "entity": "artifact"
  }
}
```

#### `parse.query`
Parse URL query parameters.

**Arguments:**
- `out` (string) - Output variable name

**Example:**
```json
{
  "op": "parse.query",
  "args": {
    "out": "query_params"
  }
}
```

#### `parse.json`
Parse JSON request body.

**Arguments:**
- `out` (string) - Output variable name

**Example:**
```json
{
  "op": "parse.json",
  "args": {
    "out": "body"
  }
}
```

---

### Normalization and Validation Operations

#### `normalize.entity`
Normalize entity fields according to schema rules (trim, lowercase, replacements).

**Arguments:**
- `entity` (string) - Entity type to normalize

**Normalization Rules:**
- `trim` - Remove leading/trailing whitespace
- `lower` - Convert to lowercase
- `replace:X:Y` - Replace X with Y

**Example:**
```json
{
  "op": "normalize.entity",
  "args": {
    "entity": "artifact"
  }
}
```

#### `validate.entity`
Validate entity against schema constraints (regex patterns, required fields).

**Arguments:**
- `entity` (string) - Entity type to validate

**Example:**
```json
{
  "op": "validate.entity",
  "args": {
    "entity": "artifact"
  }
}
```

#### `validate.json_schema`
Validate data against a JSON schema.

**Arguments:**
- `schema` (object) - JSON schema definition
- `value` (any) - Value to validate

**Example:**
```json
{
  "op": "validate.json_schema",
  "args": {
    "schema": {
      "type": "object",
      "required": ["name"],
      "properties": {
        "name": {"type": "string"}
      }
    },
    "value": "$body"
  }
}
```

---

### Transaction Operations

#### `txn.begin`
Begin a database transaction.

**Arguments:**
- `isolation` (string) - Isolation level (`"serializable"`, `"repeatable_read"`, `"read_committed"`)

**Example:**
```json
{
  "op": "txn.begin",
  "args": {
    "isolation": "serializable"
  }
}
```

#### `txn.commit`
Commit the current transaction.

**Arguments:** None

**Example:**
```json
{
  "op": "txn.commit",
  "args": {}
}
```

#### `txn.abort`
Abort the current transaction.

**Arguments:** None

**Example:**
```json
{
  "op": "txn.abort",
  "args": {}
}
```

---

### Key-Value Store Operations

#### `kv.get`
Get a value from the key-value store.

**Arguments:**
- `doc` (string) - Document type (e.g., `"artifact_meta"`, `"tag_map"`)
- `key` (string) - Key template with variable interpolation
- `out` (string) - Output variable name

**Example:**
```json
{
  "op": "kv.get",
  "args": {
    "doc": "artifact_meta",
    "key": "artifact/{namespace}/{name}/{version}/{variant}",
    "out": "meta"
  }
}
```

#### `kv.put`
Put a value into the key-value store.

**Arguments:**
- `doc` (string) - Document type
- `key` (string) - Key template
- `value` (any) - Value to store

**Example:**
```json
{
  "op": "kv.put",
  "args": {
    "doc": "tag_map",
    "key": "tag/{namespace}/{name}/{tag}",
    "value": {
      "namespace": "{namespace}",
      "tag": "{tag}",
      "target": "{target_version}"
    }
  }
}
```

#### `kv.cas_put`
Compare-and-swap put - conditional write if absent or matches expected value.

**Arguments:**
- `doc` (string) - Document type
- `key` (string) - Key template
- `value` (any) - Value to store
- `if_absent` (boolean) - Only write if key doesn't exist

**Example:**
```json
{
  "op": "kv.cas_put",
  "args": {
    "doc": "artifact_meta",
    "key": "artifact/{namespace}/{name}/{version}/{variant}",
    "if_absent": true,
    "value": "$metadata"
  }
}
```

#### `kv.delete`
Delete a key from the key-value store.

**Arguments:**
- `doc` (string) - Document type
- `key` (string) - Key template

**Example:**
```json
{
  "op": "kv.delete",
  "args": {
    "doc": "artifact_meta",
    "key": "artifact/{namespace}/{name}/{version}/{variant}"
  }
}
```

---

### Blob Store Operations

#### `blob.get`
Get a blob from the blob store.

**Arguments:**
- `store` (string) - Blob store name (e.g., `"primary"`)
- `digest` (string) - Blob digest (content hash)
- `out` (string) - Output variable name

**Example:**
```json
{
  "op": "blob.get",
  "args": {
    "store": "primary",
    "digest": "$meta.blob_digest",
    "out": "blob"
  }
}
```

#### `blob.put`
Put a blob into the blob store.

**Arguments:**
- `store` (string) - Blob store name
- `from` (string) - Source (e.g., `"request.body"`, variable)
- `out` (string) - Output variable for digest
- `out_size` (string) - Output variable for size

**Example:**
```json
{
  "op": "blob.put",
  "args": {
    "store": "primary",
    "from": "request.body",
    "out": "digest",
    "out_size": "blob_size"
  }
}
```

#### `blob.verify_digest`
Verify blob integrity by checking digest.

**Arguments:**
- `digest` (string) - Digest to verify
- `algo` (string) - Hash algorithm (e.g., `"sha256"`)

**Example:**
```json
{
  "op": "blob.verify_digest",
  "args": {
    "digest": "$digest",
    "algo": "sha256"
  }
}
```

---

### Index Operations

#### `index.query`
Query an index.

**Arguments:**
- `index` (string) - Index name
- `key` (object) - Query key fields
- `limit` (integer) - Maximum results
- `out` (string) - Output variable name

**Example:**
```json
{
  "op": "index.query",
  "args": {
    "index": "artifact_versions",
    "key": {
      "namespace": "{namespace}",
      "name": "{name}"
    },
    "limit": 10,
    "out": "rows"
  }
}
```

#### `index.upsert`
Insert or update an index entry.

**Arguments:**
- `index` (string) - Index name
- `key` (object) - Index key fields
- `value` (object) - Value to store

**Example:**
```json
{
  "op": "index.upsert",
  "args": {
    "index": "artifact_versions",
    "key": {
      "namespace": "{namespace}",
      "name": "{name}"
    },
    "value": {
      "version": "{version}",
      "variant": "{variant}"
    }
  }
}
```

#### `index.delete`
Delete from an index.

**Arguments:**
- `index` (string) - Index name
- `key` (object) - Index key fields

**Example:**
```json
{
  "op": "index.delete",
  "args": {
    "index": "artifact_versions",
    "key": {
      "namespace": "{namespace}",
      "name": "{name}",
      "version": "{version}"
    }
  }
}
```

---

### Cache Operations

#### `cache.get`
Get a value from the cache.

**Arguments:**
- `kind` (string) - Cache kind (`"response"`, `"blob"`)
- `key` (string) - Cache key
- `hit_out` (string) - Output variable for cache hit status
- `value_out` (string) - Output variable for cached value

**Example:**
```json
{
  "op": "cache.get",
  "args": {
    "kind": "response",
    "key": "blob_resp/{namespace}/{name}/{version}/{variant}",
    "hit_out": "cache_hit",
    "value_out": "cached_resp"
  }
}
```

#### `cache.put`
Put a value into the cache.

**Arguments:**
- `kind` (string) - Cache kind
- `key` (string) - Cache key
- `ttl_seconds` (integer) - Time to live
- `value` (any) - Value to cache

**Example:**
```json
{
  "op": "cache.put",
  "args": {
    "kind": "response",
    "key": "blob_resp/{namespace}/{name}/{version}/{variant}",
    "ttl_seconds": 300,
    "value": "$response_data"
  }
}
```

---

### Proxy Operations

#### `proxy.fetch`
Fetch from an upstream proxy.

**Arguments:**
- `upstream` (string) - Upstream name
- `method` (string) - HTTP method
- `path` (string) - Request path
- `out` (string) - Output variable name

**Example:**
```json
{
  "op": "proxy.fetch",
  "args": {
    "upstream": "originA",
    "method": "GET",
    "path": "/v1/{namespace}/{name}/{version}/{variant}/blob",
    "out": "up_resp"
  }
}
```

---

### Response Operations

#### `respond.json`
Return a JSON response.

**Arguments:**
- `status` (integer) - HTTP status code
- `body` (object) - Response body
- `when` (object, optional) - Conditional execution

**Example:**
```json
{
  "op": "respond.json",
  "args": {
    "status": 200,
    "body": {
      "ok": true,
      "data": "$result"
    }
  }
}
```

#### `respond.bytes`
Return a binary response.

**Arguments:**
- `status` (integer) - HTTP status code
- `body` (any) - Response body
- `headers` (object, optional) - Response headers
- `when` (object, optional) - Conditional execution

**Example:**
```json
{
  "op": "respond.bytes",
  "args": {
    "status": 200,
    "headers": {
      "Content-Type": "application/octet-stream"
    },
    "body": "$blob"
  }
}
```

#### `respond.redirect`
Return a redirect response.

**Arguments:**
- `status` (integer) - HTTP status code (301, 302, 307, 308)
- `location` (string) - Redirect URL
- `when` (object, optional) - Conditional execution

**Example:**
```json
{
  "op": "respond.redirect",
  "args": {
    "status": 307,
    "location": "/v1/{namespace}/{name}/{version}/{variant}/blob"
  }
}
```

#### `respond.error`
Return an error response.

**Arguments:**
- `status` (integer) - HTTP status code
- `code` (string) - Error code
- `message` (string) - Error message
- `when` (object, optional) - Conditional execution

**Example:**
```json
{
  "op": "respond.error",
  "args": {
    "when": {
      "is_null": "$meta"
    },
    "status": 404,
    "code": "NOT_FOUND",
    "message": "Artifact not found"
  }
}
```

---

### Event Operations

#### `emit.event`
Emit an event to the event log for replication and auditing.

**Arguments:**
- `type` (string) - Event type name
- `payload` (object) - Event payload

**Example:**
```json
{
  "op": "emit.event",
  "args": {
    "type": "artifact.published",
    "payload": {
      "namespace": "{namespace}",
      "name": "{name}",
      "version": "{version}",
      "at": "$now",
      "by": "{principal.sub}"
    }
  }
}
```

---

### Utility Operations

#### `time.now_iso8601`
Get the current time in ISO8601 format.

**Arguments:**
- `out` (string) - Output variable name

**Example:**
```json
{
  "op": "time.now_iso8601",
  "args": {
    "out": "now"
  }
}
```

#### `string.format`
Format strings with variable interpolation.

**Arguments:**
- `template` (string) - String template
- `out` (string) - Output variable name

**Example:**
```json
{
  "op": "string.format",
  "args": {
    "template": "{namespace}/{name}:{version}",
    "out": "formatted"
  }
}
```

---

## Variable Interpolation

Operations support variable interpolation using:

- `{field}` - Path/entity field (e.g., `{namespace}`, `{version}`)
- `$variable` - Runtime variable (e.g., `$digest`, `$body`)
- `{principal.sub}` - Principal field from JWT token

## Conditional Execution

Many operations support conditional execution via the `when` argument:

```json
{
  "when": {
    "equals": ["$var1", "$var2"],
    "is_null": "$var",
    "is_not_null": "$var",
    "is_empty": "$list",
    "not_in": ["$value", [1, 2, 3]]
  }
}
```

## Pipeline Limits

- Maximum operations per pipeline: 128
- Maximum request body: 2GB
- Maximum JSON size: 10MB
- Maximum KV value size: 1MB
- Maximum CPU time per request: 200ms
- Maximum I/O operations per request: 5000

## Best Practices

1. **Always use transactions** for operations that modify data (`kv.put`, `index.upsert`)
2. **Verify blob digests** after blob.put to ensure integrity
3. **Use caching** for read-heavy endpoints
4. **Emit events** for audit trail and replication
5. **Validate early** - parse, normalize, and validate before processing
6. **Check auth first** - require_scopes should be the first operation
7. **Handle errors gracefully** - use respond.error with appropriate status codes

## See Also

- `schema.json` - Complete schema definition
- `templates/` - Example pipeline templates
- API Routes documentation
