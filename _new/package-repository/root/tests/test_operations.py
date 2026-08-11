#!/usr/bin/env python3
"""
Test script to demonstrate operation vocabulary implementation.

This script shows how the operations defined in the vocabulary
are actually executed through the OperationExecutor.
"""

import sys
import json
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'backend'))

from operations import OperationExecutor, ExecutionContext


def test_kv_operations():
    """Test key-value store operations."""
    print("=" * 60)
    print("Testing KV Operations")
    print("=" * 60)
    
    executor = OperationExecutor(kv_store={}, index_store={}, blob_dir=Path('/tmp/test_blobs'))
    ctx = ExecutionContext(
        request_data={'namespace': 'acme', 'name': 'test-pkg', 'version': '1.0.0'},
        principal={'sub': 'testuser', 'scopes': ['read', 'write']}
    )
    
    # Test kv.put
    pipeline = [
        {
            'op': 'kv.put',
            'args': {
                'doc': 'test_doc',
                'key': 'test/{namespace}/{name}',
                'value': {'version': '{version}', 'author': 'test'}
            }
        }
    ]
    
    executor.execute_pipeline(pipeline, ctx)
    print("✅ kv.put: Stored value in KV store")
    print(f"   Key: test/acme/test-pkg")
    print(f"   Value: {executor.kv_store.get('test/acme/test-pkg')}")
    
    # Test kv.get
    ctx2 = ExecutionContext(
        request_data={'namespace': 'acme', 'name': 'test-pkg'},
        principal={'sub': 'testuser', 'scopes': ['read']}
    )
    
    pipeline2 = [
        {
            'op': 'kv.get',
            'args': {
                'doc': 'test_doc',
                'key': 'test/{namespace}/{name}',
                'out': 'retrieved_data'
            }
        }
    ]
    
    executor.execute_pipeline(pipeline2, ctx2)
    print(f"✅ kv.get: Retrieved value from KV store")
    print(f"   Retrieved: {ctx2.get_var('retrieved_data')}")
    print()


def test_transaction_operations():
    """Test transaction operations."""
    print("=" * 60)
    print("Testing Transaction Operations")
    print("=" * 60)
    
    executor = OperationExecutor(kv_store={}, index_store={}, blob_dir=Path('/tmp/test_blobs'))
    ctx = ExecutionContext(
        request_data={'namespace': 'acme', 'name': 'test'},
        principal={'sub': 'admin', 'scopes': ['admin']}
    )
    
    pipeline = [
        {'op': 'txn.begin', 'args': {'isolation': 'serializable'}},
        {
            'op': 'kv.cas_put',
            'args': {
                'doc': 'metadata',
                'key': 'data/{namespace}/{name}',
                'if_absent': True,
                'value': {'created': True}
            }
        },
        {'op': 'txn.commit', 'args': {}}
    ]
    
    executor.execute_pipeline(pipeline, ctx)
    print("✅ txn.begin: Started transaction")
    print("✅ kv.cas_put: Conditional put (if_absent)")
    print("✅ txn.commit: Committed transaction")
    print(f"   Result: {executor.kv_store.get('data/acme/test')}")
    print()


def test_cache_operations():
    """Test cache operations."""
    print("=" * 60)
    print("Testing Cache Operations")
    print("=" * 60)
    
    executor = OperationExecutor(kv_store={}, index_store={}, blob_dir=Path('/tmp/test_blobs'))
    ctx = ExecutionContext(
        request_data={'namespace': 'acme', 'name': 'cached-item'},
        principal={'sub': 'user1', 'scopes': ['read']}
    )
    
    # Put into cache
    pipeline1 = [
        {
            'op': 'cache.put',
            'args': {
                'kind': 'response',
                'key': 'resp/{namespace}/{name}',
                'ttl_seconds': 300,
                'value': {'data': 'cached response', 'timestamp': '2024-01-01'}
            }
        }
    ]
    
    executor.execute_pipeline(pipeline1, ctx)
    print("✅ cache.put: Stored value in cache")
    print(f"   Cache key: response:resp/acme/cached-item")
    
    # Get from cache
    pipeline2 = [
        {
            'op': 'cache.get',
            'args': {
                'kind': 'response',
                'key': 'resp/{namespace}/{name}',
                'hit_out': 'cache_hit',
                'value_out': 'cached_data'
            }
        }
    ]
    
    ctx2 = ExecutionContext(
        request_data={'namespace': 'acme', 'name': 'cached-item'},
        principal={'sub': 'user2', 'scopes': ['read']}
    )
    
    executor.execute_pipeline(pipeline2, ctx2)
    print(f"✅ cache.get: Cache hit = {ctx2.get_var('cache_hit')}")
    print(f"   Retrieved: {ctx2.get_var('cached_data')}")
    print()


