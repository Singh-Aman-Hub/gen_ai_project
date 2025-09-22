#!/usr/bin/env python3
"""
Run script for FastAPI backend
"""
import uvicorn
import os

if __name__ == "__main__":
    # Get port from environment variable or default to 8000
    port = int(os.environ.get("PORT", 8000))
    
    print(f"Starting FastAPI server on port {port}")
    
    # Run the FastAPI app
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=False,  # Set to True for development
        log_level="info"
    )
