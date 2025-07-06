# Deployment Guide for Personal Finance App

This guide will help you deploy both the backend and frontend of the Personal Finance application to Render.

## Prerequisites

- Docker installed locally
- GitHub repository with your code
- Render account
- MongoDB database (MongoDB Atlas recommended)
- Google Gemini API key

## Step 1: Backend Deployment

### 1.1 Prepare Environment Variables

You'll need the following environment variables for the backend:

```bash
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=your_jwt_secret_here
PORT=3000
```

### 1.2 Deploy Backend to Render

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Add Docker configuration for deployment"
   git push origin main
   ```

2. **Create a new Web Service on Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure the service:
     - **Name**: `personal-finance-backend`
     - **Root Directory**: `backend`
     - **Environment**: `Docker`
     - **Build Command**: `docker build -t personal-finance-backend .`
     - **Start Command**: `docker run -p $PORT:3000 personal-finance-backend`

3. **Set Environment Variables**
   - In the Render dashboard, go to your service
   - Navigate to "Environment" tab
   - Add the following variables:
     - `MONGO_URI`
     - `GEMINI_API_KEY`
     - `JWT_SECRET`

4. **Deploy**
   - Click "Create Web Service"
   - Wait for the build to complete
   - Your backend will be available at: `https://your-backend-name.onrender.com`

### 1.3 Test Backend Deployment

```bash
# Test health endpoint
curl https://your-backend-name.onrender.com/api/health

# Should return: {"status":"ok"}
```

## Step 2: Frontend Deployment

### 2.1 Update Frontend Configuration

Once your backend is deployed, you'll need to update the frontend to use the backend URL.

### 2.2 Deploy Frontend to Render

1. **Create a new Web Service on Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure the service:
     - **Name**: `personal-finance-frontend`
     - **Root Directory**: `frontend`
     - **Environment**: `Docker`
     - **Build Command**: `docker build -t personal-finance-frontend .`
     - **Start Command**: `docker run -p $PORT:80 personal-finance-frontend`

2. **Set Environment Variables**
   - In the Render dashboard, go to your service
   - Navigate to "Environment" tab
   - Add the following variable:
     - `VITE_API_URL`: `https://your-backend-name.onrender.com`

3. **Deploy**
   - Click "Create Web Service"
   - Wait for the build to complete
   - Your frontend will be available at: `https://your-frontend-name.onrender.com`

## Step 3: Local Testing (Optional)

### Test Backend Locally

```bash
# Make the script executable
chmod +x deploy-backend.sh

# Run the deployment script
./deploy-backend.sh
```

### Test Frontend Locally

```bash
# Make the script executable
chmod +x deploy-frontend.sh

# Run the deployment script with backend URL
./deploy-frontend.sh https://your-backend-name.onrender.com
```

## Step 4: Verification

1. **Backend Health Check**
   ```bash
   curl https://your-backend-name.onrender.com/api/health
   ```

2. **Frontend Health Check**
   ```bash
   curl https://your-frontend-name.onrender.com/health
   ```

3. **Test Complete Flow**
   - Open your frontend URL in a browser
   - Register a new account
   - Test the main functionality

## Troubleshooting

### Common Issues

1. **Backend Build Fails**
   - Check if all dependencies are in `package.json`
   - Verify Dockerfile syntax
   - Check Render logs for specific errors

2. **Frontend Can't Connect to Backend**
   - Verify `VITE_API_URL` is set correctly
   - Check CORS configuration in backend
   - Ensure backend is running and accessible

3. **MongoDB Connection Issues**
   - Verify `MONGO_URI` is correct
   - Check if MongoDB Atlas IP whitelist includes Render's IPs
   - Ensure database user has correct permissions

4. **Environment Variables Not Loading**
   - Check variable names match exactly
   - Restart the service after adding variables
   - Verify no extra spaces in variable values

### Render-Specific Notes

- Render automatically assigns a `PORT` environment variable
- Services may take a few minutes to start up initially
- Free tier services will sleep after 15 minutes of inactivity
- Check the "Logs" tab in Render dashboard for debugging

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to your repository
2. **CORS**: Ensure your backend CORS configuration allows your frontend domain
3. **JWT Secret**: Use a strong, random JWT secret
4. **MongoDB**: Use connection string with authentication
5. **API Keys**: Keep your Gemini API key secure

## Monitoring

- Use Render's built-in monitoring dashboard
- Set up health checks for both services
- Monitor logs for errors and performance issues
- Consider setting up alerts for service downtime

## Cost Optimization

- Use Render's free tier for development/testing
- Consider upgrading to paid plans for production
- Monitor resource usage in Render dashboard
- Optimize Docker images to reduce build times 