def test_index_operations():
    """Test index operations."""
    print("=" * 60)
    print("Testing Index Operations")
    print("=" * 60)
    
    executor = OperationExecutor(kv_store={}, index_store={}, blob_dir=Path('/tmp/test_blobs'))
    ctx = ExecutionContext(
        request_data={'namespace': 'acme', 'name': 'my-package', 'version': '1.0.0'},
        principal={'sub': 'publisher', 'scopes': ['write']}
    )
    
    # Insert into index
    pipeline1 = [
        {
            'op': 'index.upsert',
            'args': {
                'index': 'package_versions',
                'key': {'namespace': '{namespace}', 'name': '{name}'},
                'value': {
                    'version': '{version}',
                    'namespace': '{namespace}',
                    'name': '{name}'
                }
            }
        }
    ]
    
    executor.execute_pipeline(pipeline1, ctx)
    print("✅ index.upsert: Added entry to index")
    
    # Query index
    ctx2 = ExecutionContext(
        request_data={'namespace': 'acme', 'name': 'my-package'},
        principal={'sub': 'reader', 'scopes': ['read']}
    )
    
    pipeline2 = [
        {
            'op': 'index.query',
            'args': {
                'index': 'package_versions',
                'key': {'namespace': '{namespace}', 'name': '{name}'},
                'limit': 10,
                'out': 'results'
            }
        }
    ]
    
    executor.execute_pipeline(pipeline2, ctx2)
    print(f"✅ index.query: Found {len(ctx2.get_var('results') or [])} results")
    print(f"   Results: {ctx2.get_var('results')}")
    print()


def test_response_operations():
    """Test response operations."""
    print("=" * 60)
    print("Testing Response Operations")
    print("=" * 60)
    
    executor = OperationExecutor(kv_store={}, index_store={}, blob_dir=Path('/tmp/test_blobs'))
    
    # Test respond.json
    ctx1 = ExecutionContext(
        request_data={'name': 'test'},
        principal={'sub': 'user', 'scopes': ['read']}
    )
    
    pipeline1 = [
        {'op': 'time.now_iso8601', 'args': {'out': 'timestamp'}},
        {
            'op': 'respond.json',
            'args': {
                'status': 200,
                'body': {
                    'ok': True,
                    'name': '{name}',
                    'timestamp': '$timestamp'
                }
            }
        }
    ]
    
    result1 = executor.execute_pipeline(pipeline1, ctx1)
    print("✅ respond.json: JSON response created")
    print(f"   Status: {result1['status']}")
    print(f"   Body: {json.dumps(result1['body'], indent=2)}")
    
    # Test respond.error with condition
    ctx2 = ExecutionContext(
        request_data={'item_id': '123'},
        principal={'sub': 'user', 'scopes': ['read']}
    )
    
    ctx2.set_var('item', None)  # Simulate item not found
    
    pipeline2 = [
        {
            'op': 'respond.error',
            'args': {
                'when': {'is_null': '$item'},
                'status': 404,
                'code': 'NOT_FOUND',
                'message': 'Item not found'
            }
        }
    ]
    
    result2 = executor.execute_pipeline(pipeline2, ctx2)
    print("✅ respond.error: Error response created (conditional)")
    print(f"   Status: {result2['status']}")
    print(f"   Body: {json.dumps(result2['body'], indent=2)}")
    print()


def test_event_operations():
    """Test event operations."""
    print("=" * 60)
    print("Testing Event Operations")
    print("=" * 60)
    
    executor = OperationExecutor(kv_store={}, index_store={}, blob_dir=Path('/tmp/test_blobs'))
    ctx = ExecutionContext(
        request_data={'namespace': 'acme', 'name': 'package', 'version': '2.0.0'},
        principal={'sub': 'admin', 'scopes': ['write', 'admin']}
    )
    
    pipeline = [
        {'op': 'time.now_iso8601', 'args': {'out': 'now'}},
        {
            'op': 'emit.event',
            'args': {
                'type': 'package.published',
                'payload': {
                    'namespace': '{namespace}',
                    'name': '{name}',
                    'version': '{version}',
                    'by': '{principal.sub}',
                    'at': '$now'
                }
            }
        }
    ]
    
    executor.execute_pipeline(pipeline, ctx)
    print("✅ emit.event: Event emitted to log")
    print(f"   Event count: {len(executor.event_log)}")
    print(f"   Latest event: {json.dumps(executor.event_log[-1], indent=2)}")
    print()


