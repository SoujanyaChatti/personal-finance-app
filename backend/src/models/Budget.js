import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: String, required: true }, // Format: "YYYY-MM"
  year: { type: Number, required: true },
  categories: [{
    name: { type: String, required: true },
    limit: { type: Number, required: true },
    spent: { type: Number, default: 0 },
    color: { type: String, default: '#3B82F6' }
  }],
  totalBudget: { type: Number, required: true },
  totalSpent: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound index to ensure one budget per user per month
budgetSchema.index({ userId: 1, month: 1 }, { unique: true });

export default mongoose.model('Budget', budgetSchema); 