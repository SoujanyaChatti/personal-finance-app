import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Graphs from './pages/Graphs';
import Chatbot from './pages/Chatbot';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import OAuthCallback from './pages/OAuthCallback';
import { useAuth } from './hooks/useAuth';
import './styles/tailwind.css';
import ErrorBoundary from './components/ErrorBoundary';

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
}

function Navigation() {
  const { user } = useAuth();
  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center text-white">
        <div className="text-2xl font-bold">💸 Personal Finance Assistant</div>
        <div className="flex gap-6">
          {user ? (
            <>
              <Link to="/" className="hover:text-blue-200 transition">Dashboard</Link>
              <Link to="/graphs" className="hover:text-blue-200 transition">Graphs</Link>
              <Link to="/chatbot" className="hover:text-blue-200 transition">Chatbot</Link>
              <Link to="/settings" className="hover:text-blue-200 transition">Settings</Link>
              <Link to="/profile" className="hover:text-blue-200 transition">Profile</Link>
            </>
          ) : null}
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Navigation />
          <main className="container mx-auto px-6 py-8">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/graphs"
                element={
                  <ProtectedRoute>
                    <Graphs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chatbot"
                element={
                  <ProtectedRoute>
                    <Chatbot />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/oauth/callback"
                element={
                  <ProtectedRoute>
                    <OAuthCallback />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ErrorBoundary>
  );
}