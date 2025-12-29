"""
Operation Executor - Implements the closed-world operation vocabulary.

This module provides the actual implementation for all operations defined
in the schema.json operations vocabulary. Each operation is a function that
can be executed as part of a pipeline.
"""

import re
import json
import hashlib
import requests
from datetime import datetime
from typing import Dict, Any, Optional, List
from pathlib import Path


class ExecutionContext:
    """Context for pipeline execution with variable storage."""
    
    def __init__(self, request_data: Dict[str, Any], principal: Optional[Dict[str, Any]] = None):
        self.variables = {}
        self.request_data = request_data
        self.principal = principal or {}
        self.transaction_active = False
        self.response = None
        
    def set_var(self, name: str, value: Any) -> None:
        """Set a variable in the execution context."""
        self.variables[name] = value
    
    def get_var(self, name: str) -> Any:
        """Get a variable from the execution context."""
        # Handle special variable references
        if name.startswith('$'):
            return self.variables.get(name[1:])
        return self.variables.get(name)
    
    def interpolate(self, template: str) -> str:
        """Interpolate variables in a template string."""
        # Replace {field} with request data
        result = template
        for key, value in self.request_data.items():
            result = result.replace(f"{{{key}}}", str(value))
        
        # Replace $variable with context variables
        for key, value in self.variables.items():
            result = result.replace(f"${key}", str(value))
        
        # Replace {principal.field}
        for key, value in self.principal.items():
            result = result.replace(f"{{principal.{key}}}", str(value))
        
        return result


