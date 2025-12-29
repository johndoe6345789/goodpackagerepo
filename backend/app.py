"""
Package Repository Server - Flask Backend
Implements the schema.json declarative repository specification.
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

import auth as auth_module

app = Flask(__name__)
CORS(app)

# Load schema configuration
SCHEMA_PATH = Path(__file__).parent.parent / "schema.json"
with open(SCHEMA_PATH) as f:
    SCHEMA = json.load(f)

# Configuration
DATA_DIR = Path(os.environ.get("DATA_DIR", "/tmp/data"))
BLOB_DIR = DATA_DIR / "blobs"
META_DIR = DATA_DIR / "meta"
JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret-key")

# Initialize storage
BLOB_DIR.mkdir(parents=True, exist_ok=True)
META_DIR.mkdir(parents=True, exist_ok=True)

# Simple in-memory KV store (for MVP, would use RocksDB in production)
kv_store: Dict[str, Any] = {}
index_store: Dict[str, list] = {}


class RepositoryError(Exception):
    """Base exception for repository errors."""
    def __init__(self, message: str, status_code: int = 400, code: str = "ERROR"):
        self.message = message
        self.status_code = status_code
        self.code = code
        super().__init__(self.message)


def get_blob_path(digest: str) -> Path:
    """Generate blob storage path based on schema configuration."""
    # Remove sha256: prefix if present
    clean_digest = digest.replace("sha256:", "")
    # Use addressing template from schema
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


def normalize_entity(entity_data: Dict[str, Any], entity_type: str = "artifact") -> Dict[str, Any]:
    """Normalize entity fields based on schema configuration."""
    entity_config = SCHEMA["entities"][entity_type]
    normalized = {}
    
    for field_name, field_config in entity_config["fields"].items():
        value = entity_data.get(field_name)
        if value is None:
            if not field_config.get("optional", False):
                normalized[field_name] = ""
            continue
        
        # Apply normalization rules
        normalizations = field_config.get("normalize", [])
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
    """Validate entity against schema constraints."""
    entity_config = SCHEMA["entities"][entity_type]
    
    for constraint in entity_config.get("constraints", []):
        field = constraint["field"]
        value = entity_data.get(field)
        
        # Skip validation if field is optional and not present
        if constraint.get("when_present", False) and not value:
            continue
        
        if value and "regex" in constraint:
            import re
            if not re.match(constraint["regex"], value):
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
    
    if artifact_key in kv_store:
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
    
    kv_store[artifact_key] = meta
    
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
    if target_key not in kv_store:
        raise RepositoryError("Target artifact not found", 404, "TARGET_NOT_FOUND")
    
    # Store tag
    now = datetime.utcnow().isoformat() + "Z"
    tag_key = f"tag/{entity['namespace']}/{entity['name']}/{entity['tag']}"
    
    kv_store[tag_key] = {
        "namespace": entity["namespace"],
        "name": entity["name"],
        "tag": entity["tag"],
        "target_key": target_key,
        "updated_at": now,
        "updated_by": principal.get("sub", "unknown")
    }
    
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
    app.run(host="0.0.0.0", port=5000, debug=True)
