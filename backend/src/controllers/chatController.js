import axios from 'axios';
import Transaction from '../models/Transaction.js';
import Conversation from '../models/Conversation.js';

export const chatWithGemini = async (req, res) => {
  const { question, conversationId } = req.body;
  const userId = req.user?.userId;

  if (!question) return res.status(400).json({ error: 'No question provided.' });
  if (!userId) return res.status(401).json({ error: 'Unauthorized: User not authenticated.' });

  try {
    // Query user's transactions
    const transactions = await Transaction.find({ userId }).lean();
    if (!transactions.length) {
      return res.status(400).json({ error: 'No financial data available to calculate spend-to-earn ratio.' });
    }

    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const ratio = income > 0 ? (expenses / income).toFixed(2) : 'N/A';

    // Handle spend-to-earn ratio question locally
    if (question.toLowerCase().includes('spend to earn ratio')) {
      if (income === 0) {
        return res.json({
          answer: 'Your spend-to-earn ratio is undefined because no income is recorded.',
          context: { expenses, income, ratio },
        });
      }
      return res.json({
        answer: `Your spend-to-earn ratio is ${ratio}, meaning you spend approximately $${ratio} for every dollar earned.`,
        context: { expenses, income, ratio },
      });
    }

    // Prepare context for Gemini API
    const context = `
      User ID: ${userId}
      Total Expenses: $${expenses.toFixed(2)}
      Total Income: $${income.toFixed(2)}
      Spend-to-Earn Ratio: ${ratio}
      Transactions: ${JSON.stringify(transactions.slice(0, 5))}
    `;
    const fullPrompt = `${context}\n\nUser Question: ${question}`;

    // Use updated endpoint and model
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent',
      {
        contents: [{ parts: [{ text: fullPrompt }] }],
      },
      {
        params: { key: process.env.GEMINI_API_KEY },
        timeout: 10000,
      }
    );

    const answer = response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No answer from Gemini API.';
    
    // Save conversation to database
    let conversation;
    if (conversationId) {
      // Update existing conversation
      conversation = await Conversation.findById(conversationId);
      if (!conversation || conversation.userId.toString() !== userId) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
    } else {
      // Create new conversation
      conversation = new Conversation({
        userId,
        title: question.substring(0, 50) + (question.length > 50 ? '...' : ''),
        messages: []
      });
    }

    // Add messages to conversation
    conversation.messages.push({
      role: 'user',
      text: question,
      context: { expenses, income, ratio, transactions: transactions.slice(0, 5) }
    });

    conversation.messages.push({
      role: 'bot',
      text: answer,
      context: { expenses, income, ratio, transactions: transactions.slice(0, 5) }
    });

    await conversation.save();

    res.json({ 
      answer, 
      conversationId: conversation._id,
      context: { expenses, income, ratio } 
    });
  } catch (err) {
    console.error('Gemini API error:', err.message, err.response?.data);
    let errorMessage = 'Failed to process question.';
    if (err.response?.status === 400) {
      errorMessage = 'Invalid API key or request. Please check the API key and ensure the Generative Language API is enabled.';
    } else if (err.response?.status === 404) {
      errorMessage = 'Model not found. Please check the model name or API version.';
    } else if (err.response?.status === 401) {
      errorMessage = 'Gemini API authentication failed. Invalid API key.';
    } else if (err.response?.status === 429) {
      errorMessage = 'Gemini API rate limit exceeded. Try again later.';
    }
    res.status(500).json({
      error: errorMessage,
      details: err.response?.data?.error?.message || err.message,
    });
  }
};

export const getUserConversations = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User not authenticated.' });
    }

    const conversations = await Conversation.find({ userId })
      .sort({ updatedAt: -1 })
      .select('title createdAt updatedAt messages')
      .limit(20);

    res.json({
      success: true,
      conversations: conversations.map(conv => ({
        id: conv._id,
        title: conv.title,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        messageCount: conv.messages.length
      }))
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversations'
    });
  }
};

export const getConversationById = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const conversationId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User not authenticated.' });
    }

    const conversation = await Conversation.findOne({ 
      _id: conversationId, 
      userId 
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({
      success: true,
      conversation: {
        id: conversation._id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        messages: conversation.messages
      }
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversation'
    });
  }
};