#!/bin/bash
# Startup script for Render deployment

# Set environment variables
export CACHE_DIR="/tmp/cache"
export GOOGLE_APPLICATION_CREDENTIALS="/opt/render/project/src/backend/legal-firebase.json"

# Create cache directory
mkdir -p /tmp/cache

# Start the application
uvicorn app.main:app --host 0.0.0.0 --port $PORT
