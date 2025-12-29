"""
Package Repository Server - Flask Backend
Implements the schema.json declarative repository specification.
Configuration is stored in SQLite database - schema.json is only used for initial load.
"""

import json
import os
import hashlib
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional

from flask import Flask, request, jsonify, send_file, Response
from flask_cors import CORS
import jwt
from werkzeug.exceptions import HTTPException
import jsonschema

import auth_sqlalchemy as auth_module
import config_db_sqlalchemy as config_db
from rocksdb_store import RocksDBStore

app = Flask(__name__)
CORS(app)

# Load schema.json for reference
SCHEMA_PATH = Path(__file__).parent.parent / "schema.json"
try:
    with open(SCHEMA_PATH) as f:
        SCHEMA = json.load(f)
except (FileNotFoundError, json.JSONDecodeError) as e:
    print(f"Error loading schema.json: {e}")
    SCHEMA = {"ops": {"limits": {"max_request_body_bytes": 2147483648}}}  # Default fallback

# Configuration is now loaded from database using SQLAlchemy
# schema.json is only used once during initial database setup
DB_CONFIG = config_db.get_repository_config()

# Configuration
DATA_DIR = Path(os.environ.get("DATA_DIR", "/tmp/data"))
BLOB_DIR = DATA_DIR / "blobs"
META_DIR = DATA_DIR / "meta"
ROCKSDB_DIR = DATA_DIR / "rocksdb"
JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret-key")

# Initialize storage
BLOB_DIR.mkdir(parents=True, exist_ok=True)
META_DIR.mkdir(parents=True, exist_ok=True)
ROCKSDB_DIR.mkdir(parents=True, exist_ok=True)

# RocksDB KV store (replaces in-memory dict)
kv_store = RocksDBStore(str(ROCKSDB_DIR))
index_store: Dict[str, list] = {}


class RepositoryError(Exception):
    """Base exception for repository errors."""
    def __init__(self, message: str, status_code: int = 400, code: str = "ERROR"):
        self.message = message
        self.status_code = status_code
        self.code = code
        super().__init__(self.message)


def get_blob_path(digest: str) -> Path:
    """Generate blob storage path based on database configuration."""
    # Remove sha256: prefix if present
    clean_digest = digest.replace("sha256:", "")
    
    # Get blob store config from database
    config = config_db.get_repository_config()
    if config and config.get('blob_stores'):
        # Use first blob store for now (could be extended to support multiple)
        blob_store = config['blob_stores'][0]
        # Use path template from database: sha256/{digest:0:2}/{digest:2:2}/{digest}
        return BLOB_DIR / clean_digest[:2] / clean_digest[2:4] / clean_digest
    
    # Fallback to default path
    return BLOB_DIR / clean_digest[:2] / clean_digest[2:4] / clean_digest


def verify_token(token: str) -> Dict[str, Any]:
    """Verify JWT token and return principal."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.InvalidTokenError:
        raise RepositoryError("Invalid token", 401, "UNAUTHORIZED")


def require_scopes(required_scopes: list) -> Optional[Dict[str, Any]]:
    """Check if request has required scopes."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        # For MVP, allow unauthenticated read access
        if "read" in required_scopes:
            return {"sub": "anonymous", "scopes": ["read"]}
        raise RepositoryError("Missing authorization", 401, "UNAUTHORIZED")
    
    token = auth_header[7:]
    principal = verify_token(token)
    
    user_scopes = principal.get("scopes", [])
    if not any(scope in user_scopes for scope in required_scopes):
        raise RepositoryError("Insufficient permissions", 403, "FORBIDDEN")
    
    return principal


def get_entity_config(entity_name: str = "artifact") -> Optional[Dict[str, Any]]:
    """Get entity configuration from database."""
    config = config_db.get_repository_config()
    if not config or 'entities' not in config:
        return None
    
    for entity in config['entities']:
        if entity['name'] == entity_name:
            return entity
    
    return None


def normalize_entity(entity_data: Dict[str, Any], entity_type: str = "artifact") -> Dict[str, Any]:
    """Normalize entity fields based on database schema configuration."""
    entity_config = get_entity_config(entity_type)
    if not entity_config:
        return entity_data
    
    normalized = {}
    
    for field in entity_config.get('fields', []):
        field_name = field['name']
        value = entity_data.get(field_name)
        
        if value is None:
            if not field.get('optional', False):
                normalized[field_name] = ""
            continue
        
        # Apply normalization rules from database
        normalizations = json.loads(field.get('normalizations', '[]'))
        for norm in normalizations:
            if norm == "trim":
                value = value.strip()
            elif norm == "lower":
                value = value.lower()
            elif norm.startswith("replace:"):
                parts = norm.split(":")
                if len(parts) == 3:
                    value = value.replace(parts[1], parts[2])
        
        normalized[field_name] = value
    
    return normalized


