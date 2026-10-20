import React, { useState, useEffect } from 'react';
import { apiRequest, formatIDR } from '../../lib/api';
import { DashboardMetrics } from '../../types';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Wallet,
  Receipt,
  CreditCard,
  QrCode,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [period, setPeriod] = useState<'today' | '7days' | 'month'>('month');
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      setLoading(true);
      const res = await apiRequest<DashboardMetrics>(`/reports/dashboard?period=${period}`);
      if (res.success && res.data) {
        setData(res.data);
      }
      setLoading(false);
    }

    loadReport();
  }, [period]);

  const exportCSV = () => {
    if (!data) return;
    const rows = [
      ['Metrik', 'Nilai'],
      ['Omzet Penjualan', data.metrics.revenue],
      ['HPP Bahan Baku (COGS)', data.metrics.cogs],
      ['Laba Kotor (Gross Profit)', data.metrics.gross_profit],
      ['Pengeluaran Operasional', data.metrics.expenses],
      ['Estimasi Laba Bersih', data.metrics.gross_profit - data.metrics.expenses],
      ['Jumlah Transaksi Berhasil', data.metrics.transaction_count],
      ['Rata-rata Nilai Transaksi', data.metrics.average_order_value],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `laporan_keuangan_renato_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const netProfit = (data?.metrics?.gross_profit || 0) - (data?.metrics?.expenses || 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header & Export Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>
            Laporan Bisnis & Analisis Finansial
          </h2>
          <p style={{ fontSize: '0.815rem', color: 'var(--color-neutral-gray)', marginTop: '2px' }}>
            Rekapitulasi Omzet, HPP (Biaya Pokok Bahan), dan Estimasi Laba Bersih
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {/* Period selector */}
          <div style={{ display: 'flex', backgroundColor: 'var(--color-white)', padding: '4px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            {(['today', '7days', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.815rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: period === p ? 'var(--color-forest-green)' : 'transparent',
                  color: period === p ? '#FFFFFF' : 'var(--color-charcoal)',
                }}
              >
                {p === 'today' ? 'Hari Ini' : p === '7days' ? '7 Hari Terakhir' : 'Bulan Ini'}
              </button>
            ))}
          </div>

          <button onClick={exportCSV} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.815rem' }}>
            <Download size={14} /> Ekspor CSV
          </button>
        </div>
      </div>

      {/* Financial Statement Card */}
      <div className="renato-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '18px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
          Ikhtisar Laba Rugi Operasional ({period === 'today' ? 'Hari Ini' : period === '7days' ? '7 Hari Terakhir' : 'Bulan Ini'})
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 600 }}>
            <span>Pendapatan / Omzet Penjualan Bersih:</span>
            <span className="font-mono" style={{ color: 'var(--color-forest-green)', fontWeight: 700 }}>
              {loading ? '...' : formatIDR(data?.metrics?.revenue || 0)}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.925rem', color: 'var(--color-neutral-gray)', paddingLeft: '16px' }}>
            <span>Dikurangi Harga Pokok Penjualan (HPP Resep Bahan):</span>
            <span className="font-mono">
              ({loading ? '...' : formatIDR(data?.metrics?.cogs || 0)})
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '1.05rem',
              fontWeight: 700,
              padding: '10px 14px',
              backgroundColor: 'var(--color-muted-gold-light)',
              borderRadius: '8px',
              color: '#8C6D37',
            }}
          >
            <span>Laba Kotor (Gross Profit):</span>
            <span className="font-mono">{loading ? '...' : formatIDR(data?.metrics?.gross_profit || 0)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.925rem', color: '#B91C1C', paddingLeft: '16px' }}>
            <span>Dikurangi Biaya Operasional (Listrik, Gas, Kemasan):</span>
            <span className="font-mono">
              ({loading ? '...' : formatIDR(data?.metrics?.expenses || 0)})
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '1.25rem',
              fontWeight: 800,
              padding: '14px 16px',
              backgroundColor: netProfit >= 0 ? 'var(--status-success-bg)' : '#FDF2F2',
              borderRadius: '8px',
              color: netProfit >= 0 ? '#2D6A4F' : '#B91C1C',
              marginTop: '8px',
            }}
          >
            <span>Estimasi Laba Bersih Operasional:</span>
            <span className="font-mono">{loading ? '...' : formatIDR(netProfit)}</span>
          </div>
        </div>
      </div>

      {/* Payment Method Distribution */}
      <div className="renato-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>
          Distribusi Metode Pembayaran
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {data?.payment_breakdown?.map((pb, idx) => (
            <div
              key={idx}
              style={{
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-warm-cream)',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-forest-green)',
                }}
              >
                {pb.payment_method === 'cash' ? <CreditCard size={22} /> : <QrCode size={22} />}
              </div>
              <div>
                <div style={{ fontSize: '0.815rem', color: 'var(--color-neutral-gray)', textTransform: 'uppercase', fontWeight: 600 }}>
                  {pb.payment_method === 'cash' ? 'Tunai (Cash)' : 'QRIS Instant'}
                </div>
                <div className="font-mono" style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                  {formatIDR(pb.total)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-gray)' }}>
                  {pb.count} transaksi
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
