#!/usr/bin/env python3
"""
Generate a secure JWT secret for SafeSpace application
Run: python3 generate_jwt_secret.py
"""

import secrets

def generate_jwt_secret():
    """Generate a cryptographically secure JWT secret"""
    secret = secrets.token_urlsafe(32)
    return secret

if __name__ == "__main__":
    secret = generate_jwt_secret()
    print("=" * 60)
    print("🔐 Generated JWT Secret")
    print("=" * 60)
    print()
    print(secret)
    print()
    print("=" * 60)
    print("Copy this and add to Vercel Environment Variables:")
    print("Variable: JWT_SECRET")
    print(f"Value: {secret}")
    print("=" * 60)
