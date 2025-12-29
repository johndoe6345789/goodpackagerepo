"""
Authentication and user management module using SQLite.
"""

import sqlite3
import bcrypt
import jwt
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Dict, Any

# Database path
DB_PATH = Path(__file__).parent / "users.db"


def get_db():
    """Get database connection."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize the database with users table and default admin user."""
    conn = get_db()
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            scopes TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)
    
    # Check if admin user exists
    cursor.execute("SELECT id FROM users WHERE username = ?", ("admin",))
    if not cursor.fetchone():
        # Create default admin user (admin/admin)
        password_hash = bcrypt.hashpw("admin".encode('utf-8'), bcrypt.gensalt())
        now = datetime.utcnow().isoformat() + "Z"
        cursor.execute("""
            INSERT INTO users (username, password_hash, scopes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
        """, ("admin", password_hash.decode('utf-8'), "read,write,admin", now, now))
    
    conn.commit()
    conn.close()


def verify_password(username: str, password: str) -> Optional[Dict[str, Any]]:
    """Verify username and password, return user data if valid."""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        return None
    
    # Verify password
    if bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
        return {
            'id': user['id'],
            'username': user['username'],
            'scopes': user['scopes'].split(',')
        }
    
    return None


def change_password(username: str, old_password: str, new_password: str) -> bool:
    """Change user password."""
    # Verify old password first
    user = verify_password(username, old_password)
    if not user:
        return False
    
    # Hash new password
    password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
    now = datetime.utcnow().isoformat() + "Z"
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE users 
        SET password_hash = ?, updated_at = ?
        WHERE username = ?
    """, (password_hash.decode('utf-8'), now, username))
    conn.commit()
    conn.close()
    
    return True


def generate_token(user: Dict[str, Any], secret: str, expires_hours: int = 24) -> str:
    """Generate JWT token for user."""
    payload = {
        'sub': user['username'],
        'scopes': user['scopes'],
        'exp': datetime.utcnow() + timedelta(hours=expires_hours)
    }
    return jwt.encode(payload, secret, algorithm='HS256')


# Initialize database on module import
init_db()
