# Simple test version for deployment debugging
from fastapi import FastAPI
import os
import uvicorn

app = FastAPI(title="Legal Document Assistant API - Test")

@app.get("/")
async def root():
    return {"message": "Hello World", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy", "port": os.environ.get("PORT", "not_set")}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting server on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
