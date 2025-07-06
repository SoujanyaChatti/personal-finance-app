import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL;

// Quick action suggestions
const QUICK_ACTIONS = [
  { text: "What's my spending pattern?", icon: "📊" },
  { text: "Show me my highest expenses", icon: "💰" },
  { text: "What's my spend-to-earn ratio?", icon: "⚖️" },
  { text: "Give me budget advice", icon: "💡" },
  { text: "Analyze my recent transactions", icon: "🔍" },
  { text: "How can I save more money?", icon: "💎" }
];

export default function ChatbotPage() {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation history on mount
  useEffect(() => {
    if (user?.id) {
      loadConversationHistory();
    }
  }, [user?.id]);

  const loadConversationHistory = async () => {
    try {
      const res = await axios.get(`${API_URL}/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversationHistory(res.data.conversations || []);
    } catch (err) {
      console.error('Failed to load conversation history:', err);
    }
  };

  const sendMessage = async (messageText = input) => {
    if (!messageText.trim()) return;
    
    const timestamp = new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    const userMessage = { 
      role: 'user', 
      text: messageText, 
      timestamp,
      id: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);
    setShowQuickActions(false);

    try {
      const res = await axios.post(
        `${API_URL}/chat`, 
        { question: messageText, conversationId: currentConversationId }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const botMessage = { 
        role: 'bot', 
        text: res.data.answer, 
        timestamp,
        id: Date.now() + 1,
        context: res.data.context
      };
      
      setMessages(prev => [...prev, botMessage]);
      
      // Update conversation ID if it's a new conversation
      if (res.data.conversationId && !currentConversationId) {
        setCurrentConversationId(res.data.conversationId);
      }
      
      // Reload conversation history to get updated data
      await loadConversationHistory();
      
    } catch (err) {
      setError('Failed to get response from chatbot.');
      console.error('Chat error:', err);
    }
    
    setLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const handleQuickAction = (action) => {
    sendMessage(action.text);
  };

  const clearHistory = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setShowQuickActions(true);
  };

  const formatMessage = (text) => {
    // Simple markdown-like formatting
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen flex flex-col max-w-4xl mx-auto">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3">
              🤖 AI Financial Assistant
            </h2>
            <p className="text-blue-100 mt-1">
              Your intelligent financial companion - Ask anything about your money!
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={clearHistory}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition duration-200 text-sm"
            >
              Clear Chat
            </button>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-4 max-w-3xl mx-auto">
          {/* Conversation History Sidebar */}
          {conversationHistory.length > 0 && (
            <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                📚 Conversation History
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {conversationHistory.slice(0, 5).map((conv) => (
                  <div key={conv.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{conv.title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(conv.updatedAt).toLocaleDateString()} • {conv.messageCount} messages
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Welcome Message */}
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md mx-auto">
                <div className="text-6xl mb-4">🤖</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Welcome to your AI Financial Assistant!
                </h3>
                <p className="text-gray-600 mb-6">
                  I can help you analyze your spending, provide budget advice, and answer questions about your finances.
                </p>
                
                {/* Quick Actions */}
                {showQuickActions && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-700">Try asking:</p>
                    <div className="grid grid-cols-1 gap-2">
                      {QUICK_ACTIONS.map((action, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickAction(action)}
                          className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition duration-200 text-left"
                        >
                          <span className="text-xl">{action.icon}</span>
                          <span className="text-sm text-gray-700">{action.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs md:max-w-md lg:max-w-lg p-4 rounded-2xl shadow-lg ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' 
                  : 'bg-white text-gray-800 border border-gray-100'
              }`}>
                <div 
                  className="break-words leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }}
                />
                <div className={`text-xs mt-2 ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                  {msg.timestamp}
                </div>
                
                {/* Context Data for Bot Messages */}
                {msg.role === 'bot' && msg.context && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs">
                    <div className="font-medium text-gray-700 mb-1">📊 Quick Stats:</div>
                    <div className="grid grid-cols-2 gap-2 text-gray-600">
                      <div>Income: ${msg.context.income?.toFixed(2) || '0'}</div>
                      <div>Expenses: ${msg.context.expenses?.toFixed(2) || '0'}</div>
                      <div>Ratio: {msg.context.ratio || 'N/A'}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                  <span className="text-gray-600 text-sm">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="bg-white p-6 shadow-lg border-t border-gray-200">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1 relative">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 pr-12"
                placeholder="Ask me anything about your finances..."
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
          
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-600">
                <span>⚠️</span>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Quick Actions Footer */}
          {messages.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2">Quick actions:</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_ACTIONS.slice(0, 3).map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action)}
                    disabled={loading}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition duration-200 disabled:opacity-50"
                  >
                    {action.icon} {action.text}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}