#!/usr/bin/env python3
"""
Seed legal resources into MongoDB Atlas for SafeSpace

Usage:
    python3 seed_legal_resources.py

Requirements:
    pip install motor
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
from datetime import datetime, timezone

async def seed_legal_resources():
    print("=" * 60)
    print("📚 SafeSpace Legal Resources Seeder")
    print("=" * 60)
    print()
    
    # Get MongoDB connection string
    mongo_url = input("Enter your MongoDB Atlas connection string: ").strip()
    
    if not mongo_url:
        print("❌ MongoDB connection string is required!")
        return
    
    db_name = input("Enter database name (default: safespace_db): ").strip() or "safespace_db"
    
    print()
    print("🔄 Connecting to MongoDB...")
    
    try:
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
        db = client[db_name]
        
        # Test connection
        await db.command("ping")
        print("✅ Connected to MongoDB!")
        
        # Check if resources already exist
        count = await db.legal_resources.count_documents({})
        if count > 0:
            print(f"⚠️  Database already has {count} legal resources!")
            overwrite = input("Do you want to clear and reseed? (y/N): ").strip().lower()
            if overwrite == 'y':
                await db.legal_resources.delete_many({})
                print("🗑️  Existing resources cleared.")
            else:
                print("❌ Aborted.")
                client.close()
                return
        
        # Define legal resources
        resources = [
            {
                "id": str(uuid.uuid4()),
                "title": "Know Your Rights",
                "content": "Every woman has fundamental rights under the law including the right to equality, dignity, and freedom from violence and discrimination. These rights are protected by national and international laws. You have the right to live without fear, to be treated with respect, and to seek justice when your rights are violated.",
                "category": "Rights",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "How to File a Police Complaint",
                "content": "You have the right to file a complaint (FIR - First Information Report) at any police station. The police must register your complaint regardless of jurisdiction. You can also file an online FIR in many jurisdictions. The complaint should be detailed and include dates, times, locations, and names of witnesses if any. Always keep a copy of the FIR for your records.",
                "category": "Procedures",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Restraining Orders and Protection Orders",
                "content": "You can obtain a restraining order (also called protection order or stay-away order) to prevent someone from contacting, approaching, or harassing you. These orders are issued by courts and can include provisions for staying away from your home, workplace, or children's school. Violation of a restraining order is a criminal offense.",
                "category": "Legal Actions",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Domestic Violence Protection",
                "content": "Domestic violence laws provide comprehensive protection including protection orders, residence rights, and monetary relief. You have the right to stay in your shared household. You can seek protection not only against a spouse but also against other family members. Emergency protection orders can be obtained within 24 hours in urgent situations.",
                "category": "Domestic Violence",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Sexual Harassment at Workplace",
                "content": "Workplace sexual harassment laws require every organization with 10+ employees to have an Internal Complaints Committee (ICC). You can file a complaint with the ICC within 3 months of the incident (extendable in certain cases). The committee must complete the inquiry within 90 days. False or malicious complaints can lead to penalties, but genuine complaints are protected.",
                "category": "Workplace",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Cyberstalking and Online Abuse",
                "content": "Cyberstalking, online harassment, sending obscene messages, morphing photos, and sharing private images without consent are criminal offenses under IT laws. You can report such crimes to the cybercrime portal or local police. Preserve all evidence including screenshots, messages, and URLs. Many jurisdictions have special cybercrime cells for faster action.",
                "category": "Cyber Crime",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Emergency Helplines",
                "content": "National Emergency Helpline: 112 (available 24/7). Women's Helpline: 1091. Police: 100. Keep these numbers saved. In an emergency, call immediately. You can also SMS or use mobile apps to contact emergency services. Many regions also have specific helplines for domestic violence, sexual assault, and trafficking.",
                "category": "Emergency",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Legal Aid and Free Services",
                "content": "If you cannot afford a lawyer, you have the right to free legal aid. Legal Services Authorities provide free legal assistance to women, children, persons with disabilities, and economically disadvantaged individuals. Contact your State Legal Services Authority or District Legal Services Authority. Many NGOs also provide free legal counseling.",
                "category": "Legal Aid",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Medical Examination After Assault",
                "content": "After a sexual assault, seek immediate medical attention. Medical examination should be done within 24-48 hours (though you can still report later). The examination is free at government hospitals. You have the right to a female doctor if requested. Medical evidence is crucial for legal proceedings. You can also seek post-exposure prophylaxis (PEP) to prevent infections.",
                "category": "Medical",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Compensation for Victims",
                "content": "Victims of crimes, especially sexual offenses and acid attacks, are entitled to compensation from the State. Application can be made to the District Legal Services Authority or State Legal Services Authority. Compensation ranges from minimal amounts to substantial sums depending on the nature of the crime and injury. This is in addition to any compensation ordered by courts.",
                "category": "Compensation",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Privacy and Identity Protection",
                "content": "In cases of sexual offenses, your identity is protected by law. Media cannot publish your name or any information that could reveal your identity. Even in court proceedings, your identity is protected. You have the right to record your statement via video conferencing if needed. Courts can also allow screening for your protection.",
                "category": "Privacy",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Witness Protection",
                "content": "If you fear for your safety after reporting a crime or as a witness, you can request witness protection. This may include police protection, relocation, change of identity, and secure accommodation. The Witness Protection Scheme provides comprehensive protection to witnesses and victims of serious crimes.",
                "category": "Protection",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        
        # Insert resources
        print(f"📝 Inserting {len(resources)} legal resources...")
        await db.legal_resources.insert_many(resources)
        
        print()
        print("=" * 60)
        print(f"✅ Successfully inserted {len(resources)} legal resources!")
        print("=" * 60)
        print()
        print("Categories added:")
        categories = set(r["category"] for r in resources)
        for cat in sorted(categories):
            count = sum(1 for r in resources if r["category"] == cat)
            print(f"  • {cat}: {count} resource(s)")
        print()
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print()
        print("Common issues:")
        print("1. Invalid MongoDB connection string")
        print("2. Network access not configured (add 0.0.0.0/0 to IP whitelist)")
        print("3. Database user doesn't have write permissions")

if __name__ == "__main__":
    try:
        asyncio.run(seed_legal_resources())
    except KeyboardInterrupt:
        print("\n❌ Aborted by user.")
