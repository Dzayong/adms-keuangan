import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ThemeProvider } from './context/ThemeContext.js';
import { LoginPage } from './pages/LoginPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { TransactionsPage } from './pages/TransactionsPage.js';
import { CreatePaymentPage } from './pages/CreatePaymentPage.js';
import { PaymentDetailPage } from './pages/PaymentDetailPage.js';
import { ReportsPage } from './pages/ReportsPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { UsersPage } from './pages/UsersPage.js';
import { ProvidersPage } from './pages/ProvidersPage.js';
import { ApiKeysPage } from './pages/ApiKeysPage.js';
import { PublicPaymentPage } from './pages/PublicPaymentPage.js';
import { ApiDocsPage } from './pages/ApiDocsPage.js';
import { Navbar } from './components/layout/Navbar.js';
import { Sidebar } from './components/layout/Sidebar.js';
import { AccessDenied } from './components/ui/AccessDenied.js';
import { RefreshCw } from 'lucide-react';

function AppContent() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-4">
        <RefreshCw className="w-10 h-10 text-amber-500 animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-400">Memuat ADMS QRIS Internal System...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/pay/:invoiceNumber" element={<PublicPaymentPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Public payment page accessible even when logged in (renders without sidebar/navbar)
  const currentPath = window.location.pathname;
  if (currentPath.startsWith('/pay/')) {
    return (
      <Routes>
        <Route path="/pay/:invoiceNumber" element={<PublicPaymentPage />} />
      </Routes>
    );
  }

  const navigateToDetail = (txId: number) => {
    navigate(`/transactions/${txId}`);
  };

  const handlePaymentCreated = (txId: number) => {
    navigate(`/transactions/${txId}`);
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-50 flex flex-col font-sans transition-colors duration-200">
      <Navbar
        onOpenCreateModal={() => navigate('/create_payment')}
        onToggleSidebar={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar 
          userRole={user.role} 
          isOpen={isMobileMenuOpen} 
          onClose={() => setIsMobileMenuOpen(false)} 
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full overflow-y-auto overflow-x-hidden">
          <Routes>
            {(user.role === 'MERCHANT' || user.role === 'IT') ? (
              <>
                <Route path="/" element={<Navigate to="/transactions" replace />} />
                <Route path="/transactions" element={<TransactionsPage onNavigateToDetail={navigateToDetail} />} />
                <Route path="/transactions/:id" element={<PaymentDetailPageWrapper onBack={() => navigate('/transactions')} />} />
                <Route path="/developer" element={<ApiDocsPage />} />
                <Route path="*" element={<Navigate to="/transactions" replace />} />
              </>
            ) : (
              <>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={
                  <DashboardPage
                    onNavigateToCreate={() => navigate('/create_payment')}
                    onNavigateToDetail={navigateToDetail}
                    onNavigateToTransactions={() => navigate('/transactions')}
                  />
                } />
                <Route path="/transactions" element={<TransactionsPage onNavigateToDetail={navigateToDetail} />} />
                <Route path="/transactions/:id" element={<PaymentDetailPageWrapper onBack={() => navigate('/transactions')} />} />
                <Route path="/create_payment" element={<CreatePaymentPage onPaymentCreated={handlePaymentCreated} onCancel={() => navigate('/dashboard')} />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/developer" element={<ApiDocsPage />} />

                {user.role === 'ADMIN' ? (
                  <>
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/users" element={<UsersPage />} />
                    <Route path="/providers" element={<ProvidersPage />} />
                    <Route path="/api_keys" element={<ApiKeysPage />} />
                  </>
                ) : (
                  <>
                    <Route path="/settings" element={<AccessDenied />} />
                    <Route path="/users" element={<AccessDenied />} />
                    <Route path="/providers" element={<AccessDenied />} />
                    <Route path="/api_keys" element={<AccessDenied />} />
                  </>
                )}

                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </div>
  );
}

// Wrapper to pass route params as props to PaymentDetailPage since it expects transactionId prop
function PaymentDetailPageWrapper({ onBack }: { onBack: () => void }) {
  const { id } = useParams();
  const txId = parseInt(id || '0', 10);
  return <PaymentDetailPage transactionId={txId} onBack={onBack} />;
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