def validate_entity(entity_data: Dict[str, Any], entity_type: str = "artifact") -> None:
    """Validate entity against database schema constraints."""
    entity_config = get_entity_config(entity_type)
    if not entity_config:
        return
    
    for constraint in entity_config.get('constraints', []):
        field = constraint['field']
        value = entity_data.get(field)
        
        # Skip validation if field is optional and not present
        if constraint.get('when_present', False) and not value:
            continue
        
        if value and 'regex' in constraint:
            import re
            if not re.match(constraint['regex'], value):
                raise RepositoryError(
                    f"Invalid {field}: does not match pattern {constraint['regex']}",
                    400,
                    "VALIDATION_ERROR"
                )


def compute_blob_digest(data: bytes) -> str:
    """Compute SHA256 digest of blob data."""
    return "sha256:" + hashlib.sha256(data).hexdigest()


@app.route("/auth/login", methods=["POST"])
def login():
    """Login endpoint - returns JWT token."""
    try:
        data = request.get_json()
        if not data or 'username' not in data or 'password' not in data:
            raise RepositoryError("Missing username or password", 400, "INVALID_REQUEST")
        
        user = auth_module.verify_password(data['username'], data['password'])
        if not user:
            raise RepositoryError("Invalid credentials", 401, "UNAUTHORIZED")
        
        token = auth_module.generate_token(user, JWT_SECRET)
        
        return jsonify({
            "ok": True,
            "token": token,
            "user": {
                "username": user['username'],
                "scopes": user['scopes']
            }
        })
    except RepositoryError:
        raise
    except Exception as e:
        raise RepositoryError("Login failed", 500, "LOGIN_ERROR")


@app.route("/auth/change-password", methods=["POST"])
def change_password():
    """Change password endpoint."""
    # Must be authenticated
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise RepositoryError("Missing authorization", 401, "UNAUTHORIZED")
    
    token = auth_header[7:]
    try:
        principal = verify_token(token)
    except:
        raise RepositoryError("Invalid token", 401, "UNAUTHORIZED")
    
    try:
        data = request.get_json()
        if not data or 'old_password' not in data or 'new_password' not in data:
            raise RepositoryError("Missing old_password or new_password", 400, "INVALID_REQUEST")
        
        if len(data['new_password']) < 4:
            raise RepositoryError("New password must be at least 4 characters", 400, "INVALID_PASSWORD")
        
        username = principal['sub']
        success = auth_module.change_password(username, data['old_password'], data['new_password'])
        
        if not success:
            raise RepositoryError("Old password is incorrect", 401, "INVALID_PASSWORD")
        
        return jsonify({"ok": True, "message": "Password changed successfully"})
    except RepositoryError:
        raise
    except Exception as e:
        raise RepositoryError("Password change failed", 500, "PASSWORD_CHANGE_ERROR")


