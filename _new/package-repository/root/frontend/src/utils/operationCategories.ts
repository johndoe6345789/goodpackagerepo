/**
 * Category assignments and colors for operations.
 * Maps each operation key to its category and
 * each category to its display color.
 */

import type {
  OperationKey, CategoryName,
} from './operationData';

/** Category assignment for each operation. */
export const operationCategories:
  Record<OperationKey, CategoryName> = {
  'auth.require_scopes': 'Authentication',
  'parse.path': 'Parsing',
  'parse.query': 'Parsing',
  'parse.json': 'Parsing',
  'normalize.entity': 'Validation',
  'validate.entity': 'Validation',
  'validate.json_schema': 'Validation',
  'txn.begin': 'Transaction',
  'txn.commit': 'Transaction',
  'txn.abort': 'Transaction',
  'kv.get': 'Storage',
  'kv.put': 'Storage',
  'kv.cas_put': 'Storage',
  'kv.delete': 'Storage',
  'blob.get': 'Storage',
  'blob.put': 'Storage',
  'blob.verify_digest': 'Storage',
  'index.query': 'Indexing',
  'index.upsert': 'Indexing',
  'index.delete': 'Indexing',
  'cache.get': 'Cache',
  'cache.put': 'Cache',
  'proxy.fetch': 'Proxy',
  'respond.json': 'Response',
  'respond.bytes': 'Response',
  'respond.redirect': 'Response',
  'respond.error': 'Response',
  'emit.event': 'Events',
  'time.now_iso8601': 'Utilities',
  'string.format': 'Utilities',
};

/** Hex color for each category. */
export const categoryColors:
  Record<CategoryName, string> = {
  'Authentication': '#ff6b6b',
  'Parsing': '#4ecdc4',
  'Validation': '#45b7d1',
  'Transaction': '#f7dc6f',
  'Storage': '#bb8fce',
  'Indexing': '#85c1e9',
  'Cache': '#82e0aa',
  'Proxy': '#f8b739',
  'Response': '#eb984e',
  'Events': '#aed581',
  'Utilities': '#90a4ae',
};
