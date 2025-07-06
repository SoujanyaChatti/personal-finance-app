import axios from 'axios';
import crypto from 'crypto';

// MCP Configuration
const MCP_CONFIG = {
  // NPCI UPI APIs (National Payments Corporation of India)
  NPCI_BASE_URL: process.env.NPCI_BASE_URL || 'https://api.npci.org.in/upi',
  NPCI_API_KEY: process.env.NPCI_API_KEY,
  
  // UPI App APIs
  GOOGLE_PAY_API: process.env.GOOGLE_PAY_API || 'https://walletobjects.googleapis.com',
  PHONEPE_API: process.env.PHONEPE_API || 'https://api.phonepe.com',
  PAYTM_API: process.env.PAYTM_API || 'https://api.paytm.com',
  
  // Bank APIs (for transaction data)
  BANK_APIS: {
    'hdfc': process.env.HDFC_API_URL,
    'icici': process.env.ICICI_API_URL,
    'sbi': process.env.SBI_API_URL,
    'axis': process.env.AXIS_API_URL,
  },
  
  // MCP Client Configuration
  MCP_ENDPOINT: process.env.MCP_ENDPOINT,
  MCP_API_KEY: process.env.MCP_API_KEY,
};

// UPI App OAuth configurations
const UPI_APP_CONFIGS = {
  gpay: {
    clientId: process.env.GOOGLE_PAY_CLIENT_ID,
    clientSecret: process.env.GOOGLE_PAY_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_PAY_REDIRECT_URI,
    scope: 'https://www.googleapis.com/auth/wallet_object.issuer https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
  },
  phonepe: {
    clientId: process.env.PHONEPE_CLIENT_ID,
    clientSecret: process.env.PHONEPE_CLIENT_SECRET,
    redirectUri: process.env.PHONEPE_REDIRECT_URI,
    scope: 'payments.read',
  },
  paytm: {
    clientId: process.env.PAYTM_CLIENT_ID,
    clientSecret: process.env.PAYTM_CLIENT_SECRET,
    redirectUri: process.env.PAYTM_REDIRECT_URI,
    scope: 'payments.read',
  },
};

class MCPService {
  constructor() {
    this.accessTokens = new Map();
  }

