# Seed Data

This directory contains example seed data for the goodpackagerepo system. Use this data to:

- Test the repository functionality
- Demonstrate features to users
- Provide working examples

## Contents

- `example_packages.json` - Sample package metadata for testing
- `load_seed_data.py` - Script to load seed data into the repository
- `sample_blobs/` - Directory containing sample blob files to upload

## Usage

To load seed data into your repository:

```bash
cd seed_data
python load_seed_data.py
```

This will:
1. Create sample artifacts in various namespaces
2. Tag them appropriately
3. Demonstrate the full artifact lifecycle

## Example Packages

The seed data includes:

- **acme/hello-world** (v1.0.0, v1.1.0, v2.0.0) - Simple hello world packages
- **example/webapp** (v0.1.0, v0.2.0) - Web application example
- **tools/cli-tool** (v3.0.0) - CLI tool example
- **libs/utility** (v1.0.0-beta, v1.0.0) - Library with prerelease versions
