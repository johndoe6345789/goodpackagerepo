/**
 * Static data maps for operation vocabulary.
 * Types and lookup tables for labels and categories.
 */

/** Operation key type for all known operations. */
export type OperationKey =
  | 'auth.require_scopes'
  | 'parse.path' | 'parse.query' | 'parse.json'
  | 'normalize.entity'
  | 'validate.entity' | 'validate.json_schema'
  | 'txn.begin' | 'txn.commit' | 'txn.abort'
  | 'kv.get' | 'kv.put' | 'kv.cas_put' | 'kv.delete'
  | 'blob.get' | 'blob.put' | 'blob.verify_digest'
  | 'index.query' | 'index.upsert' | 'index.delete'
  | 'cache.get' | 'cache.put'
  | 'proxy.fetch'
  | 'respond.json' | 'respond.bytes'
  | 'respond.redirect' | 'respond.error'
  | 'emit.event'
  | 'time.now_iso8601' | 'string.format';

/** Category names for grouping operations. */
export type CategoryName =
  | 'Authentication' | 'Parsing' | 'Validation'
  | 'Transaction' | 'Storage' | 'Indexing'
  | 'Cache' | 'Proxy' | 'Response'
  | 'Events' | 'Utilities';

/** Human-readable labels keyed by operation. */
export const operationLabels: Record<OperationKey, string> = {
  'auth.require_scopes': 'Require Authentication',
  'parse.path': 'Parse URL Path',
  'parse.query': 'Parse Query String',
  'parse.json': 'Parse JSON Body',
  'normalize.entity': 'Normalize Data',
  'validate.entity': 'Validate Data',
  'validate.json_schema': 'Validate Against Schema',
  'txn.begin': 'Start Transaction',
  'txn.commit': 'Save Changes',
  'txn.abort': 'Cancel Changes',
  'kv.get': 'Fetch Data',
  'kv.put': 'Store Data',
  'kv.cas_put': 'Store Data (If New)',
  'kv.delete': 'Delete Data',
  'blob.get': 'Download File',
  'blob.put': 'Upload File',
  'blob.verify_digest': 'Verify File Integrity',
  'index.query': 'Search Index',
  'index.upsert': 'Update Index',
  'index.delete': 'Remove from Index',
  'cache.get': 'Check Cache',
  'cache.put': 'Save to Cache',
  'proxy.fetch': 'Fetch from Upstream',
  'respond.json': 'Return JSON Response',
  'respond.bytes': 'Return Binary Data',
  'respond.redirect': 'Redirect Request',
  'respond.error': 'Return Error',
  'emit.event': 'Log Event',
  'time.now_iso8601': 'Get Current Time',
  'string.format': 'Format String',
};
