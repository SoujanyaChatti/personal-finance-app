#!/bin/bash

# Frontend Deployment Script for Render
echo "🚀 Building and deploying frontend to Render..."

# Check if backend URL is provided
if [ -z "$1" ]; then
    echo "❌ Please provide the backend URL as an argument"
    echo "Usage: ./deploy-frontend.sh <BACKEND_URL>"
    echo "Example: ./deploy-frontend.sh https://your-backend.onrender.com"
    exit 1
fi

BACKEND_URL=$1

# Create .env file for build
echo "📝 Creating .env file with backend URL..."
cat > frontend/.env << EOF
VITE_API_URL=$BACKEND_URL
EOF

# Build the Docker image
echo "📦 Building Docker image..."
docker build -t personal-finance-frontend ./frontend

# Test the image locally (optional)
echo "🧪 Testing Docker image locally..."
docker run -d --name test-frontend -p 80:80 personal-finance-frontend

# Wait for container to start
sleep 3

# Test health endpoint
echo "🏥 Testing health endpoint..."
curl -f http://localhost/health || echo "❌ Health check failed"

# Stop and remove test container
docker stop test-frontend
docker rm test-frontend

# Clean up .env file
rm frontend/.env

echo "✅ Frontend Docker image built successfully!"
echo ""
echo "📋 Next steps for Render deployment:"
echo "1. Push your code to GitHub"
echo "2. Connect your repository to Render"
echo "3. Create a new Web Service"
echo "4. Set the following environment variables in Render:"
echo "   - VITE_API_URL=$BACKEND_URL"
echo "5. Set build command: docker build -t personal-finance-frontend ."
echo "6. Set start command: docker run -p $PORT:80 personal-finance-frontend"
echo ""
echo "🔗 Your frontend URL will be: https://your-app-name.onrender.com" 