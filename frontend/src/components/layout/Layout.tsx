import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Ringkasan Eksekutif & Operasional',
  '/pos': 'Point of Sale (Kasir)',
  '/orders': 'Daftar & Riwayat Seluruh Pesanan',
  '/kitchen': 'Kitchen Display System (KDS)',
  '/tables': 'Denah & Status Meja Restoran',
  '/menu': 'Katalog Menu & Resep Bahan Baku',
  '/inventory': 'Manajemen Stok & Bahan Baku',
  '/stock-opname': 'Stock Opname Fisik & Rekonsiliasi',
  '/expenses': 'Catatan Pengeluaran Operasional',
  '/reports': 'Laporan Bisnis & Analisis Finansial',
  '/settings': 'Pengaturan & Konfigurasi Restoran',
};

export const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const title = PAGE_TITLES[location.pathname] || 'Renato Kitchen / Resto';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-warm-cream)' }}>
      {/* Sidebar Navigation */}
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
        <Header title={title} />
        <main style={{ flex: 1, padding: '24px 28px', maxWidth: '1600px', width: '100%', margin: '0 auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
