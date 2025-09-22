# backend/app/main.py
from fastapi import FastAPI, UploadFile, File, HTTPException, Body, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import uvicorn

# Import with error handling
try:
    from app.services.firestore_manager import get_documents_by_user_id, get_user_by_email, save_user, save_document_summary
    from app.services.document_processor import process_document
    from app.services.summarizer import summarize_document
    from app.services.qa_engine import chat_with_documents
    IMPORTS_SUCCESSFUL = True
except ImportError as e:
    print(f"Import error: {e}")
    IMPORTS_SUCCESSFUL = False

app = FastAPI(title="Legal Document Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/")
async def root():
    return {"message": "Legal Document Assistant API", "status": "running", "imports": IMPORTS_SUCCESSFUL}

@app.get("/health")
async def health():
    return {"status": "healthy", "port": os.environ.get("PORT", "not_set"), "imports": IMPORTS_SUCCESSFUL}

@app.get("/documents/user/{user_id}")
async def get_user_documents(user_id: str):
    if not IMPORTS_SUCCESSFUL:
        raise HTTPException(status_code=500, detail="Service imports failed")
    docs = get_documents_by_user_id(user_id)
    return {"documents": docs}

@app.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    user_id: str = Form(None),
    user_id_body: str = Body(None)
):
    if not IMPORTS_SUCCESSFUL:
        raise HTTPException(status_code=500, detail="Service imports failed")
    # Accept user_id from either Form (frontend) or Body (Swagger UI)
    user_id = user_id or user_id_body
    print("Received user_id:", user_id)
    print("Received file:", getattr(file, 'filename', None))
    try:
        doc_id, meta = await process_document(file)
        # Generate summary
        summary = await summarize_document(doc_id)
        # Save to Firestore
        save_document_summary(user_id, doc_id, meta.get("filename", ""), summary)
        return {"doc_id": doc_id, "meta": meta, "summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analysis/{documentId}")
async def get_analysis(documentId: str):
    if not IMPORTS_SUCCESSFUL:
        raise HTTPException(status_code=500, detail="Service imports failed")
    try:
        summary = await summarize_document(documentId)
        return JSONResponse(content=summary)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# New chat route: user_id and query
@app.post("/chat/user")
async def chat_user(user_id: str = Body(...), query: str = Body(...)):
    if not IMPORTS_SUCCESSFUL:
        raise HTTPException(status_code=500, detail="Service imports failed")
    from app.services.firestore_manager import get_documents_by_user_id
    docs = get_documents_by_user_id(user_id)
    doc_ids = [d["doc_id"] for d in docs if d.get("doc_id")]
    try:
        response = await chat_with_documents(doc_ids, query)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/register")
async def register(name: str = Body(...), email: str = Body(...), password: str = Body(...)):
    if not IMPORTS_SUCCESSFUL:
        raise HTTPException(status_code=500, detail="Service imports failed")
    try:
        user_id = save_user(name, email, password)
        return {"message": "User registered successfully", "user": {"id": user_id, "name": name, "email": email}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/login")
async def login(email: str = Body(...), password: str = Body(...)):
    if not IMPORTS_SUCCESSFUL:
        raise HTTPException(status_code=500, detail="Service imports failed")
    user = get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.get("password") != password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"message": "Login successful", "user": {"id": user.get("id"), "name": user.get("name"), "email": user.get("email")}}

# App is ready for deployment