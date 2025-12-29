# Templates

This directory contains template files for creating new entities, routes, and configurations in the goodpackagerepo system.

## Contents

- `entity_template.json` - Template for defining new entity types
- `route_template.json` - Template for creating new API routes
- `pipeline_template.json` - Template for building operation pipelines
- `blob_store_template.json` - Template for configuring blob stores
- `auth_scope_template.json` - Template for defining authentication scopes
- `upstream_template.json` - Template for configuring upstream repositories

## Operation Vocabulary

The repository supports a closed-world set of operations that can be used in pipeline definitions:

### Authentication Operations
- `auth.require_scopes` - Require specific scopes for access

### Parsing Operations
- `parse.path` - Parse path parameters into entity fields
- `parse.query` - Parse query parameters
- `parse.json` - Parse JSON request body

### Normalization and Validation
- `normalize.entity` - Normalize entity fields (trim, lowercase, etc.)
- `validate.entity` - Validate entity against constraints
- `validate.json_schema` - Validate data against JSON schema

### Transaction Operations
- `txn.begin` - Begin a transaction
- `txn.commit` - Commit a transaction
- `txn.abort` - Abort a transaction

### Key-Value Store Operations
- `kv.get` - Get value from KV store
- `kv.put` - Put value into KV store
- `kv.cas_put` - Compare-and-swap put (conditional)
- `kv.delete` - Delete from KV store

### Blob Store Operations
- `blob.get` - Get blob from store
- `blob.put` - Put blob into store
- `blob.verify_digest` - Verify blob integrity

### Index Operations
- `index.query` - Query an index
- `index.upsert` - Insert or update index entry
- `index.delete` - Delete from index

### Cache Operations
- `cache.get` - Get from cache
- `cache.put` - Put into cache

### Proxy Operations
- `proxy.fetch` - Fetch from upstream proxy

### Response Operations
- `respond.json` - Return JSON response
- `respond.bytes` - Return binary response
- `respond.redirect` - Return redirect response
- `respond.error` - Return error response

### Event Operations
- `emit.event` - Emit an event to the event log

### Utility Operations
- `time.now_iso8601` - Get current time in ISO8601 format
- `string.format` - Format strings with variables

## Usage

Copy a template file and customize it for your needs. Templates use placeholders that should be replaced:

- `{namespace}` - Package namespace
- `{name}` - Package name
- `{version}` - Package version
- `{variant}` - Package variant
- `$variable` - Runtime variable from pipeline execution

## Example

To create a new route based on a template:

```bash
cp templates/route_template.json my_route.json
# Edit my_route.json with your route definition
# Use the admin API to add the route to the system
```
