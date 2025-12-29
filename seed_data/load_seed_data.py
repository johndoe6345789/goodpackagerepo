#!/usr/bin/env python3
"""
Seed Data Loader for goodpackagerepo

This script loads example packages and tags into the repository
for testing and demonstration purposes.
"""

import json
import os
import sys
import requests
from pathlib import Path
from typing import Dict, Any

# Configuration
BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:5000")
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
# Security note: Default password should only be used for development/testing
# In production, require explicit password via environment variable
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin")


def login(username: str, password: str) -> str:
    """Login and get JWT token."""
    response = requests.post(
        f"{BACKEND_URL}/auth/login",
        json={"username": username, "password": password}
    )
    
    if response.status_code != 200:
        print(f"❌ Login failed: {response.status_code}")
        print(response.text)
        sys.exit(1)
    
    data = response.json()
    print(f"✅ Logged in as {username}")
    return data["token"]


def publish_package(token: str, package: Dict[str, Any]) -> None:
    """Publish a package to the repository."""
    namespace = package["namespace"]
    name = package["name"]
    version = package["version"]
    variant = package["variant"]
    content = package["content"].encode("utf-8")
    
    url = f"{BACKEND_URL}/v1/{namespace}/{name}/{version}/{variant}/blob"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/octet-stream"
    }
    
    response = requests.put(url, headers=headers, data=content)
    
    if response.status_code == 201:
        try:
            data = response.json()
            digest = data.get('digest', 'unknown')
            print(f"✅ Published {namespace}/{name}:{version}@{variant} (digest: {digest[:16]}...)")
        except (ValueError, KeyError):
            print(f"✅ Published {namespace}/{name}:{version}@{variant}")
    elif response.status_code == 409:
        print(f"⚠️  Package {namespace}/{name}:{version}@{variant} already exists, skipping")
    else:
        print(f"❌ Failed to publish {namespace}/{name}:{version}@{variant}: {response.status_code}")
        print(response.text)


def set_tag(token: str, tag_info: Dict[str, Any]) -> None:
    """Set a tag for a package."""
    namespace = tag_info["namespace"]
    name = tag_info["name"]
    tag = tag_info["tag"]
    target_version = tag_info["target_version"]
    target_variant = tag_info["target_variant"]
    
    url = f"{BACKEND_URL}/v1/{namespace}/{name}/tags/{tag}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    response = requests.put(
        url,
        headers=headers,
        json={
            "target_version": target_version,
            "target_variant": target_variant
        }
    )
    
    if response.status_code == 200:
        print(f"✅ Set tag {namespace}/{name}:{tag} -> {target_version}@{target_variant}")
    else:
        print(f"❌ Failed to set tag {namespace}/{name}:{tag}: {response.status_code}")
        print(response.text)


def main():
    """Main function to load seed data."""
    print("=" * 60)
    print("📦 goodpackagerepo Seed Data Loader")
    print("=" * 60)
    print()
    
    # Check if backend is reachable
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        if response.status_code == 200:
            print(f"✅ Backend is reachable at {BACKEND_URL}")
        else:
            print(f"⚠️  Backend returned status {response.status_code}")
    except Exception as e:
        print(f"❌ Cannot reach backend at {BACKEND_URL}: {e}")
        print("   Make sure the backend is running first.")
        sys.exit(1)
    
    print()
    
    # Login
    token = login(ADMIN_USERNAME, ADMIN_PASSWORD)
    print()
    
    # Load seed data
    seed_file = Path(__file__).parent / "example_packages.json"
    with open(seed_file) as f:
        seed_data = json.load(f)
    
    # Publish packages
    print("Publishing packages...")
    print("-" * 60)
    for package in seed_data["packages"]:
        publish_package(token, package)
    
    print()
    print("Setting tags...")
    print("-" * 60)
    for tag in seed_data["tags"]:
        set_tag(token, tag)
    
    print()
    print("=" * 60)
    print("✅ Seed data loaded successfully!")
    print("=" * 60)
    print()
    print("You can now:")
    print(f"  - List packages: curl {BACKEND_URL}/v1/<namespace>/<name>/versions")
    print(f"  - Get latest: curl {BACKEND_URL}/v1/<namespace>/<name>/latest")
    print(f"  - Download: curl {BACKEND_URL}/v1/<namespace>/<name>/<version>/<variant>/blob")
    print()


if __name__ == "__main__":
    main()