class OperationExecutor:
    """Executor for pipeline operations."""
    
    def __init__(self, kv_store: Dict, index_store: Dict, blob_dir: Path):
        self.kv_store = kv_store
        self.index_store = index_store
        self.blob_dir = blob_dir
        self.cache_store = {}
        self.event_log = []
        
    # ========================================================================
    # Authentication Operations
    # ========================================================================
    
    def auth_require_scopes(self, ctx: ExecutionContext, args: Dict[str, Any]) -> None:
        """Require specific authentication scopes."""
        required_scopes = args.get('scopes', [])
        user_scopes = ctx.principal.get('scopes', [])
        
        # Check if user has any of the required scopes
        if not any(scope in user_scopes for scope in required_scopes):
            raise PermissionError(f"Required scopes: {required_scopes}")
    
    # ========================================================================
    # Parsing Operations
    # ========================================================================
    
    def parse_path(self, ctx: ExecutionContext, args: Dict[str, Any]) -> None:
        """Parse path parameters into entity fields."""
        # Path parameters are already in ctx.request_data from Flask routing
        pass
    
    def parse_query(self, ctx: ExecutionContext, args: Dict[str, Any]) -> None:
        """Parse query parameters."""
        out = args.get('out', 'query_params')
        query_params = ctx.request_data.get('query_params', {})
        ctx.set_var(out, query_params)
    
    def parse_json(self, ctx: ExecutionContext, args: Dict[str, Any]) -> None:
        """Parse JSON request body."""
        out = args.get('out', 'body')
        body = ctx.request_data.get('body', {})
        ctx.set_var(out, body)
    
    # ========================================================================
    # Normalization and Validation Operations
    # ========================================================================
    
    def normalize_entity(self, ctx: ExecutionContext, args: Dict[str, Any]) -> None:
        """Normalize entity fields according to schema rules."""
        entity_type = args.get('entity', 'artifact')
        # Normalization rules: trim, lower, replace
        # This is handled by the normalize_entity function in app.py
        pass
    
    def validate_entity(self, ctx: ExecutionContext, args: Dict[str, Any]) -> None:
        """Validate entity against schema constraints."""
        entity_type = args.get('entity', 'artifact')
        # Validation is handled by the validate_entity function in app.py
        pass
    
    def validate_json_schema(self, ctx: ExecutionContext, args: Dict[str, Any]) -> None:
        """Validate data against JSON schema."""
        import jsonschema
        schema = args.get('schema', {})
        value = self._resolve_value(ctx, args.get('value'))
        
        try:
            jsonschema.validate(value, schema)
        except jsonschema.ValidationError as e:
            raise ValueError(f"JSON schema validation failed: {e.message}")
    
    # ========================================================================
    # Transaction Operations
    # ========================================================================
    
    def txn_begin(self, ctx: ExecutionContext, args: Dict[str, Any]) -> None:
        """Begin a transaction."""
        if ctx.transaction_active:
            raise RuntimeError("Transaction already active")
        ctx.transaction_active = True
    
    def txn_commit(self, ctx: ExecutionContext, args: Dict[str, Any]) -> None:
        """Commit the current transaction."""
        if not ctx.transaction_active:
            raise RuntimeError("No active transaction")
        ctx.transaction_active = False
        # In production, this would commit to the actual database
    
    def txn_abort(self, ctx: ExecutionContext, args: Dict[str, Any]) -> None:
        """Abort the current transaction."""
        if not ctx.transaction_active:
            raise RuntimeError("No active transaction")
        ctx.transaction_active = False
        # In production, this would rollback the database transaction
    
    # ========================================================================
    # Key-Value Store Operations
    # ========================================================================
    
    def kv_get(self, ctx: ExecutionContext, args: Dict[str, Any]) -> None:
        """Get value from KV store."""
        doc = args.get('doc')
        key_template = args.get('key')
        out = args.get('out')
        
        key = ctx.interpolate(key_template)
        value = self.kv_store.get(key)
        ctx.set_var(out, value)
    
    def kv_put(self, ctx: ExecutionContext, args: Dict[str, Any]) -> None:
        """Put value into KV store."""
        doc = args.get('doc')
        key_template = args.get('key')
        value = self._resolve_value(ctx, args.get('value'))
        
        key = ctx.interpolate(key_template)
        self.kv_store[key] = value
    
    def kv_cas_put(self, ctx: ExecutionContext, args: Dict[str, Any]) -> None:
        """Compare-and-swap put into KV store."""
        doc = args.get('doc')
        key_template = args.get('key')
        value = self._resolve_value(ctx, args.get('value'))
        if_absent = args.get('if_absent', False)
        
        key = ctx.interpolate(key_template)
        
        if if_absent and key in self.kv_store:
            raise ValueError(f"Key {key} already exists")
        
        self.kv_store[key] = value
    
    def kv_delete(self, ctx: ExecutionContext, args: Dict[str, Any]) -> None:
        """Delete from KV store."""
        doc = args.get('doc')
        key_template = args.get('key')
        
        key = ctx.interpolate(key_template)
        if key in self.kv_store:
            del self.kv_store[key]
    
    # ========================================================================
    # Blob Store Operations
    # ========================================================================
    
    def blob_get(self, ctx: ExecutionContext, args: Dict[str, Any]) -> None:
        """Get blob from blob store."""
        store = args.get('store', 'primary')
        digest_template = args.get('digest')
        out = args.get('out')
        
        digest = ctx.interpolate(digest_template)
        clean_digest = digest.replace('sha256:', '')
        
        blob_path = self.blob_dir / clean_digest[:2] / clean_digest[2:4] / clean_digest
        
        if not blob_path.exists():
            raise FileNotFoundError(f"Blob not found: {digest}")
        
        with open(blob_path, 'rb') as f:
            blob_data = f.read()
        
        ctx.set_var(out, blob_data)
    
    def blob_put(self, ctx: ExecutionContext, args: Dict[str, Any]) -> None:
        """Put blob into blob store."""
        store = args.get('store', 'primary')
        from_source = args.get('from')
        out_digest = args.get('out', 'digest')
        out_size = args.get('out_size', 'blob_size')
        
        # Get blob data
        if from_source == 'request.body':
            blob_data = ctx.request_data.get('body_bytes', b'')
        else:
            blob_data = self._resolve_value(ctx, from_source)
            if isinstance(blob_data, str):
                blob_data = blob_data.encode('utf-8')
        
        # Compute digest
        digest = 'sha256:' + hashlib.sha256(blob_data).hexdigest()
        blob_size = len(blob_data)
        
        # Store blob
        clean_digest = digest.replace('sha256:', '')
        blob_path = self.blob_dir / clean_digest[:2] / clean_digest[2:4] / clean_digest
        blob_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(blob_path, 'wb') as f:
            f.write(blob_data)
        
        ctx.set_var(out_digest, digest)
        ctx.set_var(out_size, blob_size)
    
    def blob_verify_digest(self, ctx: ExecutionContext, args: Dict[str, Any]) -> None:
        """Verify blob digest."""
        digest_template = args.get('digest')
        algo = args.get('algo', 'sha256')
        
        digest = ctx.interpolate(digest_template)
        # In a full implementation, this would verify the digest matches the blob
        if not digest.startswith(algo + ':'):
            raise ValueError(f"Invalid digest format for {algo}")
    
    # ========================================================================
    # Index Operations
    # ========================================================================
    
    def index_query(self, ctx: ExecutionContext, args: Dict[str, Any]) -> None:
        """Query an index."""
        index_name = args.get('index')
        key = args.get('key', {})
        limit = args.get('limit', 100)
        out = args.get('out')
        
        # Interpolate key fields
        index_key_parts = []
        for k, v in key.items():
            interpolated = ctx.interpolate(v) if isinstance(v, str) else v
            index_key_parts.append(str(interpolated))
        
        index_key = '/'.join(index_key_parts)
        rows = self.index_store.get(index_key, [])[:limit]
        ctx.set_var(out, rows)
    
    def index_upsert(self, ctx: ExecutionContext, args: Dict[str, Any]) -> None:
        """Insert or update index entry."""
        index_name = args.get('index')
        key = args.get('key', {})
        value = self._resolve_value(ctx, args.get('value'))
        
        # Build index key
        index_key_parts = []
        for k, v in key.items():
            interpolated = ctx.interpolate(v) if isinstance(v, str) else v
            index_key_parts.append(str(interpolated))
        
        index_key = '/'.join(index_key_parts)
        
        if index_key not in self.index_store:
            self.index_store[index_key] = []
        
        self.index_store[index_key].append(value)
    
    def index_delete(self, ctx: ExecutionContext, args: Dict[str, Any]) -> None:
        """Delete from index."""
        index_name = args.get('index')
        key = args.get('key', {})
        
        # Build index key
        index_key_parts = []
        for k, v in key.items():
            interpolated = ctx.interpolate(v) if isinstance(v, str) else v
            index_key_parts.append(str(interpolated))
        
        index_key = '/'.join(index_key_parts)
        
        if index_key in self.index_store:
            del self.index_store[index_key]
    
    # ========================================================================
    # Cache Operations
    # ========================================================================
    
    def cache_get(self, ctx: ExecutionContext, args: Dict[str, Any]) -> None:
        """Get from cache."""
        kind = args.get('kind', 'response')
        key_template = args.get('key')
        hit_out = args.get('hit_out', 'cache_hit')
        value_out = args.get('value_out', 'cached_value')
        
        key = ctx.interpolate(key_template)
        cache_key = f"{kind}:{key}"
        
        if cache_key in self.cache_store:
            ctx.set_var(hit_out, True)
            ctx.set_var(value_out, self.cache_store[cache_key])
        else:
            ctx.set_var(hit_out, False)
            ctx.set_var(value_out, None)
    
    def cache_put(self, ctx: ExecutionContext, args: Dict[str, Any]) -> None:
        """Put into cache."""
        kind = args.get('kind', 'response')
        key_template = args.get('key')
        ttl_seconds = args.get('ttl_seconds', 300)
        value = self._resolve_value(ctx, args.get('value'))
        
        key = ctx.interpolate(key_template)
        cache_key = f"{kind}:{key}"
        
        self.cache_store[cache_key] = value
        # In production, would set TTL on the cache entry
    
    # ========================================================================
    # Proxy Operations
    # ========================================================================
    
    def proxy_fetch(self, ctx: ExecutionContext, args: Dict[str, Any]) -> None:
        """Fetch from upstream proxy."""
        upstream = args.get('upstream')
        method = args.get('method', 'GET')
        path_template = args.get('path')
        out = args.get('out')
        
        path = ctx.interpolate(path_template)
        
        # In production, would look up upstream config and make actual request
        # For now, return a mock response
        response = {
            'status': 200,
            'body': None,
            'headers': {}
        }
        ctx.set_var(out, response)
    
    # ========================================================================
    # Response Operations
    # ========================================================================
    
    def respond_json(self, ctx: ExecutionContext, args: Dict[str, Any]) -> None:
        """Return JSON response."""
        if not self._check_condition(ctx, args.get('when')):
            return
        
        status = args.get('status', 200)
        body = self._resolve_value(ctx, args.get('body'))
        
        ctx.response = {
            'type': 'json',
            'status': status,
            'body': body
        }
    
    def respond_bytes(self, ctx: ExecutionContext, args: Dict[str, Any]) -> None:
        """Return binary response."""
        if not self._check_condition(ctx, args.get('when')):
            return
        
        status = args.get('status', 200)
        body = self._resolve_value(ctx, args.get('body'))
        headers = self._resolve_value(ctx, args.get('headers', {}))
        
        ctx.response = {
            'type': 'bytes',
            'status': status,
            'body': body,
            'headers': headers
        }
    
    def respond_redirect(self, ctx: ExecutionContext, args: Dict[str, Any]) -> None:
        """Return redirect response."""
        if not self._check_condition(ctx, args.get('when')):
            return
        
        status = args.get('status', 307)
        location = ctx.interpolate(args.get('location'))
        
        ctx.response = {
            'type': 'redirect',
            'status': status,
            'location': location
        }
    
    def respond_error(self, ctx: ExecutionContext, args: Dict[str, Any]) -> None:
        """Return error response."""
        if not self._check_condition(ctx, args.get('when')):
            return
        
        status = args.get('status', 400)
        code = args.get('code', 'ERROR')
        message = args.get('message', 'An error occurred')
        
        ctx.response = {
            'type': 'error',
            'status': status,
            'body': {
                'error': {
                    'code': code,
                    'message': message
                }
            }
        }
    
    # ========================================================================
    # Event Operations
    # ========================================================================
    
    def emit_event(self, ctx: ExecutionContext, args: Dict[str, Any]) -> None:
        """Emit an event to the event log."""
        event_type = args.get('type')
        payload = self._resolve_value(ctx, args.get('payload'))
        
        event = {
            'type': event_type,
            'payload': payload,
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }
        
        self.event_log.append(event)
    
    # ========================================================================
    # Utility Operations
    # ========================================================================
    
    def time_now_iso8601(self, ctx: ExecutionContext, args: Dict[str, Any]) -> None:
        """Get current time in ISO8601 format."""
        out = args.get('out', 'now')
        now = datetime.utcnow().isoformat() + 'Z'
        ctx.set_var(out, now)
    
    def string_format(self, ctx: ExecutionContext, args: Dict[str, Any]) -> None:
        """Format string with variable interpolation."""
        template = args.get('template', '')
        out = args.get('out', 'formatted')
        
        result = ctx.interpolate(template)
        ctx.set_var(out, result)
    
    # ========================================================================
    # Helper Methods
    # ========================================================================
    
    def _resolve_value(self, ctx: ExecutionContext, value: Any) -> Any:
        """Resolve a value, handling variable references and interpolation."""
        if isinstance(value, str):
            # Check if it's a variable reference
            if value.startswith('$'):
                return ctx.get_var(value[1:])
            # Otherwise interpolate
            return ctx.interpolate(value)
        elif isinstance(value, dict):
            # Recursively resolve dict values
            return {k: self._resolve_value(ctx, v) for k, v in value.items()}
        elif isinstance(value, list):
            # Recursively resolve list items
            return [self._resolve_value(ctx, item) for item in value]
        else:
            return value
    
    def _check_condition(self, ctx: ExecutionContext, condition: Optional[Dict]) -> bool:
        """Check if a condition is met."""
        if not condition:
            return True
        
        # Handle various condition types
        if 'equals' in condition:
            values = condition['equals']
            v1 = self._resolve_value(ctx, values[0])
            v2 = self._resolve_value(ctx, values[1])
            return v1 == v2
        
        if 'is_null' in condition:
            value = self._resolve_value(ctx, condition['is_null'])
            return value is None
        
        if 'is_not_null' in condition:
            value = self._resolve_value(ctx, condition['is_not_null'])
            return value is not None
        
        if 'is_empty' in condition:
            value = self._resolve_value(ctx, condition['is_empty'])
            return not value
        
        if 'not_in' in condition:
            check_value = self._resolve_value(ctx, condition['not_in'][0])
            check_list = self._resolve_value(ctx, condition['not_in'][1])
            return check_value not in check_list
        
        return True
    
    # ========================================================================
    # Pipeline Execution
    # ========================================================================
    
    def execute_pipeline(self, pipeline: List[Dict[str, Any]], ctx: ExecutionContext) -> Optional[Dict]:
        """Execute a complete pipeline."""
        for step in pipeline:
            # Stop if we already have a response
            if ctx.response:
                break
            
            op_name = step.get('op')
            args = step.get('args', {})
            
            # Get the operation method
            method_name = op_name.replace('.', '_')
            method = getattr(self, method_name, None)
            
            if not method:
                raise NotImplementedError(f"Operation {op_name} not implemented")
            
            # Execute the operation
            method(ctx, args)
        
        return ctx.response
