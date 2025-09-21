# backend/app/services/document_processor.py
import os
import hashlib
from pathlib import Path
from fastapi import UploadFile
from app.utils import file_fingerprint
from app.services.extractor import Extractor

CACHE_DIR = Path(os.getenv("CACHE_DIR", "/tmp/cache"))
# Ensure cache directory exists
CACHE_DIR.mkdir(parents=True, exist_ok=True)

extractor = Extractor(CACHE_DIR)

async def process_document(file: UploadFile):
    ext = file.filename.lower().split('.')[-1]
    contents = await file.read()
    temp_path = CACHE_DIR / file.filename
    temp_path.write_bytes(contents)
    if ext == "pdf":
        text = extractor.from_pdf(str(temp_path))
    elif ext in ["png", "jpg", "jpeg", "bmp", "tiff", "gif"]:
        text = extractor.from_image(str(temp_path))
    else:
        raise ValueError("Unsupported file type")
    print("file saved in cache successfully")
    fid = file_fingerprint(str(temp_path))
    meta = {"filename": file.filename, "fid": fid}
    return fid, meta
