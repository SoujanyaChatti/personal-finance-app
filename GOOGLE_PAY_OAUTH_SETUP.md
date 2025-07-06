# Google Pay OAuth Setup Guide

## 🎯 Overview
This guide will help you set up real Google Pay OAuth integration for the UPI app. We'll use Google's OAuth 2.0 for accessing Google Pay transaction data.

## 📋 Prerequisites
- Google Cloud Console account
- Domain verification (for production)
- HTTPS setup (for production)

## 🔧 Step-by-Step Setup

### 1. Google Cloud Console Setup

#### Step 1: Create a New Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name it: `Personal Finance UPI Integration`
4. Click "Create"

#### Step 2: Enable Required APIs
1. Go to "APIs & Services" → "Library"
2. Search and enable these APIs:
   - **Google Wallet API** (for payment and transaction data)
   - **Google+ API** (for user profile)
   - **Google Drive API** (for transaction data access)

#### Step 3: Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Select "Web application"
4. Configure the OAuth consent screen first if prompted

#### Step 4: Configure OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" user type
3. Fill in the required information:
   - **App name**: Personal Finance UPI Integration
   - **User support email**: Your email
   - **Developer contact information**: Your email
   - **App domain**: localhost (for development)
4. Add scopes:
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/wallet_object.issuer`
5. Add test users (your email for development)
6. Save and continue

#### Step 5: Create OAuth 2.0 Client ID
1. Go back to "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Application type: "Web application"
4. Name: "Personal Finance UPI Integration"
5. **Authorized JavaScript origins**:
   - `http://localhost:5173` (for development)
   - `https://yourdomain.com` (for production)
6. **Authorized redirect URIs**:
   - `http://localhost:5173/oauth/callback` (for development)
   - `https://yourdomain.com/oauth/callback` (for production)
7. Click "Create"

#### Step 6: Get Your Credentials
After creation, you'll get:
- **Client ID**: `your-client-id.apps.googleusercontent.com`
- **Client Secret**: `your-client-secret`

### 2. Backend Environment Configuration

Create or update your `.env` file in the backend directory:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/personal_finance
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
PORT=3000

# Google Pay OAuth Configuration
GOOGLE_PAY_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_PAY_CLIENT_SECRET=your-client-secret
GOOGLE_PAY_REDIRECT_URI=http://localhost:5173/oauth/callback

# Other UPI App Configurations (for future use)
PHONEPE_CLIENT_ID=
PHONEPE_CLIENT_SECRET=
PHONEPE_REDIRECT_URI=http://localhost:5173/oauth/callback

PAYTM_CLIENT_ID=
PAYTM_CLIENT_SECRET=
PAYTM_REDIRECT_URI=http://localhost:5173/oauth/callback

# MCP Configuration (for future enhancements)
MCP_ENDPOINT=
MCP_API_KEY=

# NPCI Configuration (for transaction verification)
NPCI_BASE_URL=
NPCI_API_KEY=
```

### 3. Google Wallet API Configuration

#### Step 1: Enable Google Wallet API
1. Go to "APIs & Services" → "Library"
2. Search for "Google Wallet API"
3. Click on it and enable it

#### Step 2: Configure API Access
1. Go to "APIs & Services" → "Enabled APIs"
2. Find "Google Wallet API" and click on it
3. Go to "Credentials" tab
4. Make sure your OAuth 2.0 client has access

### 4. Testing the Integration

#### Step 1: Start the Servers
```bash
# Backend
cd backend
npm start

# Frontend
cd frontend
npm run dev
```

#### Step 2: Test OAuth Flow
1. Go to `http://localhost:5173`
2. Login to your account
3. Go to Dashboard
4. Click "Connect" on Google Pay
5. You should be redirected to Google OAuth
6. Authorize the application
7. You should be redirected back to the app

### 5. Troubleshooting

#### Common Issues:

1. **"redirect_uri_mismatch" Error**
   - Make sure the redirect URI in Google Console matches exactly
   - Check for trailing slashes
   - Verify protocol (http vs https)

2. **"invalid_client" Error**
   - Verify Client ID and Client Secret are correct
   - Check that the OAuth consent screen is configured

3. **"access_denied" Error**
   - Make sure you're using a test user email
   - Check that the app is not in restricted mode

4. **"invalid_grant" Error**
   - Authorization codes can only be used once
   - Make sure you're not reusing old codes

#### Debug Steps:
1. Check browser console for errors
2. Check backend logs for detailed error messages
3. Verify environment variables are loaded correctly
4. Test OAuth URL generation manually

### 6. Production Deployment

#### Step 1: Domain Verification
1. Go to "APIs & Services" → "OAuth consent screen"
2. Add your production domain
3. Verify domain ownership

#### Step 2: Update Credentials
1. Go to "Credentials"
2. Edit your OAuth 2.0 client
3. Add production URLs:
   - Authorized JavaScript origins: `https://yourdomain.com`
   - Authorized redirect URIs: `https://yourdomain.com/oauth/callback`

#### Step 3: Environment Variables
Update your production `.env`:
```env
GOOGLE_PAY_REDIRECT_URI=https://yourdomain.com/oauth/callback
NODE_ENV=production
```

### 7. Security Best Practices

1. **Never commit credentials to version control**
2. **Use environment variables for all secrets**
3. **Implement proper state parameter validation**
4. **Use HTTPS in production**
5. **Implement rate limiting**
6. **Log OAuth events for monitoring**

### 8. Next Steps

Once Google Pay is working:
1. Test the complete OAuth flow
2. Verify transaction data fetching
3. Test token refresh functionality
4. Implement error handling
5. Add monitoring and logging

## 🎯 Success Criteria

You'll know it's working when:
- ✅ OAuth popup opens when clicking "Connect Google Pay"
- ✅ Google OAuth page loads and asks for permissions
- ✅ After authorization, you're redirected back to the app
- ✅ Connection status shows as "Connected"
- ✅ You can sync transactions from Google Pay

## 📞 Support

If you encounter issues:
1. Check Google Cloud Console error logs
2. Verify all environment variables are set
3. Test with a fresh OAuth flow
4. Check browser network tab for API calls

---

**Note**: This setup provides real Google OAuth integration. The actual Google Pay transaction data access may require additional API permissions or partnerships with Google. 