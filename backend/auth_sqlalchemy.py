"""
Authentication and user management module using SQLAlchemy.
"""

import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from models import User, UsersSession


def init_db():
    """Initialize the database with default admin user if needed."""
    session = UsersSession()
    try:
        # Check if admin user exists
        admin = session.query(User).filter_by(username='admin').first()
        if not admin:
            # Create default admin user (admin/admin)
            password_hash = bcrypt.hashpw("admin".encode('utf-8'), bcrypt.gensalt())
            now = datetime.utcnow().isoformat() + "Z"
            admin = User(
                username='admin',
                password_hash=password_hash.decode('utf-8'),
                scopes='read,write,admin',
                created_at=now,
                updated_at=now
            )
            session.add(admin)
            session.commit()
    finally:
        session.close()


def verify_password(username: str, password: str) -> Optional[Dict[str, Any]]:
    """Verify username and password, return user data if valid."""
    session = UsersSession()
    try:
        user = session.query(User).filter_by(username=username).first()
        
        if not user:
            return None
        
        # Verify password
        if bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
            return {
                'id': user.id,
                'username': user.username,
                'scopes': user.scopes.split(',')
            }
        
        return None
    finally:
        session.close()


def change_password(username: str, old_password: str, new_password: str) -> bool:
    """Change user password."""
    # Verify old password first
    user_data = verify_password(username, old_password)
    if not user_data:
        return False
    
    # Hash new password
    password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
    now = datetime.utcnow().isoformat() + "Z"
    
    session = UsersSession()
    try:
        user = session.query(User).filter_by(username=username).first()
        if user:
            user.password_hash = password_hash.decode('utf-8')
            user.updated_at = now
            session.commit()
            return True
        return False
    finally:
        session.close()


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
