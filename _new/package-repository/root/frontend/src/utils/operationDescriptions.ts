/**
 * Detailed descriptions for each operation key.
 * Separated from operationData to respect the
 * 100-line file size limit.
 */

import type { OperationKey } from './operationData';

/** Detailed human-readable description per operation. */
export const operationDescriptions:
  Record<OperationKey, string> = {
  'auth.require_scopes':
    'Checks required permissions for this endpoint',
  'parse.path':
    'Extracts parameters from the URL path',
  'parse.query':
    'Extracts parameters from the query string',
  'parse.json':
    'Parses the JSON request body into usable data',
  'normalize.entity':
    'Cleans up and standardizes input data',
  'validate.entity':
    'Ensures data meets all validation rules',
  'validate.json_schema':
    'Validates data against a JSON schema definition',
  'txn.begin':
    'Starts a database transaction for consistency',
  'txn.commit':
    'Saves all changes made during the transaction',
  'txn.abort':
    'Rolls back all changes if something goes wrong',
  'kv.get':
    'Retrieves data from the key-value store',
  'kv.put':
    'Stores data in the key-value store',
  'kv.cas_put':
    'Stores data only if it does not already exist',
  'kv.delete':
    'Removes data from the key-value store',
  'blob.get':
    'Downloads a binary file from storage',
  'blob.put':
    'Uploads a binary file and computes its hash',
  'blob.verify_digest':
    'Verifies file integrity using SHA256 checksum',
  'index.query':
    'Searches the index for matching records',
  'index.upsert':
    'Adds or updates a record in the index',
  'index.delete':
    'Removes a record from the index',
  'cache.get':
    'Checks if a cached version of data exists',
  'cache.put':
    'Stores data in the cache with a TTL',
  'proxy.fetch':
    'Fetches data from an external upstream repo',
  'respond.json':
    'Returns a JSON response to the client',
  'respond.bytes':
    'Returns binary data (files, blobs) to the client',
  'respond.redirect':
    'Redirects the client to another URL',
  'respond.error':
    'Returns an error response with status and message',
  'emit.event':
    'Records an event for audit trail and replication',
  'time.now_iso8601':
    'Gets the current timestamp in ISO 8601 format',
  'string.format':
    'Formats a string with variable interpolation',
};
