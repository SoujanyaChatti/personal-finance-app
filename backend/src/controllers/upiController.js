import crypto from 'crypto';
import { 
  fetchUPITransactions, 
  importUPITransactions, 
  getUPIAnalytics,
  categorizeMerchant,
  createUPIConnection,
  getUserUPIConnections,
  disconnectUPIApp,
  generateOAuthUrl,
  processOAuthCallback
} from '../services/upiService.js';
import UPITransaction from '../models/UPITransaction.js';

// Fetch UPI transactions from MCP
export const syncUPITransactions = async (req, res) => {
  try {
    const { upiId, upiApp, startDate, endDate } = req.body;
    
    if (!upiId || !upiApp) {
      return res.status(400).json({ error: 'UPI ID and UPI App are required.' });
    }
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
    const end = endDate ? new Date(endDate) : new Date();
    
    const transactions = await fetchUPITransactions(
      req.user.userId,
      upiId,
      upiApp,
      start,
      end
    );
    
    res.json({
      message: `Successfully synced ${transactions.length} UPI transactions`,
      transactions,
      count: transactions.length
    });
  } catch (err) {
    console.error('Error syncing UPI transactions:', err);
    res.status(500).json({ error: 'Failed to sync UPI transactions.' });
  }
};

// Get UPI transactions
export const getUPITransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, upiApp, type, startDate, endDate } = req.query;
    const filter = { userId: req.user.userId };
    
    if (upiApp) filter.upiApp = upiApp;
    if (type) filter.type = type;
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [transactions, total] = await Promise.all([
      UPITransaction.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      UPITransaction.countDocuments(filter)
    ]);
    
    res.json({
      transactions,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    console.error('Error fetching UPI transactions:', err);
    res.status(500).json({ error: 'Failed to fetch UPI transactions.' });
  }
};

// Import UPI transactions to main transaction list
export const importTransactions = async (req, res) => {
  try {
    const { transactionIds } = req.body;
    
    if (!transactionIds || !Array.isArray(transactionIds)) {
      return res.status(400).json({ error: 'Transaction IDs array is required.' });
    }
    
    const importedTransactions = await importUPITransactions(
      req.user.userId,
      transactionIds
    );
    
    res.json({
      message: `Successfully imported ${importedTransactions.length} transactions`,
      importedTransactions,
      count: importedTransactions.length
    });
  } catch (err) {
    console.error('Error importing transactions:', err);
    res.status(500).json({ error: 'Failed to import transactions.' });
  }
};

// Get UPI analytics
export const getAnalytics = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    const analytics = await getUPIAnalytics(req.user.userId, period);
    
    res.json(analytics);
  } catch (err) {
    console.error('Error fetching UPI analytics:', err);
    res.status(500).json({ error: 'Failed to fetch UPI analytics.' });
  }
};

// Update UPI transaction category
export const updateCategory = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { category } = req.body;
    
    if (!category) {
      return res.status(400).json({ error: 'Category is required.' });
    }
    
    const transaction = await UPITransaction.findOneAndUpdate(
      { transactionId, userId: req.user.userId },
      { category, updatedAt: new Date() },
      { new: true }
    );
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }
    
    res.json(transaction);
  } catch (err) {
    console.error('Error updating UPI transaction category:', err);
    res.status(500).json({ error: 'Failed to update transaction category.' });
  }
};

// Get UPI apps summary
export const getUPIAppsSummary = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
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
      userId: req.user.userId,
      timestamp: { $gte: startDate, $lte: endDate }
    });
    
    const appSummary = {};
    const upiApps = ['gpay', 'phonepe', 'paytm', 'bhim', 'other'];
    
    upiApps.forEach(app => {
      const appTransactions = transactions.filter(tx => tx.upiApp === app);
      appSummary[app] = {
        count: appTransactions.length,
        totalAmount: appTransactions.reduce((sum, tx) => sum + tx.amount, 0),
        avgAmount: appTransactions.length > 0 
          ? appTransactions.reduce((sum, tx) => sum + tx.amount, 0) / appTransactions.length 
          : 0
      };
    });
    
    res.json(appSummary);
  } catch (err) {
    console.error('Error fetching UPI apps summary:', err);
    res.status(500).json({ error: 'Failed to fetch UPI apps summary.' });
  }
};

// Get user's UPI connections
export const getConnections = async (req, res) => {
  try {
    const connections = await getUserUPIConnections(req.user.userId);
    res.json(connections);
  } catch (err) {
    console.error('Error fetching UPI connections:', err);
    res.status(500).json({ error: 'Failed to fetch UPI connections.' });
  }
};

// Generate OAuth URL for UPI app connection
export const getOAuthUrl = async (req, res) => {
  try {
    const { upiApp } = req.params;
    const state = crypto.randomBytes(16).toString('hex'); // Generate secure state
    
    const oauthUrl = generateOAuthUrl(upiApp, state);
    
    res.json({
      oauthUrl,
      state,
      upiApp
    });
  } catch (err) {
    console.error('Error generating OAuth URL:', err);
    res.status(500).json({ error: 'Failed to generate OAuth URL.' });
  }
};

// Handle OAuth callback
export const handleOAuthCallback = async (req, res) => {
  try {
    const { upiApp, code, state } = req.query;
    
    if (!code || !state) {
      return res.status(400).json({ error: 'Missing authorization code or state.' });
    }
    
    // In production, you should validate the state parameter
    // to prevent CSRF attacks
    
    const connection = await processOAuthCallback(req.user.userId, upiApp, code);
    
    res.json({
      message: `Successfully connected ${upiApp}`,
      connection: {
        upiApp: connection.upiApp,
        upiId: connection.upiId,
        bankName: connection.bankDetails?.bankName,
        isActive: connection.isActive
      }
    });
  } catch (err) {
    console.error('Error handling OAuth callback:', err);
    res.status(500).json({ error: 'Failed to complete OAuth process.' });
  }
};

// Disconnect UPI app
export const disconnectApp = async (req, res) => {
  try {
    const { upiApp } = req.params;
    
    const result = await disconnectUPIApp(req.user.userId, upiApp);
    
    res.json(result);
  } catch (err) {
    console.error('Error disconnecting UPI app:', err);
    res.status(500).json({ error: 'Failed to disconnect UPI app.' });
  }
}; 