@app.route("/auth/me", methods=["GET"])
def get_current_user():
    """Get current user info from token."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise RepositoryError("Missing authorization", 401, "UNAUTHORIZED")
    
    token = auth_header[7:]
    try:
        principal = verify_token(token)
        return jsonify({
            "ok": True,
            "user": {
                "username": principal['sub'],
                "scopes": principal.get('scopes', [])
            }
        })
    except:
        raise RepositoryError("Invalid token", 401, "UNAUTHORIZED")


@app.route("/admin/config", methods=["GET"])
def get_admin_config():
    """Get repository configuration from database."""
    # Must be admin
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise RepositoryError("Missing authorization", 401, "UNAUTHORIZED")
    
    token = auth_header[7:]
    try:
        principal = verify_token(token)
        if 'admin' not in principal.get('scopes', []):
            raise RepositoryError("Admin access required", 403, "FORBIDDEN")
    except:
        raise RepositoryError("Invalid token", 401, "UNAUTHORIZED")
    
    config = config_db.get_repository_config()
    if not config:
        raise RepositoryError("No configuration found", 404, "NOT_FOUND")
    
    return jsonify({"ok": True, "config": config})


@app.route("/admin/entities", methods=["GET"])
def list_entities():
    """List all entities."""
    # Must be admin
    principal = require_scopes(["admin"])
    
    config = config_db.get_repository_config()
    if not config:
        raise RepositoryError("No configuration found", 404, "NOT_FOUND")
    
    return jsonify({"ok": True, "entities": config.get('entities', [])})


@app.route("/admin/entities", methods=["POST"])
def create_entity():
    """Create a new entity."""
    # Must be admin
    principal = require_scopes(["admin"])
    
    try:
        data = request.get_json()
        if not data or 'name' not in data:
            raise RepositoryError("Missing entity name", 400, "INVALID_REQUEST")
        
        # TODO: Implement entity creation in config_db
        return jsonify({"ok": True, "message": "Entity creation not yet implemented"})
    except RepositoryError:
        raise
    except Exception as e:
        raise RepositoryError(f"Failed to create entity: {str(e)}", 500, "CREATION_ERROR")


@app.route("/admin/routes", methods=["GET"])
def list_routes():
    """List all API routes."""
    # Must be admin
    principal = require_scopes(["admin"])
    
    config = config_db.get_repository_config()
    if not config:
        raise RepositoryError("No configuration found", 404, "NOT_FOUND")
    
    return jsonify({"ok": True, "routes": config.get('api_routes', [])})


@app.route("/admin/routes", methods=["POST"])
def create_route():
    """Create a new API route."""
    # Must be admin
    principal = require_scopes(["admin"])
    
    try:
        data = request.get_json()
        if not data or 'route_id' not in data:
            raise RepositoryError("Missing route_id", 400, "INVALID_REQUEST")
        
        # TODO: Implement route creation in config_db
        return jsonify({"ok": True, "message": "Route creation not yet implemented"})
    except RepositoryError:
        raise
    except Exception as e:
        raise RepositoryError(f"Failed to create route: {str(e)}", 500, "CREATION_ERROR")


@app.route("/admin/blob-stores", methods=["GET"])
def list_blob_stores():
    """List all blob stores."""
    # Must be admin
    principal = require_scopes(["admin"])
    
    config = config_db.get_repository_config()
    if not config:
        raise RepositoryError("No configuration found", 404, "NOT_FOUND")
    
    return jsonify({"ok": True, "blob_stores": config.get('blob_stores', [])})


@app.route("/admin/blob-stores", methods=["POST"])
def create_blob_store():
    """Create a new blob store."""
    # Must be admin
    principal = require_scopes(["admin"])
    
    try:
        data = request.get_json()
        if not data or 'name' not in data:
            raise RepositoryError("Missing store name", 400, "INVALID_REQUEST")
        
        # TODO: Implement blob store creation in config_db
        return jsonify({"ok": True, "message": "Blob store creation not yet implemented"})
    except RepositoryError:
        raise
    except Exception as e:
        raise RepositoryError(f"Failed to create blob store: {str(e)}", 500, "CREATION_ERROR")


@app.route("/admin/auth/scopes", methods=["GET"])
def list_auth_scopes():
    """List all auth scopes."""
    # Must be admin
    principal = require_scopes(["admin"])
    
    config = config_db.get_repository_config()
    if not config:
        raise RepositoryError("No configuration found", 404, "NOT_FOUND")
    
    return jsonify({"ok": True, "scopes": config.get('auth_scopes', [])})


@app.route("/admin/features", methods=["GET"])
def get_features():
    """Get features configuration."""
    # Must be admin
    principal = require_scopes(["admin"])
    
    config = config_db.get_repository_config()
    if not config:
        raise RepositoryError("No configuration found", 404, "NOT_FOUND")
    
    return jsonify({"ok": True, "features": config.get('features', {})})


@app.route("/admin/features", methods=["PUT"])
def update_features():
    """Update features configuration."""
    # Must be admin
    principal = require_scopes(["admin"])
    
    try:
        data = request.get_json()
        if not data:
            raise RepositoryError("Missing request body", 400, "INVALID_REQUEST")
        
        # TODO: Implement features update in config_db
        return jsonify({"ok": True, "message": "Features update not yet implemented"})
    except RepositoryError:
        raise
    except Exception as e:
        raise RepositoryError(f"Failed to update features: {str(e)}", 500, "UPDATE_ERROR")



@app.route("/v1/<namespace>/<name>/<version>/<variant>/blob", methods=["PUT"])
def publish_artifact_blob(namespace: str, name: str, version: str, variant: str):
    """Publish artifact blob endpoint."""
    # Auth check
    principal = require_scopes(["write"])
    
    # Parse and normalize entity
    entity = normalize_entity({
        "namespace": namespace,
        "name": name,
        "version": version,
        "variant": variant
    })
    
    # Validate entity
    validate_entity(entity)
    
    # Read blob data
    blob_data = request.get_data()
    if len(blob_data) > SCHEMA["ops"]["limits"]["max_request_body_bytes"]:
        raise RepositoryError("Blob too large", 413, "BLOB_TOO_LARGE")
    
    # Compute digest
    digest = compute_blob_digest(blob_data)
    blob_size = len(blob_data)
    
    # Store blob
    blob_path = get_blob_path(digest)
    blob_path.parent.mkdir(parents=True, exist_ok=True)
    
    if not blob_path.exists():
        with open(blob_path, "wb") as f:
            f.write(blob_data)
    
    # Store metadata
    artifact_key = f"artifact/{entity['namespace']}/{entity['name']}/{entity['version']}/{entity['variant']}"
    
    if kv_store.get(artifact_key) is not None:
        raise RepositoryError("Artifact already exists", 409, "ALREADY_EXISTS")
    
    now = datetime.utcnow().isoformat() + "Z"
    meta = {
        "namespace": entity["namespace"],
        "name": entity["name"],
        "version": entity["version"],
        "variant": entity["variant"],
        "blob_digest": digest,
        "blob_size": blob_size,
        "created_at": now,
        "created_by": principal.get("sub", "unknown")
    }
    
    kv_store.put(artifact_key, meta)
    
    # Update index
    index_key = f"{entity['namespace']}/{entity['name']}"
    if index_key not in index_store:
        index_store[index_key] = []
    
    index_store[index_key].append({
        "namespace": entity["namespace"],
        "name": entity["name"],
        "version": entity["version"],
        "variant": entity["variant"],
        "blob_digest": digest
    })
    
    # Sort by version (simple string sort for MVP)
    index_store[index_key].sort(key=lambda x: x["version"], reverse=True)
    
    return jsonify({
        "ok": True,
        "digest": digest,
        "size": blob_size
    }), 201


@app.route("/v1/<namespace>/<name>/<version>/<variant>/blob", methods=["GET"])
def fetch_artifact_blob(namespace: str, name: str, version: str, variant: str):
    """Fetch artifact blob endpoint."""
    # Auth check
    require_scopes(["read"])
    
    # Parse and normalize entity
    entity = normalize_entity({
        "namespace": namespace,
        "name": name,
        "version": version,
        "variant": variant
    })
    
    # Validate entity
    validate_entity(entity)
    
    # Get metadata
    artifact_key = f"artifact/{entity['namespace']}/{entity['name']}/{entity['version']}/{entity['variant']}"
    meta = kv_store.get(artifact_key)
    
    if not meta:
        raise RepositoryError("Artifact not found", 404, "NOT_FOUND")
    
    # Get blob
    blob_path = get_blob_path(meta["blob_digest"])
    if not blob_path.exists():
        raise RepositoryError("Blob not found", 404, "BLOB_NOT_FOUND")
    
    return send_file(
        blob_path,
        mimetype="application/octet-stream",
        as_attachment=True,
        download_name=f"{entity['name']}-{entity['version']}.tar.gz"
    )


@app.route("/v1/<namespace>/<name>/latest", methods=["GET"])
def resolve_latest(namespace: str, name: str):
    """Resolve latest version endpoint."""
    # Auth check
    require_scopes(["read"])
    
    # Parse and normalize entity
    entity = normalize_entity({
        "namespace": namespace,
        "name": name,
        "version": "",
        "variant": ""
    })
    
    # Query index
    index_key = f"{entity['namespace']}/{entity['name']}"
    rows = index_store.get(index_key, [])
    
    if not rows:
        raise RepositoryError("No versions found", 404, "NOT_FOUND")
    
    latest = rows[0]
    return jsonify({
        "namespace": entity["namespace"],
        "name": entity["name"],
        "version": latest["version"],
        "variant": latest["variant"],
        "blob_digest": latest["blob_digest"]
    })


@app.route("/v1/<namespace>/<name>/tags/<tag>", methods=["PUT"])
def set_tag(namespace: str, name: str, tag: str):
    """Set tag endpoint."""
    # Auth check
    principal = require_scopes(["write"])
    
    # Parse and normalize entity
    entity = normalize_entity({
        "namespace": namespace,
        "name": name,
        "version": "",
        "variant": "",
        "tag": tag
    })
    
    # Validate entity
    validate_entity(entity)
    
    # Parse request body
    try:
        body = request.get_json()
        if not body or "target_version" not in body or "target_variant" not in body:
            raise RepositoryError("Missing required fields", 400, "INVALID_REQUEST")
    except Exception as e:
        raise RepositoryError("Invalid JSON", 400, "INVALID_JSON")
    
    # Check if target exists
    target_key = f"artifact/{entity['namespace']}/{entity['name']}/{body['target_version']}/{body['target_variant']}"
    if kv_store.get(target_key) is None:
        raise RepositoryError("Target artifact not found", 404, "TARGET_NOT_FOUND")
    
    # Store tag
    now = datetime.utcnow().isoformat() + "Z"
    tag_key = f"tag/{entity['namespace']}/{entity['name']}/{entity['tag']}"
    
    kv_store.put(tag_key, {
        "namespace": entity["namespace"],
        "name": entity["name"],
        "tag": entity["tag"],
        "target_key": target_key,
        "updated_at": now,
        "updated_by": principal.get("sub", "unknown")
    })
    
    return jsonify({"ok": True})


@app.route("/v1/<namespace>/<name>/versions", methods=["GET"])
def list_versions(namespace: str, name: str):
    """List all versions of a package."""
    # Auth check
    require_scopes(["read"])
    
    # Parse and normalize entity
    entity = normalize_entity({
        "namespace": namespace,
        "name": name,
        "version": "",
        "variant": ""
    })
    
    # Query index
    index_key = f"{entity['namespace']}/{entity['name']}"
    rows = index_store.get(index_key, [])
    
    return jsonify({
        "namespace": entity["namespace"],
        "name": entity["name"],
        "versions": rows
    })


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({"status": "healthy"})


@app.route("/schema", methods=["GET"])
def get_schema():
    """Return the repository schema."""
    return jsonify(SCHEMA)


@app.route("/rocksdb/stats", methods=["GET"])
def rocksdb_stats():
    """Get RocksDB statistics in JSON format."""
    try:
        stats = kv_store.get_stats()
        return jsonify({
            "ok": True,
            "stats": stats
        })
    except Exception as e:
        app.logger.error(f"Error getting RocksDB stats: {e}", exc_info=True)
        return jsonify({
            "ok": False,
            "error": str(e)
        }), 500


@app.route("/rocksdb/keys", methods=["GET"])
def rocksdb_keys():
    """List all keys in RocksDB, optionally filtered by prefix."""
    try:
        prefix = request.args.get("prefix", None)
        limit = int(request.args.get("limit", "100"))
        
        # Pass limit to keys() method for efficiency
        keys = kv_store.keys(prefix, limit=limit)
        
        # Check if we hit the limit (might have more keys)
        truncated = len(keys) == limit
        
        return jsonify({
            "ok": True,
            "keys": keys,
            "count": len(keys),
            "truncated": truncated,
            "prefix": prefix
        })
    except Exception as e:
        app.logger.error(f"Error listing RocksDB keys: {e}", exc_info=True)
        return jsonify({
            "ok": False,
            "error": str(e)
        }), 500


@app.route("/rocksdb/dashboard", methods=["GET"])
def rocksdb_dashboard():
    """RocksDB monitoring dashboard with HTML interface."""
    try:
        stats = kv_store.get_stats()
        
        # Sample some keys for display (limit to avoid loading all keys)
        sample_keys = kv_store.keys(limit=20)
        total_keys = stats['total_keys']
        
        html = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RocksDB Dashboard</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }}
        h1 {{
            color: #333;
            border-bottom: 3px solid #4CAF50;
            padding-bottom: 10px;
        }}
        h2 {{
            color: #555;
            margin-top: 30px;
        }}
        .stats-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }}
        .stat-card {{
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .stat-card h3 {{
            margin: 0 0 10px 0;
            color: #666;
            font-size: 14px;
            text-transform: uppercase;
        }}
        .stat-value {{
            font-size: 32px;
            font-weight: bold;
            color: #4CAF50;
        }}
        .stat-label {{
            color: #999;
            font-size: 12px;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin: 20px 0;
        }}
        th, td {{
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }}
        th {{
            background: #4CAF50;
            color: white;
        }}
        .operations-table {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }}
        .operation-item {{
            background: white;
            padding: 15px;
            border-radius: 5px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }}
        .key-sample {{
            font-family: 'Courier New', monospace;
            font-size: 12px;
            color: #333;
        }}
        .refresh-btn {{
            background: #4CAF50;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            margin: 10px 0;
        }}
        .refresh-btn:hover {{
            background: #45a049;
        }}
    </style>
</head>
<body>
    <h1>🗄️ RocksDB Dashboard</h1>
    
    <button class="refresh-btn" onclick="location.reload()">🔄 Refresh</button>
    
    <div class="stats-grid">
        <div class="stat-card">
            <h3>Total Keys</h3>
            <div class="stat-value">{stats['total_keys']:,}</div>
            <div class="stat-label">stored in database</div>
        </div>
        
        <div class="stat-card">
            <h3>Total Operations</h3>
            <div class="stat-value">{stats['total_operations']:,}</div>
            <div class="stat-label">since startup</div>
        </div>
        
        <div class="stat-card">
            <h3>Ops/Second</h3>
            <div class="stat-value">{stats['ops_per_second']:.2f}</div>
            <div class="stat-label">average throughput</div>
        </div>
        
        <div class="stat-card">
            <h3>Cache Hit Rate</h3>
            <div class="stat-value">{stats['cache_stats']['hit_rate_percent']:.1f}%</div>
            <div class="stat-label">{stats['cache_stats']['hits']:,} hits / {stats['cache_stats']['misses']:,} misses</div>
        </div>
    </div>
    
    <h2>📊 Operations Breakdown</h2>
    <div class="operations-table">
        <div class="operation-item">
            <strong>GET Operations:</strong> {stats['operations']['get']:,}
        </div>
        <div class="operation-item">
            <strong>PUT Operations:</strong> {stats['operations']['put']:,}
        </div>
        <div class="operation-item">
            <strong>DELETE Operations:</strong> {stats['operations']['delete']:,}
        </div>
        <div class="operation-item">
            <strong>CAS PUT Operations:</strong> {stats['operations']['cas_put']:,}
        </div>
    </div>
    
    <h2>🔑 Sample Keys ({len(sample_keys)} of {total_keys})</h2>
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Key</th>
            </tr>
        </thead>
        <tbody>
        """
        
        for i, key in enumerate(sample_keys, 1):
            html += f"""
            <tr>
                <td>{i}</td>
                <td class="key-sample">{key}</td>
            </tr>
            """
        
        html += f"""
        </tbody>
    </table>
    
    <h2>ℹ️ System Information</h2>
    <table>
        <tr>
            <th>Property</th>
            <th>Value</th>
        </tr>
        <tr>
            <td>Database Path</td>
            <td class="key-sample">{stats['database_path']}</td>
        </tr>
        <tr>
            <td>Uptime</td>
            <td>{stats['uptime_seconds']:.2f} seconds ({stats['uptime_seconds']/60:.1f} minutes)</td>
        </tr>
    </table>
    
    <p style="text-align: center; color: #999; margin-top: 40px;">
        RocksDB HTTP Dashboard | Refresh this page to see updated stats
    </p>
</body>
</html>
        """
        
        return Response(html, mimetype='text/html')
        
    except Exception as e:
        app.logger.error(f"Error rendering RocksDB dashboard: {e}", exc_info=True)
        return jsonify({
            "ok": False,
            "error": str(e)
        }), 500


@app.errorhandler(RepositoryError)
def handle_repository_error(error):
    """Handle repository errors."""
    return jsonify({
        "error": {
            "code": error.code,
            "message": error.message
        }
    }), error.status_code


@app.errorhandler(Exception)
def handle_exception(error):
    """Handle unexpected errors."""
    if isinstance(error, HTTPException):
        return error
    
    app.logger.error(f"Unexpected error: {error}", exc_info=True)
    return jsonify({
        "error": {
            "code": "INTERNAL_ERROR",
            "message": "An unexpected error occurred"
        }
    }), 500


if __name__ == "__main__":
    # Only enable debug mode if explicitly set in environment
    debug_mode = os.environ.get("FLASK_DEBUG", "False").lower() == "true"
    app.run(host="0.0.0.0", port=5000, debug=debug_mode)
