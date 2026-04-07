import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import HSCodeIntelligence from './pages/HSCodeIntelligence';
import HSCodeManagement from './pages/HSCodeManagement';
import SavedLeads from './pages/SavedLeads';
import Login from './pages/Login';
import UserManagement from './pages/UserManagement';

import TradeDashboard from './pages/analytics/TradeDashboard';
import TradeExplore from './pages/analytics/TradeExplore';
import TradeInsights from './pages/analytics/TradeInsights';
import TradeUpload from './pages/analytics/TradeUpload';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';
import { useAuth } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};

const AppContent = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  if (isLoginPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden relative">
      <div className="zen-glow" />

      {/* Sidebar Component */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header Component */}
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        {/* Scrollable Content Section */}
        <main className="flex-1 overflow-y-auto custom-scrollbar flex flex-col relative">
          <div className="flex-1 p-4 lg:p-8">
            <Routes>
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/hscodes" element={<ProtectedRoute><HSCodeIntelligence /></ProtectedRoute>} />
              <Route path="/hscodes/manage" element={<ProtectedRoute><HSCodeManagement /></ProtectedRoute>} />
              <Route path="/leads" element={<ProtectedRoute><SavedLeads /></ProtectedRoute>} />
              
              <Route path="/analytics/dashboard" element={<ProtectedRoute><TradeDashboard /></ProtectedRoute>} />
              <Route path="/analytics/explore" element={<ProtectedRoute><TradeExplore /></ProtectedRoute>} />
              <Route path="/analytics/insights" element={<ProtectedRoute><TradeInsights /></ProtectedRoute>} />
              <Route path="/analytics/upload" element={<ProtectedRoute><TradeUpload /></ProtectedRoute>} />
              
              <Route path="/settings/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>

          {/* Footer Component */}
          <Footer />
        </main>
      </div>
    </div>
  );
};

const App = () => (
  <ThemeProvider>
    <Router>
      <AppContent />
    </Router>
  </ThemeProvider>
);

export default App;
