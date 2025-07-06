import mongoose from 'mongoose';

const upiTransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  upiId: { type: String, required: true }, // User's UPI ID
  transactionId: { type: String, required: true, unique: true }, // UPI transaction ID
  merchantName: { type: String, required: true },
  merchantUpiId: { type: String },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['credit', 'debit'], required: true },
  category: { type: String, default: 'Other' },
  description: { type: String },
  timestamp: { type: Date, required: true },
  upiApp: { type: String, enum: ['gpay', 'phonepe', 'paytm', 'bhim', 'other'] },
  status: { type: String, enum: ['success', 'pending', 'failed'], default: 'success' },
  referenceNumber: { type: String },
  remarks: { type: String },
  isImported: { type: Boolean, default: false }, // Whether imported to main transactions
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for efficient querying
upiTransactionSchema.index({ userId: 1, timestamp: -1 });
upiTransactionSchema.index({ transactionId: 1 }, { unique: true });

export default mongoose.model('UPITransaction', upiTransactionSchema); 