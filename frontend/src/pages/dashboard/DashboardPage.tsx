import React, { useEffect, useState } from 'react';
import { apiRequest, formatIDR } from '../../lib/api';
import { DashboardMetrics } from '../../types';
import {
  TrendingUp,
  Receipt,
  ShoppingBag,
  AlertTriangle,
  CreditCard,
  Flame,
  ArrowUpRight,
  Calendar,
  Wallet,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [period, setPeriod] = useState<'today' | 'yesterday' | '7days' | 'month'>('today');
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      setLoading(true);
      const res = await apiRequest<DashboardMetrics>(`/reports/dashboard?period=${period}`);
      if (res.success && res.data) {
        setData(res.data);
      }
      setLoading(false);
    }

    fetchDashboard();
  }, [period]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>
            Performa Bisnis & Operasional
          </h2>
          <p style={{ fontSize: '0.815rem', color: 'var(--color-neutral-gray)', marginTop: '2px' }}>
            Data langsung terhitung dari database operasional Renato Kitchen
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: 'var(--color-white)',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid var(--color-border)',
          }}
        >
          <Calendar size={15} style={{ margin: '0 6px', color: 'var(--color-neutral-gray)' }} />
          {(
            [
              { id: 'today', label: 'Hari Ini' },
              { id: 'yesterday', label: 'Kemarin' },
              { id: '7days', label: '7 Hari' },
              { id: 'month', label: 'Bulan Ini' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setPeriod(t.id)}
              style={{
                padding: '6px 14px',
                fontSize: '0.815rem',
                fontWeight: 600,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: period === t.id ? 'var(--color-forest-green)' : 'transparent',
                color: period === t.id ? '#FFFFFF' : 'var(--color-charcoal)',
                transition: 'all 0.15s ease',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Omzet Penjualan */}
        <div className="renato-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.815rem', fontWeight: 600, color: 'var(--color-neutral-gray)' }}>
              Omzet Penjualan
            </span>
            <div
              style={{
                padding: '8px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-forest-light)',
                color: 'var(--color-forest-green)',
              }}
            >
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>
              {loading ? '...' : formatIDR(data?.metrics?.revenue || 0)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-gray)', marginTop: '4px' }}>
              {loading ? '...' : `${data?.metrics?.transaction_count || 0} transaksi berhasil`}
            </div>
          </div>
        </div>

        {/* Estimasi Laba Kotor */}
        <div className="renato-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.815rem', fontWeight: 600, color: 'var(--color-neutral-gray)' }}>
              Estimasi Laba Kotor
            </span>
            <div
              style={{
                padding: '8px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-muted-gold-light)',
                color: '#8C6D37',
              }}
            >
              <Wallet size={18} />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#8C6D37' }}>
              {loading ? '...' : formatIDR(data?.metrics?.gross_profit || 0)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-gray)', marginTop: '4px' }}>
              HPP bahan baku: {loading ? '...' : formatIDR(data?.metrics?.cogs || 0)}
            </div>
          </div>
        </div>

        {/* Pengeluaran Operasional */}
        <div className="renato-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.815rem', fontWeight: 600, color: 'var(--color-neutral-gray)' }}>
              Pengeluaran
            </span>
            <div
              style={{
                padding: '8px',
                borderRadius: '8px',
                backgroundColor: '#FDF2F2',
                color: '#B91C1C',
              }}
            >
              <Receipt size={18} />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>
              {loading ? '...' : formatIDR(data?.metrics?.expenses || 0)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-gray)', marginTop: '4px' }}>
              Listrik, gas, kemasan, kebersihan
            </div>
          </div>
        </div>

        {/* Pesanan Dapur Aktif */}
        <div className="renato-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.815rem', fontWeight: 600, color: 'var(--color-neutral-gray)' }}>
              Antrian Dapur (KDS)
            </span>
            <div
              style={{
                padding: '8px',
                borderRadius: '8px',
                backgroundColor: '#FEF7EA',
                color: '#B45309',
              }}
            >
              <Flame size={18} />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>
              {loading ? '...' : data?.metrics?.active_kitchen_orders || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-gray)', marginTop: '4px' }}>
              Sedang diproses & siap saji
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Detail Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        {/* Top Products */}
        <div className="renato-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>
              Produk Terlaris
            </h3>
            <span className="badge badge-gold">Top 5 Menu</span>
          </div>

          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-neutral-gray)' }}>
              Memuat data...
            </div>
          ) : !data?.top_products?.length ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-neutral-gray)', fontSize: '0.875rem' }}>
              Belum ada penjualan dalam periode ini.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.top_products.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-warm-cream)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        backgroundColor: idx === 0 ? '#344C3D' : '#8A8A83',
                        color: '#FFFFFF',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {idx + 1}
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{item.product_name}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-forest-green)' }}>
                      {item.total_qty} porsi
                    </div>
                    <div className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--color-neutral-gray)' }}>
                      {formatIDR(item.total_sales)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Warning */}
        <div className="renato-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>
              Peringatan Stok Menipis
            </h3>
            <span className="badge badge-warning">
              <AlertTriangle size={12} /> Perlu Pembelian
            </span>
          </div>

          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-neutral-gray)' }}>
              Memuat data...
            </div>
          ) : !data?.low_stock_items?.length ? (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                backgroundColor: 'var(--status-success-bg)',
                color: 'var(--status-success-text)',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              ✓ Semua stok bahan baku berada pada tingkat aman.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.low_stock_items.map((ing) => (
                <div
                  key={ing.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #F6D8A8',
                    backgroundColor: '#FFFDF9',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{ing.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-gray)' }}>
                      SKU: {ing.sku} • Min: {ing.min_stock} {ing.unit}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-error">
                      Sisa: {ing.current_stock} {ing.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
