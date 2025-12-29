/**
 * Operation vocabulary utilities for displaying operations in plain English
 * Maps technical operation keys to human-readable descriptions
 */

export const operationLabels = {
  // Authentication
  'auth.require_scopes': 'Require Authentication',
  
  // Parsing
  'parse.path': 'Parse URL Path',
  'parse.query': 'Parse Query String',
  'parse.json': 'Parse JSON Body',
  
  // Normalization & Validation
  'normalize.entity': 'Normalize Data',
  'validate.entity': 'Validate Data',
  'validate.json_schema': 'Validate Against Schema',
  
  // Transactions
  'txn.begin': 'Start Transaction',
  'txn.commit': 'Save Changes',
  'txn.abort': 'Cancel Changes',
  
  // Key-Value Store
  'kv.get': 'Fetch Data',
  'kv.put': 'Store Data',
  'kv.cas_put': 'Store Data (If New)',
  'kv.delete': 'Delete Data',
  
  // Blob Store
  'blob.get': 'Download File',
  'blob.put': 'Upload File',
  'blob.verify_digest': 'Verify File Integrity',
  
  // Index
  'index.query': 'Search Index',
  'index.upsert': 'Update Index',
  'index.delete': 'Remove from Index',
  
  // Cache
  'cache.get': 'Check Cache',
  'cache.put': 'Save to Cache',
  
  // Proxy
  'proxy.fetch': 'Fetch from Upstream',
  
  // Response
  'respond.json': 'Return JSON Response',
  'respond.bytes': 'Return Binary Data',
  'respond.redirect': 'Redirect Request',
  'respond.error': 'Return Error',
  
  // Events
  'emit.event': 'Log Event',
  
  // Utilities
  'time.now_iso8601': 'Get Current Time',
  'string.format': 'Format String',
};

export const operationDescriptions = {
  // Authentication
  'auth.require_scopes': 'Checks if the user has the required permissions to access this endpoint',
  
  // Parsing
  'parse.path': 'Extracts parameters from the URL path (namespace, name, version, etc.)',
  'parse.query': 'Extracts parameters from the query string (?key=value)',
  'parse.json': 'Parses the JSON request body into usable data',
  
  // Normalization & Validation
  'normalize.entity': 'Cleans up and standardizes the input data (trim, lowercase, etc.)',
  'validate.entity': 'Ensures the data meets all validation rules and constraints',
  'validate.json_schema': 'Validates data against a JSON schema definition',
  
  // Transactions
  'txn.begin': 'Starts a database transaction to ensure data consistency',
  'txn.commit': 'Saves all changes made during the transaction',
  'txn.abort': 'Rolls back all changes if something goes wrong',
  
  // Key-Value Store
  'kv.get': 'Retrieves data from the key-value store',
  'kv.put': 'Stores data in the key-value store',
  'kv.cas_put': 'Stores data only if it doesn\'t already exist (compare-and-swap)',
  'kv.delete': 'Removes data from the key-value store',
  
  // Blob Store
  'blob.get': 'Downloads a binary file from storage',
  'blob.put': 'Uploads a binary file and computes its content hash',
  'blob.verify_digest': 'Verifies the file\'s integrity using SHA256 checksum',
  
  // Index
  'index.query': 'Searches the index for matching records',
  'index.upsert': 'Adds or updates a record in the index',
  'index.delete': 'Removes a record from the index',
  
  // Cache
  'cache.get': 'Checks if a cached version of the data exists',
  'cache.put': 'Stores data in the cache with a time-to-live',
  
  // Proxy
  'proxy.fetch': 'Fetches data from an external upstream repository',
  
  // Response
  'respond.json': 'Returns a JSON response to the client',
  'respond.bytes': 'Returns binary data (files, blobs) to the client',
  'respond.redirect': 'Redirects the client to another URL',
  'respond.error': 'Returns an error response with status code and message',
  
  // Events
  'emit.event': 'Records an event for audit trail and replication',
  
  // Utilities
  'time.now_iso8601': 'Gets the current timestamp in ISO 8601 format',
  'string.format': 'Formats a string with variable interpolation',
};

export const operationCategories = {
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

export const categoryColors = {
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

/**
 * Get a human-readable label for an operation
 * @param {string} operation - The operation key (e.g., 'kv.get')
 * @returns {string} - Human-readable label (e.g., 'Fetch Data')
 */
export function getOperationLabel(operation) {
  return operationLabels[operation] || operation;
}

/**
 * Get a description for an operation
 * @param {string} operation - The operation key
 * @returns {string} - Human-readable description
 */
export function getOperationDescription(operation) {
  return operationDescriptions[operation] || 'No description available';
}

/**
 * Get the category for an operation
 * @param {string} operation - The operation key
 * @returns {string} - Category name
 */
export function getOperationCategory(operation) {
  return operationCategories[operation] || 'Other';
}

/**
 * Get the color for a category
 * @param {string} category - The category name
 * @returns {string} - Hex color code
 */
export function getCategoryColor(category) {
  return categoryColors[category] || '#95a5a6';
}

/**
 * Format a pipeline step for display
 * @param {object} step - The pipeline step object
 * @returns {object} - Formatted step with label, description, category, and technical operation
 */
export function formatPipelineStep(step) {
  const operation = step.op || step.operation;
  return {
    operation,
    label: getOperationLabel(operation),
    description: getOperationDescription(operation),
    category: getOperationCategory(operation),
    categoryColor: getCategoryColor(getOperationCategory(operation)),
    args: step.args || {},
  };
}