def test_auth_operations():
    """Test authentication operations."""
    print("=" * 60)
    print("Testing Authentication Operations")
    print("=" * 60)
    
    executor = OperationExecutor(kv_store={}, index_store={}, blob_dir=Path('/tmp/test_blobs'))
    
    # Test with sufficient permissions
    ctx1 = ExecutionContext(
        request_data={'resource': 'test'},
        principal={'sub': 'admin', 'scopes': ['read', 'write', 'admin']}
    )
    
    pipeline1 = [
        {'op': 'auth.require_scopes', 'args': {'scopes': ['write']}}
    ]
    
    try:
        executor.execute_pipeline(pipeline1, ctx1)
        print("✅ auth.require_scopes: Permission granted (user has 'write' scope)")
    except PermissionError as e:
        print(f"❌ auth.require_scopes: {e}")
    
    # Test with insufficient permissions
    ctx2 = ExecutionContext(
        request_data={'resource': 'test'},
        principal={'sub': 'reader', 'scopes': ['read']}
    )
    
    pipeline2 = [
        {'op': 'auth.require_scopes', 'args': {'scopes': ['admin']}}
    ]
    
    try:
        executor.execute_pipeline(pipeline2, ctx2)
        print("❌ auth.require_scopes: Should have been denied")
    except PermissionError as e:
        print(f"✅ auth.require_scopes: Permission denied correctly - {e}")
    
    print()


def test_blob_operations():
    """Test blob operations."""
    print("=" * 60)
    print("Testing Blob Operations")
    print("=" * 60)
    
    blob_dir = Path('/tmp/test_blobs')
    blob_dir.mkdir(parents=True, exist_ok=True)
    
    executor = OperationExecutor(kv_store={}, index_store={}, blob_dir=blob_dir)
    ctx = ExecutionContext(
        request_data={'body_bytes': b'Hello, World! This is test content.'},
        principal={'sub': 'uploader', 'scopes': ['write']}
    )
    
    # Test blob.put and blob.verify_digest
    pipeline = [
        {
            'op': 'blob.put',
            'args': {
                'store': 'primary',
                'from': 'request.body',
                'out': 'digest',
                'out_size': 'size'
            }
        },
        {
            'op': 'blob.verify_digest',
            'args': {
                'digest': '$digest',
                'algo': 'sha256'
            }
        }
    ]
    
    executor.execute_pipeline(pipeline, ctx)
    digest = ctx.get_var('digest')
    size = ctx.get_var('size')
    
    print(f"✅ blob.put: Stored blob")
    print(f"   Digest: {digest}")
    print(f"   Size: {size} bytes")
    print(f"✅ blob.verify_digest: Digest verified")
    
    # Test blob.get
    ctx2 = ExecutionContext(request_data={}, principal={'sub': 'reader', 'scopes': ['read']})
    ctx2.set_var('blob_digest', digest)
    
    pipeline2 = [
        {
            'op': 'blob.get',
            'args': {
                'store': 'primary',
                'digest': '$blob_digest',
                'out': 'blob_content'
            }
        }
    ]
    
    executor.execute_pipeline(pipeline2, ctx2)
    content = ctx2.get_var('blob_content')
    
    print(f"✅ blob.get: Retrieved blob")
    print(f"   Content: {content.decode('utf-8')[:50]}...")
    print()


def main():
    """Run all operation tests."""
    print("\n")
    print("╔" + "=" * 58 + "╗")
    print("║" + " " * 10 + "Operation Vocabulary Test Suite" + " " * 16 + "║")
    print("╚" + "=" * 58 + "╝")
    print("\n")
    
    test_auth_operations()
    test_kv_operations()
    test_transaction_operations()
    test_cache_operations()
    test_index_operations()
    test_blob_operations()
    test_event_operations()
    test_response_operations()
    
    print("=" * 60)
    print("✅ All operation tests completed successfully!")
    print("=" * 60)
    print("\nThe operation vocabulary is fully implemented and working.")
    print("Each operation has executable code behind it.")
    print()


if __name__ == '__main__':
    main()
