import UPITransaction from '../models/UPITransaction.js';
import Transaction from '../models/Transaction.js';
import UPIConnection from '../models/UPIConnection.js';
import mcpService from './mcpService.js';

// Merchant categorization based on common patterns
const merchantCategories = {
  // Food & Dining
  'swiggy': 'Dining',
  'zomato': 'Dining',
  'dominos': 'Dining',
  'pizzahut': 'Dining',
  'mcdonalds': 'Dining',
  'kfc': 'Dining',
  'starbucks': 'Dining',
  'cafe': 'Dining',
  'restaurant': 'Dining',
  
  // Groceries
  'bigbasket': 'Groceries',
  'grofers': 'Groceries',
  'dunzo': 'Groceries',
  'amazon fresh': 'Groceries',
  'reliance fresh': 'Groceries',
  'dmart': 'Groceries',
  'big bazaar': 'Groceries',
  'supermarket': 'Groceries',
  
  // Transport
  'uber': 'Transport',
  'ola': 'Transport',
  'rapido': 'Transport',
  'metro': 'Transport',
  'bus': 'Transport',
  'train': 'Transport',
  'petrol': 'Transport',
  'fuel': 'Transport',
  'parking': 'Transport',
  
  // Shopping
  'amazon': 'Shopping',
  'flipkart': 'Shopping',
  'myntra': 'Shopping',
  'ajio': 'Shopping',
  'nykaa': 'Shopping',
  'croma': 'Shopping',
  'reliance digital': 'Shopping',
  
  // Entertainment
  'netflix': 'Entertainment',
  'prime': 'Entertainment',
  'hotstar': 'Entertainment',
  'sony liv': 'Entertainment',
  'zee5': 'Entertainment',
  'bookmyshow': 'Entertainment',
  'movie': 'Entertainment',
  
  // Utilities
  'electricity': 'Utilities',
  'water': 'Utilities',
  'gas': 'Utilities',
  'internet': 'Utilities',
  'mobile': 'Utilities',
  'broadband': 'Utilities',
  
  // Healthcare
  'pharmacy': 'Healthcare',
  'medical': 'Healthcare',
  'hospital': 'Healthcare',
  'doctor': 'Healthcare',
  'apollo': 'Healthcare',
  'fortis': 'Healthcare',
  
  // Education
  'coursera': 'Education',
  'udemy': 'Education',
  'byju': 'Education',
  'unacademy': 'Education',
  'school': 'Education',
  'college': 'Education',
  'university': 'Education'
};

// Smart categorization function
export function categorizeMerchant(merchantName) {
  const normalizedName = merchantName.toLowerCase();
  
  for (const [keyword, category] of Object.entries(merchantCategories)) {
    if (normalizedName.includes(keyword)) {
      return category;
    }
  }
  
  // Additional smart categorization based on patterns
  if (normalizedName.includes('atm') || normalizedName.includes('bank')) {
    return 'Banking';
  }
  if (normalizedName.includes('insurance')) {
    return 'Insurance';
  }
  if (normalizedName.includes('investment') || normalizedName.includes('mutual fund')) {
    return 'Investment';
  }
  
  return 'Other';
}

