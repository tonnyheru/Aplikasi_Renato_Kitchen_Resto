import React, { useState, useEffect } from 'react';
import { apiRequest, formatIDR, formatDate } from '../../lib/api';
import { StockOpname } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  FileCheck2,
  Plus,
  Eye,
  CheckCircle,
  AlertCircle,
  Save,
  CheckCheck,
} from 'lucide-react';

export const StockOpnamePage: React.FC = () => {
  const { hasRole } = useAuth();
  const [opnames, setOpnames] = useState<StockOpname[]>([]);
  const [selectedOpname, setSelectedOpname] = useState<StockOpname | null>(null);
  const [counts, setCounts] = useState<Record<number, { physical_stock: number; reason: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchOpnames = async () => {
    const res = await apiRequest<StockOpname[]>('/stock-opnames');
    if (res.success && res.data) {
      setOpnames(res.data);
    }
  };

  useEffect(() => {
    fetchOpnames();
  }, []);

  const handleCreateSession = async () => {
    const res = await apiRequest<StockOpname>('/stock-opnames', {
      method: 'POST',
      body: JSON.stringify({ notes: 'Sesi Stock Opname Reguler' }),
    });

    if (res.success && res.data) {
      fetchOpnames();
      openSessionDetails(res.data.id);
    } else {
      alert(res.message || 'Gagal membuat sesi opname.');
    }
  };

  const openSessionDetails = async (id: number) => {
    const res = await apiRequest<StockOpname>(`/stock-opnames/${id}`);
    if (res.success && res.data) {
      setSelectedOpname(res.data);
      // Initialize count inputs
      const initialCounts: Record<number, { physical_stock: number; reason: string }> = {};
      res.data.items?.forEach((item) => {
        initialCounts[item.id] = {
          physical_stock: item.physical_stock,
          reason: item.reason || '',
        };
      });
      setCounts(initialCounts);
    }
  };

  const handleSubmitCounts = async () => {
    if (!selectedOpname) return;
    setIsSubmitting(true);

    const itemsPayload = Object.entries(counts).map(([itemId, val]) => ({
      id: Number(itemId),
      physical_stock: val.physical_stock,
      reason: val.reason,
    }));

    const res = await apiRequest(`/stock-opnames/${selectedOpname.id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ items: itemsPayload }),
    });

    setIsSubmitting(false);
    if (res.success) {
      alert('Hasil penghitungan fisik berhasil dikirim untuk persetujuan.');
      openSessionDetails(selectedOpname.id);
      fetchOpnames();
    } else {
      alert(res.message || 'Gagal menyimpan hasil hitung.');
    }
  };

  const handleApprove = async () => {
    if (!selectedOpname) return;
    if (!confirm('Apakah Anda yakin ingin menyetujui hasil stock opname ini? Stok bahan baku di sistem akan otomatis disesuaikan.')) return;

    setIsSubmitting(true);
    const res = await apiRequest(`/stock-opnames/${selectedOpname.id}/approve`, {
      method: 'POST',
    });

    setIsSubmitting(false);
    if (res.success) {
      alert('Stock Opname berhasil disetujui! Stok telah disinkronkan.');
      openSessionDetails(selectedOpname.id);
      fetchOpnames();
    } else {
      alert(res.message || 'Gagal menyetujui opname.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>
            Stock Opname Fisik & Rekonsiliasi
          </h2>
          <p style={{ fontSize: '0.815rem', color: 'var(--color-neutral-gray)', marginTop: '2px' }}>
            Bandingkan stok fisik riil dengan sistem, telusuri selisih, dan sinkronkan persetujuan
          </p>
        </div>

        <button onClick={handleCreateSession} className="btn-primary" style={{ padding: '9px 18px' }}>
          <Plus size={16} /> Mulai Sesi Opname Baru
        </button>
      </div>

      {/* Opname Sessions Table */}
      <div className="renato-card" style={{ overflow: 'hidden' }}>
        <table className="renato-table">
          <thead>
            <tr>
              <th>No. Sesi Opname</th>
              <th>Tanggal Dibuat</th>
              <th>Petugas Hitung</th>
              <th>Disetujui Oleh</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {opnames.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--color-neutral-gray)' }}>
                  Belum ada sesi stock opname. Klik tombol di atas untuk memulai.
                </td>
              </tr>
            ) : (
              opnames.map((op) => (
                <tr key={op.id}>
                  <td className="font-mono" style={{ fontWeight: 700 }}>
                    {op.opname_number}
                  </td>
                  <td>{formatDate(op.created_at)}</td>
                  <td>{op.creator?.name || 'Staf Gudang'}</td>
                  <td>{op.approver?.name || '-'}</td>
                  <td>
                    {op.status === 'approved' ? (
                      <span className="badge badge-success">Disetujui & Selesai</span>
                    ) : op.status === 'submitted' ? (
                      <span className="badge badge-warning">Menunggu Approval</span>
                    ) : (
                      <span className="badge badge-gold">Draft Penghitungan</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => openSessionDetails(op.id)}
                      className="btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                    >
                      <Eye size={13} /> {op.status === 'draft' ? 'Input Fisik' : 'Lihat Detail'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Sesi Detail & Form Sheet */}
      {selectedOpname && (
        <div className="renato-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>
                Lembar Kerja: {selectedOpname.opname_number}
              </h3>
              <span style={{ fontSize: '0.815rem', color: 'var(--color-neutral-gray)' }}>
                Dibuat: {formatDate(selectedOpname.created_at)} • Status: {selectedOpname.status.toUpperCase()}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {selectedOpname.status === 'draft' && (
                <button
                  onClick={handleSubmitCounts}
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.815rem' }}
                >
                  <Save size={15} /> Kirim Hasil Hitung ke Manager
                </button>
              )}

              {selectedOpname.status === 'submitted' && hasRole(['owner', 'manager']) && (
                <button
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.815rem', backgroundColor: '#2D6A4F' }}
                >
                  <CheckCheck size={16} /> Setujui & Terapkan Penyesuaian Stok
                </button>
              )}

              <button
                onClick={() => setSelectedOpname(null)}
                className="btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.815rem' }}
              >
                Tutup Lembar
              </button>
            </div>
          </div>

          {/* Table Items */}
          <div style={{ overflowX: 'auto' }}>
            <table className="renato-table">
              <thead>
                <tr>
                  <th>Nama Bahan</th>
                  <th>Stok Sistem</th>
                  <th>Hitung Fisik</th>
                  <th>Selisih (Fisik - Sistem)</th>
                  <th>Alasan / Catatan Selisih</th>
                </tr>
              </thead>
              <tbody>
                {selectedOpname.items?.map((item) => {
                  const currentPhys = counts[item.id]?.physical_stock ?? item.physical_stock;
                  const diff = currentPhys - item.system_stock;
                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>
                        {item.ingredient?.name}
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-gray)' }}>
                          Satuan: {item.ingredient?.unit}
                        </div>
                      </td>
                      <td className="font-mono">
                        {item.system_stock} {item.ingredient?.unit}
                      </td>
                      <td>
                        {selectedOpname.status === 'draft' ? (
                          <input
                            type="number"
                            step="any"
                            className="input-field font-mono"
                            style={{ width: '120px', padding: '6px 10px' }}
                            value={counts[item.id]?.physical_stock ?? ''}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setCounts((prev) => ({
                                ...prev,
                                [item.id]: {
                                  ...prev[item.id],
                                  physical_stock: val,
                                },
                              }));
                            }}
                          />
                        ) : (
                          <span className="font-mono" style={{ fontWeight: 700 }}>
                            {item.physical_stock} {item.ingredient?.unit}
                          </span>
                        )}
                      </td>
                      <td className="font-mono">
                        <span
                          style={{
                            fontWeight: 700,
                            color: diff === 0 ? '#2D6A4F' : diff < 0 ? '#B91C1C' : '#B45309',
                          }}
                        >
                          {diff > 0 ? `+${diff}` : diff} {item.ingredient?.unit}
                        </span>
                      </td>
                      <td>
                        {selectedOpname.status === 'draft' ? (
                          <input
                            type="text"
                            className="input-field"
                            placeholder="Alasan selisih..."
                            value={counts[item.id]?.reason || ''}
                            onChange={(e) => {
                              const text = e.target.value;
                              setCounts((prev) => ({
                                ...prev,
                                [item.id]: {
                                  ...prev[item.id],
                                  reason: text,
                                },
                              }));
                            }}
                          />
                        ) : (
                          <span style={{ fontSize: '0.815rem', color: 'var(--color-neutral-gray)' }}>
                            {item.reason || '-'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
