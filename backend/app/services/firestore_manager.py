# Fetch all documents for a user from Firestore
def get_documents_by_user_id(user_id):
    if not user_id:
        return []  # Do not return all documents if user_id is missing
    docs_ref = db.collection("documents")
    query = docs_ref.where("user_id", "==", user_id).stream()
    documents = []
    for doc in query:
        data = doc.to_dict()
        documents.append({
            "doc_id": data.get("doc_id"),
            "doc_name": data.get("doc_name"),
            "summary": data.get("summary"),
            "upload_date": data.get("upload_date")
        })
    return documents
# Get user by email for login
def get_user_by_email(email):
    users_ref = db.collection("users")
    query = users_ref.where("email", "==", email).limit(1).stream()
    for doc in query:
        user = doc.to_dict()
        user["id"] = doc.id
        return user
    return None
# backend/app/services/firestore_manager.py
# Placeholder for Firestore integration
# To be implemented in Phase 2

from google.cloud import firestore
import uuid
import os

# Fix: Use environment variable for production, fallback to local file
DB_PATH = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", 
                        os.path.join(os.path.dirname(__file__), '../../legal-firebase.json'))

# Initialize Firestore client
try:
    if os.path.exists(DB_PATH):
        db = firestore.Client.from_service_account_json(DB_PATH)
    else:
        # For production, use default credentials
        db = firestore.Client()
except Exception as e:
    print(f"Firestore initialization error: {e}")
    # Fallback to default credentials
    db = firestore.Client()


def save_user(name, email, password):
    user_id = str(uuid.uuid4())
    db.collection("users").document(user_id).set({
        "name": name,
        "email": email,
        "password": password
    })
    return user_id

def get_user(user_id):
    doc = db.collection("users").document(user_id).get()
    return doc.to_dict() if doc.exists else None

# New: Save document summary to Firestore
def save_document_summary(user_id, doc_id, doc_name, summary_json):
    db.collection("documents").document(doc_id).set({
        "user_id": user_id,
        "doc_id": doc_id,
        "doc_name": doc_name,
        "summary": summary_json,
        "upload_date": firestore.SERVER_TIMESTAMP
    })
