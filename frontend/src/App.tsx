import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { POSPage } from './pages/pos/POSPage';
import { OrdersListPage } from './pages/orders/OrdersListPage';
import { KitchenDisplayPage } from './pages/kitchen/KitchenDisplayPage';
import { TableManagementPage } from './pages/tables/TableManagementPage';
import { MenuListPage } from './pages/menu/MenuListPage';
import { InventoryPage } from './pages/inventory/InventoryPage';
import { StockOpnamePage } from './pages/stock-opname/StockOpnamePage';
import { ExpensesPage } from './pages/expenses/ExpensesPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { RestaurantSettingsPage } from './pages/settings/RestaurantSettingsPage';
import { UsersManagementPage } from './pages/users/UsersManagementPage';
import { PurchaseOrdersPage } from './pages/purchase-orders/PurchaseOrdersPage';
import { PublicOnlineOrderingPage } from './pages/customer/PublicOnlineOrderingPage';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--color-warm-cream)',
          color: 'var(--color-neutral-gray)',
          fontFamily: 'var(--font-family)',
        }}
      >
        Memuat aplikasi Renato Kitchen...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Guest / Online Ordering */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/order-online" element={<PublicOnlineOrderingPage />} />

          {/* Protected Internal Management System */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="pos" element={<POSPage />} />
            <Route path="orders" element={<OrdersListPage />} />
            <Route path="kitchen" element={<KitchenDisplayPage />} />
            <Route path="tables" element={<TableManagementPage />} />
            <Route path="menu" element={<MenuListPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="stock-opname" element={<StockOpnamePage />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
            <Route path="users" element={<UsersManagementPage />} />
            <Route path="settings" element={<RestaurantSettingsPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