  // Generate OAuth URL for UPI app authorization
  generateOAuthUrl(upiApp, state) {
    const config = UPI_APP_CONFIGS[upiApp];
    if (!config || !config.clientId || !config.redirectUri) {
      throw new Error(`OAuth configuration not found for ${upiApp}. Please check your environment variables.`);
    }

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scope,
      response_type: 'code',
      state: state,
      access_type: 'offline',
    });

    const baseUrls = {
      gpay: 'https://accounts.google.com/o/oauth2/v2/auth',
      phonepe: 'https://oauth.phonepe.com/oauth/authorize',
      paytm: 'https://oauth.paytm.com/oauth/authorize',
    };

    return `${baseUrls[upiApp]}?${params.toString()}`;
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(upiApp, code) {
    const config = UPI_APP_CONFIGS[upiApp];
    if (!config || !config.clientId || !config.clientSecret) {
      throw new Error(`OAuth configuration not found for ${upiApp}. Please check your environment variables.`);
    }

    const tokenData = {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: config.redirectUri,
    };

    const tokenUrls = {
      gpay: 'https://oauth2.googleapis.com/token',
      phonepe: 'https://oauth.phonepe.com/oauth/token',
      paytm: 'https://oauth.paytm.com/oauth/token',
    };

    try {
      const response = await axios.post(tokenUrls[upiApp], tokenData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_in: response.data.expires_in,
        token_type: response.data.token_type,
      };
    } catch (error) {
      console.error(`Error exchanging code for token (${upiApp}):`, error.response?.data || error.message);
      throw new Error(`Failed to get access token for ${upiApp}`);
    }
  }

  // Fetch real UPI transactions from the app
  async fetchUPITransactions(upiApp, accessToken, upiId, startDate, endDate) {
    try {
      const transactions = await this.fetchFromUPIApp(upiApp, accessToken, upiId, startDate, endDate);
      return this.processTransactions(transactions, upiApp);
    } catch (error) {
      console.error(`Error fetching UPI transactions from ${upiApp}:`, error);
      throw new Error(`Failed to fetch transactions from ${upiApp}`);
    }
  }

  // Fetch transactions from specific UPI app
  async fetchFromUPIApp(upiApp, accessToken, upiId, startDate, endDate) {
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const params = {
      upiId: upiId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      limit: 100, // Fetch last 100 transactions
    };

    const apiEndpoints = {
      gpay: `${MCP_CONFIG.GOOGLE_PAY_API}/walletobjects/v1/transactions`,
      phonepe: `${MCP_CONFIG.PHONEPE_API}/v1/transactions`,
      paytm: `${MCP_CONFIG.PAYTM_API}/v1/transactions`,
    };

    const response = await axios.get(apiEndpoints[upiApp], {
      headers,
      params,
    });

    return response.data.transactions || [];
  }

  // Process and normalize transactions from different UPI apps
  processTransactions(transactions, upiApp) {
    return transactions.map(tx => ({
      transactionId: tx.transactionId || tx.id || this.generateTransactionId(tx),
      merchantName: tx.merchantName || tx.payeeName || tx.description,
      merchantUpiId: tx.merchantUpiId || tx.payeeUpiId || tx.vpa,
      amount: parseFloat(tx.amount) || 0,
      type: this.determineTransactionType(tx),
      description: tx.description || tx.remarks || tx.note,
      timestamp: new Date(tx.timestamp || tx.date || tx.createdAt),
      status: tx.status || 'success',
      referenceNumber: tx.referenceNumber || tx.refId || tx.utr,
      remarks: tx.remarks || tx.note || '',
      upiApp: upiApp,
    }));
  }

  // Determine transaction type (credit/debit)
  determineTransactionType(transaction) {
    // Logic to determine if it's credit or debit based on transaction data
    if (transaction.type) {
      return transaction.type.toLowerCase();
    }
    
    // Check amount sign or transaction direction
    if (transaction.amount < 0 || transaction.direction === 'outgoing') {
      return 'debit';
    }
    
    if (transaction.amount > 0 || transaction.direction === 'incoming') {
      return 'credit';
    }
    
    // Default based on common patterns
    return transaction.merchantName?.toLowerCase().includes('salary') ? 'credit' : 'debit';
  }

  // Generate unique transaction ID if not provided
  generateTransactionId(transaction) {
    const data = `${transaction.merchantName}${transaction.amount}${transaction.timestamp}`;
    return crypto.createHash('md5').update(data).digest('hex');
  }

  // Refresh access token using refresh token
  async refreshAccessToken(upiApp, refreshToken) {
    const config = UPI_APP_CONFIGS[upiApp];
    if (!config) {
      throw new Error(`Unsupported UPI app: ${upiApp}`);
    }

    const tokenData = {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    };

    const tokenUrls = {
      gpay: 'https://oauth2.googleapis.com/token',
      phonepe: 'https://oauth.phonepe.com/oauth/token',
      paytm: 'https://oauth.paytm.com/oauth/token',
    };

    try {
      const response = await axios.post(tokenUrls[upiApp], tokenData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      return {
        access_token: response.data.access_token,
        expires_in: response.data.expires_in,
        token_type: response.data.token_type,
      };
    } catch (error) {
      console.error(`Error refreshing token (${upiApp}):`, error.response?.data || error.message);
      throw new Error(`Failed to refresh token for ${upiApp}`);
    }
  }

  // Validate UPI ID format
  validateUPIId(upiId) {
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/;
    return upiRegex.test(upiId);
  }

  // Get bank details from UPI ID (if possible)
  async getBankDetails(upiId) {
    try {
      // This would typically involve NPCI API calls
      // For now, we'll return basic info
      const bankHandle = upiId.split('@')[1];
      
      const bankMappings = {
        'okicici': 'ICICI Bank',
        'okhdfcbank': 'HDFC Bank',
        'oksbi': 'State Bank of India',
        'okaxis': 'Axis Bank',
        'okkotak': 'Kotak Mahindra Bank',
        'okyes': 'Yes Bank',
        'okpnb': 'Punjab National Bank',
        'okbob': 'Bank of Baroda',
        'okcanara': 'Canara Bank',
        'okunion': 'Union Bank of India',
      };

      return {
        bankName: bankMappings[bankHandle] || 'Unknown Bank',
        bankHandle: bankHandle,
        upiId: upiId,
      };
    } catch (error) {
      console.error('Error getting bank details:', error);
      return { bankName: 'Unknown Bank', bankHandle: 'unknown', upiId };
    }
  }

  // Get transaction limits for UPI ID
  async getTransactionLimits(upiId) {
    try {
      // This would involve NPCI API calls to get actual limits
      return {
        dailyLimit: 100000, // ₹1 lakh
        perTransactionLimit: 100000, // ₹1 lakh
        monthlyLimit: 1000000, // ₹10 lakhs
      };
    } catch (error) {
      console.error('Error getting transaction limits:', error);
      return null;
    }
  }

  // Verify transaction authenticity (for security)
  async verifyTransaction(transactionId, upiId) {
    try {
      // This would involve NPCI API calls to verify transaction
      // For now, we'll return true (assuming valid)
      return {
        verified: true,
        verificationTime: new Date(),
        transactionId: transactionId,
      };
    } catch (error) {
      console.error('Error verifying transaction:', error);
      return { verified: false, error: error.message };
    }
  }
}

export default new MCPService(); 