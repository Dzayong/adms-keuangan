import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
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
import { Navbar } from './components/layout/Navbar.js';
import { Sidebar } from './components/layout/Sidebar.js';
import { AccessDenied } from './components/ui/AccessDenied.js';
import { RefreshCw } from 'lucide-react';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedTxId, setSelectedTxId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-4">
        <RefreshCw className="w-10 h-10 text-amber-500 animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-400">Memuat ADMS QRIS Internal System...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const navigateToDetail = (txId: number) => {
    setSelectedTxId(txId);
    setActiveTab('payment_detail');
  };

  const handlePaymentCreated = (txId: number) => {
    setSelectedTxId(txId);
    setActiveTab('payment_detail');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      <Navbar
        onOpenCreateModal={() => setActiveTab('create_payment')}
      />

      <div className="flex flex-1">
        <Sidebar
          currentTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            if (tab !== 'payment_detail') setSelectedTxId(null);
          }}
          userRole={user.role}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {/* Active View Renderer */}
          {activeTab === 'dashboard' && (
            <DashboardPage
              onNavigateToCreate={() => setActiveTab('create_payment')}
              onNavigateToDetail={navigateToDetail}
              onNavigateToTransactions={() => setActiveTab('transactions')}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsPage onNavigateToDetail={navigateToDetail} />
          )}

          {activeTab === 'create_payment' && (
            <CreatePaymentPage
              onPaymentCreated={handlePaymentCreated}
              onCancel={() => setActiveTab('dashboard')}
            />
          )}

          {activeTab === 'payment_detail' && selectedTxId && (
            <PaymentDetailPage
              transactionId={selectedTxId}
              onBack={() => setActiveTab('transactions')}
            />
          )}

          {activeTab === 'reports' && <ReportsPage />}

          {(activeTab === 'settings' || activeTab === 'users' || activeTab === 'providers' || activeTab === 'api_keys') && user.role !== 'ADMIN' ? (
            <AccessDenied />
          ) : (
            <>
              {activeTab === 'settings' && <SettingsPage />}
              {activeTab === 'users' && <UsersPage />}
              {activeTab === 'providers' && <ProvidersPage />}
              {activeTab === 'api_keys' && <ApiKeysPage />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
