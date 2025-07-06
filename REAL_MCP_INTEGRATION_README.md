# Real MCP Integration for UPI Apps

This document explains how to set up and use the real MCP (Model Context Protocol) integration for connecting to actual UPI payment apps and fetching real transaction data.

## 🚀 Features

- **Real OAuth Integration**: Connect to Google Pay, PhonePe, Paytm, and BHIM
- **Secure Token Management**: Automatic token refresh and secure storage
- **Real Transaction Data**: Fetch actual UPI transactions from connected apps
- **Bank Integration**: Support for major Indian banks (HDFC, ICICI, SBI, Axis, etc.)
- **Smart Categorization**: AI-powered merchant categorization
- **Transaction Verification**: Verify transaction authenticity with NPCI
- **Multi-App Support**: Connect multiple UPI apps simultaneously

## 🔧 Setup Instructions

### 1. Environment Configuration

Create a `.env` file in the backend directory with the following variables:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/personal_finance
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
PORT=3000

# MCP Configuration
MCP_ENDPOINT=https://your-mcp-server.com/api
MCP_API_KEY=your_mcp_api_key_here

# NPCI UPI APIs
NPCI_BASE_URL=https://api.npci.org.in/upi
NPCI_API_KEY=your_npci_api_key_here

# UPI App APIs
GOOGLE_PAY_API=https://pay.google.com/api
PHONEPE_API=https://api.phonepe.com
PAYTM_API=https://api.paytm.com

# Bank APIs
HDFC_API_URL=https://api.hdfcbank.com
ICICI_API_URL=https://api.icicibank.com
SBI_API_URL=https://api.sbi.co.in
AXIS_API_URL=https://api.axisbank.com

# OAuth Configuration
GOOGLE_PAY_CLIENT_ID=your_google_pay_client_id
GOOGLE_PAY_CLIENT_SECRET=your_google_pay_client_secret
GOOGLE_PAY_REDIRECT_URI=http://localhost:3000/api/upi/oauth/callback

PHONEPE_CLIENT_ID=your_phonepe_client_id
PHONEPE_CLIENT_SECRET=your_phonepe_client_secret
PHONEPE_REDIRECT_URI=http://localhost:3000/api/upi/oauth/callback

PAYTM_CLIENT_ID=your_paytm_client_id
PAYTM_CLIENT_SECRET=your_paytm_client_secret
PAYTM_REDIRECT_URI=http://localhost:3000/api/upi/oauth/callback
```

### 2. API Registration

#### Google Pay API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Pay API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs
6. Get Client ID and Client Secret

#### PhonePe API
1. Register at [PhonePe Developer Portal](https://developer.phonepe.com/)
2. Create a new application
3. Get API credentials
4. Configure OAuth settings

#### Paytm API
1. Register at [Paytm Developer Portal](https://developer.paytm.com/)
2. Create merchant account
3. Get API keys
4. Configure OAuth settings

#### NPCI API
1. Register at [NPCI Developer Portal](https://developer.npci.org.in/)
2. Get UPI API access
3. Configure webhook endpoints

### 3. Database Setup

The integration uses MongoDB with the following collections:
- `UPIConnection`: Stores OAuth tokens and connection details
- `UPITransaction`: Stores fetched UPI transactions
- `Transaction`: Main transaction collection (imported from UPI)

### 4. Installation

```bash
# Backend
cd backend
npm install
npm start

# Frontend
cd frontend
npm install
npm run dev
```

## 🔗 API Endpoints

### UPI Connection Management

#### Get OAuth URL
```
GET /api/upi/oauth/:upiApp
```
Generates OAuth URL for connecting UPI apps.

#### OAuth Callback
```
GET /api/upi/oauth/callback?code=...&state=...
```
Handles OAuth callback and creates connection.

#### Get Connections
```
GET /api/upi/connections
```
Returns user's connected UPI apps.

#### Disconnect App
```
DELETE /api/upi/connections/:upiApp
```
Disconnects a UPI app.

### Transaction Management

#### Sync Transactions
```
POST /api/upi/sync
Body: { upiId: "user@upi", upiApp: "gpay" }
```
Fetches transactions from connected UPI app.

#### Get Transactions
```
GET /api/upi/transactions
```
Returns user's UPI transactions.

#### Import Transactions
```
POST /api/upi/import
Body: { transactionIds: ["id1", "id2"] }
```
Imports UPI transactions to main transaction list.

#### Update Category
```
PUT /api/upi/transactions/:transactionId/category
Body: { category: "Food" }
```
Updates transaction category.

### Analytics

#### Get Analytics
```
GET /api/upi/analytics?period=month
```
Returns UPI transaction analytics.

#### Get Apps Summary
```
GET /api/upi/apps-summary?period=month
```
Returns summary by UPI app.

## 🔐 Security Features

### OAuth Security
- Secure state parameter validation
- Token encryption in database
- Automatic token refresh
- Secure redirect URI validation

### Data Security
- UPI ID validation
- Transaction verification with NPCI
- Bank-level security checks
- Rate limiting on API calls

### Privacy
- Minimal data collection
- Secure token storage
- User consent for data access
- GDPR compliance

## 📱 Frontend Integration

The frontend provides a user-friendly interface for:

1. **Connecting UPI Apps**: One-click OAuth connection
2. **Managing Connections**: View and disconnect apps
3. **Syncing Transactions**: Manual and automatic sync
4. **Viewing Analytics**: Real-time transaction insights
5. **Importing Data**: Seamless integration with main app

## 🚨 Important Notes

### Production Deployment
1. Use HTTPS for all OAuth redirects
2. Implement proper CORS configuration
3. Set up monitoring and logging
4. Configure rate limiting
5. Use environment-specific API keys

### API Limits
- Google Pay: 10,000 requests/day
- PhonePe: 5,000 requests/day
- Paytm: 5,000 requests/day
- NPCI: 1,000 requests/day

### Error Handling
The system handles various error scenarios:
- OAuth failures
- Token expiration
- API rate limits
- Network timeouts
- Invalid UPI IDs

## 🔄 Workflow

1. **User connects UPI app** via OAuth
2. **System stores tokens** securely
3. **User syncs transactions** manually or automatically
4. **System categorizes** transactions using AI
5. **User imports** selected transactions
6. **Analytics update** in real-time

## 🛠 Troubleshooting

### Common Issues

1. **OAuth Connection Fails**
   - Check redirect URI configuration
   - Verify client credentials
   - Ensure HTTPS in production

2. **Token Refresh Fails**
   - Check refresh token validity
   - Verify API credentials
   - Check network connectivity

3. **Transaction Sync Fails**
   - Verify UPI ID format
   - Check API rate limits
   - Ensure app permissions

### Debug Mode
Enable debug logging by setting:
```env
NODE_ENV=development
DEBUG=mcp:*
```

## 📞 Support

For technical support:
- Check API documentation
- Review error logs
- Contact respective API providers
- Check system status pages

## 🔮 Future Enhancements

- **Real-time Sync**: Webhook-based automatic sync
- **More Banks**: Additional bank integrations
- **Advanced Analytics**: ML-powered insights
- **Mobile App**: Native mobile integration
- **Family Accounts**: Multi-user support
- **Export Features**: PDF/Excel reports

---

**Note**: This integration requires proper API access and compliance with respective terms of service. Ensure you have the necessary permissions and follow security best practices. 