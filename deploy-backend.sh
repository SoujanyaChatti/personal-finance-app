#!/bin/bash

# Backend Deployment Script for Render
echo "🚀 Building and deploying backend to Render..."

# Build the Docker image
echo "📦 Building Docker image..."
docker build -t personal-finance-backend ./backend

# Test the image locally (optional)
echo "🧪 Testing Docker image locally..."
docker run -d --name test-backend -p 3000:3000 \
  -e MONGO_URI="your_mongo_uri_here" \
  -e GEMINI_API_KEY="your_gemini_key_here" \
  -e JWT_SECRET="your_jwt_secret_here" \
  personal-finance-backend

# Wait for container to start
sleep 5

# Test health endpoint
echo "🏥 Testing health endpoint..."
curl -f http://localhost:3000/api/health || echo "❌ Health check failed"

# Stop and remove test container
docker stop test-backend
docker rm test-backend

echo "✅ Backend Docker image built successfully!"
echo ""
echo "📋 Next steps for Render deployment:"
echo "1. Push your code to GitHub"
echo "2. Connect your repository to Render"
echo "3. Create a new Web Service"
echo "4. Set the following environment variables in Render:"
echo "   - MONGO_URI"
echo "   - GEMINI_API_KEY"
echo "   - JWT_SECRET"
echo "   - PORT (Render will set this automatically)"
echo "5. Set build command: docker build -t personal-finance-backend ."
echo "6. Set start command: docker run -p $PORT:3000 personal-finance-backend"
echo ""
echo "🔗 Your backend URL will be: https://your-app-name.onrender.com" 