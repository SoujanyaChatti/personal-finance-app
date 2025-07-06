import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: { 
    type: String, 
    enum: ['user', 'bot'], 
    required: true 
  },
  text: { 
    type: String, 
    required: true 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  context: {
    expenses: Number,
    income: Number,
    ratio: String,
    transactions: Array
  }
});

const conversationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  messages: [messageSchema],
  title: { 
    type: String, 
    default: 'New Conversation' 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Index for efficient querying
conversationSchema.index({ userId: 1, createdAt: -1 });
conversationSchema.index({ userId: 1, isActive: 1 });

// Update the updatedAt field before saving
conversationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Conversation', conversationSchema); 