import uvicorn
import os

if __name__ == "__main__":
    port = os.environ.get("PORT")
    if port is None:
        raise RuntimeError("PORT environment variable not set by Render")

    print(f"Starting FastAPI server on port {port}")
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=int(port),
        reload=False,
        log_level="info"
    )