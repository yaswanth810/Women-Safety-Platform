#!/usr/bin/env python3
"""
Create an admin user in MongoDB Atlas for SafeSpace

Usage:
    python3 create_admin.py

Requirements:
    pip install motor passlib bcrypt
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import os

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

async def create_admin():
    print("=" * 60)
    print("🔧 SafeSpace Admin User Creator")
    print("=" * 60)
    print()
    
    # Get MongoDB connection string
    mongo_url = input("Enter your MongoDB Atlas connection string: ").strip()
    
    if not mongo_url:
        print("❌ MongoDB connection string is required!")
        return
    
    db_name = input("Enter database name (default: safespace_db): ").strip() or "safespace_db"
    
    print()
    print("Enter admin user details:")
    admin_email = input("Admin email (default: admin@safespace.com): ").strip() or "admin@safespace.com"
    admin_password = input("Admin password (default: admin123): ").strip() or "admin123"
    admin_name = input("Admin name (default: Admin User): ").strip() or "Admin User"
    admin_phone = input("Admin phone (default: +1234567890): ").strip() or "+1234567890"
    
    print()
    print("🔄 Connecting to MongoDB...")
    
    try:
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
        db = client[db_name]
        
        # Test connection
        await db.command("ping")
        print("✅ Connected to MongoDB!")
        
        # Check if admin already exists
        existing = await db.users.find_one({"email": admin_email})
        if existing:
            print(f"⚠️  User with email {admin_email} already exists!")
            overwrite = input("Do you want to update this user? (y/N): ").strip().lower()
            if overwrite != 'y':
                print("❌ Aborted.")
                client.close()
                return
            # Delete existing user
            await db.users.delete_one({"email": admin_email})
            print("🗑️  Existing user deleted.")
        
        # Create admin user
        admin_user = {
            'id': 'admin-001',
            'email': admin_email,
            'name': admin_name,
            'phone': admin_phone,
            'password_hash': pwd_context.hash(admin_password),
            'role': 'admin',
            'emergency_contacts': [],
            'totp_enabled': False,
            'totp_secret': None,
            'created_at': '2024-01-01T00:00:00Z'
        }
        
        await db.users.insert_one(admin_user)
        
        print()
        print("=" * 60)
        print("✅ Admin User Created Successfully!")
        print("=" * 60)
        print()
        print("📧 Email:", admin_email)
        print("🔑 Password:", admin_password)
        print()
        print("⚠️  IMPORTANT: Change the password after first login!")
        print("=" * 60)
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print()
        print("Common issues:")
        print("1. Invalid MongoDB connection string")
        print("2. Network access not configured (add 0.0.0.0/0 to IP whitelist)")
        print("3. Database user doesn't have permissions")
        print("4. Wrong password in connection string")

if __name__ == "__main__":
    try:
        asyncio.run(create_admin())
    except KeyboardInterrupt:
        print("\n❌ Aborted by user.")
