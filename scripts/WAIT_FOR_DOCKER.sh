#!/bin/bash

# Script to wait for Docker to be ready

echo "🔍 Checking Docker status..."

# Function to check if Docker is ready
check_docker() {
    docker ps > /dev/null 2>&1
    return $?
}

# Wait for Docker to be ready
echo "⏳ Waiting for Docker Desktop to start..."
MAX_WAIT=120  # 2 minutes max
ELAPSED=0

while [ $ELAPSED -lt $MAX_WAIT ]; do
    if check_docker; then
        echo "✅ Docker is ready!"
        docker ps
        exit 0
    fi
    
    echo "   Still waiting... ($ELAPSED seconds)"
    sleep 5
    ELAPSED=$((ELAPSED + 5))
done

echo "❌ Docker did not start within $MAX_WAIT seconds"
echo ""
echo "Try:"
echo "1. Open Docker Desktop manually: open -a Docker"
echo "2. Wait 60 seconds"
echo "3. Run this script again: ./WAIT_FOR_DOCKER.sh"
exit 1