// Real MCP Integration for UPI transaction fetching
export async function fetchUPITransactions(userId, upiId, upiApp, startDate, endDate) {
  try {
    // Validate UPI ID format
    if (!mcpService.validateUPIId(upiId)) {
      throw new Error('Invalid UPI ID format');
    }

    // Check if we have an active connection for this user and UPI app
    let connection = await UPIConnection.findOne({ userId, upiApp, isActive: true });
    
    if (!connection) {
      throw new Error(`No active connection found for ${upiApp}. Please connect your ${upiApp} account first.`);
    }

    // Check if token needs refresh
    if (connection.needsTokenRefresh()) {
      try {
        const newTokenData = await mcpService.refreshAccessToken(upiApp, connection.refreshToken);
        connection.accessToken = newTokenData.access_token;
        connection.tokenExpiresAt = new Date(Date.now() + (newTokenData.expires_in * 1000));
        connection.updatedAt = new Date();
        await connection.save();
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        connection.isActive = false;
        await connection.save();
        throw new Error('Your UPI connection has expired. Please reconnect your account.');
      }
    }

    // Fetch real transactions using MCP
    const realTransactions = await mcpService.fetchUPITransactions(
      upiApp,
      connection.accessToken,
      upiId,
      startDate,
      endDate
    );

    // Process and save transactions
    const savedTransactions = [];
    for (const tx of realTransactions) {
      const category = categorizeMerchant(tx.merchantName);
      
      const upiTransaction = await UPITransaction.findOneAndUpdate(
        { transactionId: tx.transactionId },
        {
          userId,
          upiId,
          transactionId: tx.transactionId,
          merchantName: tx.merchantName,
          merchantUpiId: tx.merchantUpiId,
          amount: tx.amount,
          type: tx.type,
          description: tx.description || `UPI ${tx.type} to ${tx.merchantName}`,
          timestamp: tx.timestamp,
          upiApp,
          status: tx.status,
          referenceNumber: tx.referenceNumber,
          remarks: tx.remarks,
          category,
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );
      
      savedTransactions.push(upiTransaction);
    }

    // Update last sync time
    connection.lastSyncAt = new Date();
    await connection.save();
    
    return savedTransactions;
  } catch (error) {
    console.error('Error fetching UPI transactions:', error);
    throw new Error(error.message || 'Failed to fetch UPI transactions');
  }
}

// UPI Connection Management
export async function createUPIConnection(userId, upiApp, upiId, accessToken, refreshToken, expiresIn) {
  try {
    // Validate UPI ID
    if (!mcpService.validateUPIId(upiId)) {
      throw new Error('Invalid UPI ID format');
    }

    // Get bank details
    const bankDetails = await mcpService.getBankDetails(upiId);
    const transactionLimits = await mcpService.getTransactionLimits(upiId);

    // Create or update connection
    const connection = await UPIConnection.findOneAndUpdate(
      { userId, upiApp },
      {
        upiId,
        accessToken,
        refreshToken,
        tokenExpiresAt: new Date(Date.now() + (expiresIn * 1000)),
        bankDetails,
        transactionLimits,
        isActive: true,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    return connection;
  } catch (error) {
    console.error('Error creating UPI connection:', error);
    throw new Error('Failed to create UPI connection');
  }
}

// Get UPI connections for user
export async function getUserUPIConnections(userId) {
  try {
    const connections = await UPIConnection.find({ userId, isActive: true });
    return connections.map(conn => ({
      upiApp: conn.upiApp,
      upiId: conn.upiId,
      bankName: conn.bankDetails?.bankName,
      lastSyncAt: conn.lastSyncAt,
      isConnected: !conn.isTokenExpired(),
      syncFrequency: conn.syncFrequency
    }));
  } catch (error) {
    console.error('Error getting UPI connections:', error);
    throw new Error('Failed to get UPI connections');
  }
}

// Disconnect UPI app
export async function disconnectUPIApp(userId, upiApp) {
  try {
    const connection = await UPIConnection.findOneAndUpdate(
      { userId, upiApp },
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );

    if (!connection) {
      throw new Error('No active connection found for this UPI app');
    }

    return { message: `Successfully disconnected ${upiApp}` };
  } catch (error) {
    console.error('Error disconnecting UPI app:', error);
    throw new Error('Failed to disconnect UPI app');
  }
}

// Generate OAuth URL for UPI app connection
export function generateOAuthUrl(upiApp, state) {
  try {
    return mcpService.generateOAuthUrl(upiApp, state);
  } catch (error) {
    console.error('Error generating OAuth URL:', error);
    throw new Error('Failed to generate OAuth URL');
  }
}

// Handle OAuth callback and create connection
export async function processOAuthCallback(userId, upiApp, code) {
  try {
    // Exchange code for tokens
    const tokenData = await mcpService.exchangeCodeForToken(upiApp, code);
    
    // Create connection
    const connection = await createUPIConnection(
      userId,
      upiApp,
      '', // UPI ID will be fetched from the app
      tokenData.access_token,
      tokenData.refresh_token,
      tokenData.expires_in
    );

    return connection;
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    throw new Error('Failed to complete OAuth process');
  }
}

// Import UPI transactions to main transaction list
export async function importUPITransactions(userId, transactionIds) {
  try {
    const upiTransactions = await UPITransaction.find({
      userId,
      transactionId: { $in: transactionIds },
      isImported: false
    });
    
    const importedTransactions = [];
    
    for (const upiTx of upiTransactions) {
      // Check if transaction already exists
      const existingTx = await Transaction.findOne({
        userId,
        amount: upiTx.amount,
        date: upiTx.timestamp,
        description: { $regex: upiTx.merchantName, $options: 'i' }
      });
      
      if (!existingTx) {
        const transaction = await Transaction.create({
          userId,
          type: upiTx.type === 'credit' ? 'income' : 'expense',
          amount: upiTx.amount,
          category: upiTx.category,
          date: upiTx.timestamp,
          description: `UPI ${upiTx.type} - ${upiTx.merchantName}`,
        });
        
        importedTransactions.push(transaction);
        
        // Mark as imported
        upiTx.isImported = true;
        await upiTx.save();
      }
    }
    
    return importedTransactions;
  } catch (error) {
    console.error('Error importing UPI transactions:', error);
    throw new Error('Failed to import UPI transactions');
  }
}

// Get UPI transaction analytics
export async function getUPIAnalytics(userId, period = 'month') {
  try {
    const now = new Date();
    let startDate, endDate;
    
    if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (period === 'week') {
      const dayOfWeek = now.getDay();
      startDate = new Date(now.getTime() - (dayOfWeek * 24 * 60 * 60 * 1000));
      endDate = new Date(startDate.getTime() + (6 * 24 * 60 * 60 * 1000));
    }
    
    const transactions = await UPITransaction.find({
      userId,
      timestamp: { $gte: startDate, $lte: endDate }
    });
    
    const analytics = {
      totalTransactions: transactions.length,
      totalAmount: transactions.reduce((sum, tx) => sum + tx.amount, 0),
      byApp: {},
      byCategory: {},
      byType: { credit: 0, debit: 0 },
      topMerchants: {}
    };
    
    transactions.forEach(tx => {
      // By app
      analytics.byApp[tx.upiApp] = (analytics.byApp[tx.upiApp] || 0) + 1;
      
      // By category
      analytics.byCategory[tx.category] = (analytics.byCategory[tx.category] || 0) + tx.amount;
      
      // By type
      analytics.byType[tx.type]++;
      
      // Top merchants
      analytics.topMerchants[tx.merchantName] = (analytics.topMerchants[tx.merchantName] || 0) + 1;
    });
    
    // Sort top merchants
    analytics.topMerchants = Object.entries(analytics.topMerchants)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
    
    return analytics;
  } catch (error) {
    console.error('Error getting UPI analytics:', error);
    throw new Error('Failed to get UPI analytics');
  }
} 