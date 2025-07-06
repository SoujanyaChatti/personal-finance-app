import mongoose from 'mongoose';

const upiConnectionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  upiApp: { type: String, enum: ['gpay', 'phonepe', 'paytm', 'bhim'], required: true },
  upiId: { type: String, required: true },
  accessToken: { type: String, required: true },
  refreshToken: { type: String, required: true },
  tokenExpiresAt: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  lastSyncAt: { type: Date },
  syncFrequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' },
  bankDetails: {
    bankName: String,
    bankHandle: String,
    accountNumber: String, // Masked
  },
  transactionLimits: {
    dailyLimit: Number,
    perTransactionLimit: Number,
    monthlyLimit: Number,
  },
  permissions: [{
    scope: String,
    granted: Boolean,
    grantedAt: Date,
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound index to ensure one connection per user per UPI app
upiConnectionSchema.index({ userId: 1, upiApp: 1 }, { unique: true });

// Method to check if token is expired
upiConnectionSchema.methods.isTokenExpired = function() {
  return new Date() > this.tokenExpiresAt;
};

// Method to refresh token if needed
upiConnectionSchema.methods.needsTokenRefresh = function() {
  const now = new Date();
  const refreshThreshold = new Date(this.tokenExpiresAt.getTime() - (5 * 60 * 1000)); // 5 minutes before expiry
  return now > refreshThreshold;
};

export default mongoose.model('UPIConnection', upiConnectionSchema); 