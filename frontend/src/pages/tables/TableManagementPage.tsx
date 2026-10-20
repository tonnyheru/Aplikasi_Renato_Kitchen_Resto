import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api';
import { DiningTable } from '../../types';
import {
  LayoutGrid,
  Users,
  Check,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertCircle,
} from 'lucide-react';

export const TableManagementPage: React.FC = () => {
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<DiningTable | null>(null);
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState<number>(4);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchTables = async () => {
    setLoading(true);
    const res = await apiRequest<DiningTable[]>('/tables');
    if (res.success && res.data) {
      setTables(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const openCreateModal = () => {
    setEditingTable(null);
    setTableNumber('');
    setCapacity(4);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (t: DiningTable) => {
    setEditingTable(t);
    setTableNumber(t.table_number);
    setCapacity(t.capacity);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveTable = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    if (editingTable) {
      const res = await apiRequest(`/tables/${editingTable.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          table_number: tableNumber,
          capacity,
        }),
      });

      setSubmitting(false);
      if (res.success) {
        setIsModalOpen(false);
        fetchTables();
      } else {
        setFormError(res.message || 'Gagal memperbarui meja.');
      }
    } else {
      const res = await apiRequest('/tables', {
        method: 'POST',
        body: JSON.stringify({
          table_number: tableNumber,
          capacity,
        }),
      });

      setSubmitting(false);
      if (res.success) {
        setIsModalOpen(false);
        fetchTables();
      } else {
        setFormError(res.message || 'Gagal menambahkan meja.');
      }
    }
  };

  const handleDeleteTable = async (t: DiningTable) => {
    if (t.status === 'occupied') {
      alert('Tidak dapat menghapus meja yang sedang ditempati tamu!');
      return;
    }

    if (!confirm(`Hapus meja ${t.table_number}?`)) return;

    const res = await apiRequest(`/tables/${t.id}`, {
      method: 'DELETE',
    });

    if (res.success) {
      fetchTables();
    } else {
      alert(res.message || 'Gagal menghapus meja.');
    }
  };

  const handleUpdateStatus = async (tableId: number, status: string) => {
    const res = await apiRequest(`/tables/${tableId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    if (res.success) {
      fetchTables();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return { bg: '#EAF5ED', border: '#B8DEC6', text: '#2D6A4F', label: 'Tersedia' };
      case 'occupied':
        return { bg: '#FEF7EA', border: '#F6D8A8', text: '#B45309', label: 'Terisi' };
      case 'reserved':
        return { bg: '#EEF4FF', border: '#C7D9FE', text: '#1E40AF', label: 'Reservasi' };
      case 'cleaning':
        return { bg: '#FDF2F2', border: '#F8B4B4', text: '#B91C1C', label: 'Dibersihkan' };
      default:
        return { bg: '#F7F4ED', border: '#E5E0D4', text: '#8A8A83', label: status };
    }
  };

  const availableCount = tables.filter((t) => t.status === 'available').length;
  const occupiedCount = tables.filter((t) => t.status === 'occupied').length;
  const reservedCount = tables.filter((t) => t.status === 'reserved').length;
  const cleaningCount = tables.filter((t) => t.status === 'cleaning').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>
            Denah & Manajemen Meja Restoran
          </h2>
          <p style={{ fontSize: '0.815rem', color: 'var(--color-neutral-gray)', marginTop: '2px' }}>
            Pantau okupansi meja, atur kapasitas kursi, dan ubah status operasional
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={fetchTables} className="btn-secondary" style={{ padding: '7px 14px', fontSize: '0.815rem' }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={openCreateModal} className="btn-primary" style={{ padding: '7px 14px', fontSize: '0.815rem' }}>
            <Plus size={14} /> Tambah Meja Baru
          </button>
        </div>
      </div>

      {/* Summary Status Badges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
        <div className="renato-card" style={{ padding: '14px 18px', borderLeft: '4px solid #2D6A4F' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2D6A4F' }}>Tersedia (Kosong)</span>
          <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '2px' }}>
            {availableCount} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#8A8A83' }}>meja</span>
          </div>
        </div>
        <div className="renato-card" style={{ padding: '14px 18px', borderLeft: '4px solid #B45309' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#B45309' }}>Terisi Tamu</span>
          <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '2px' }}>
            {occupiedCount} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#8A8A83' }}>meja</span>
          </div>
        </div>
        <div className="renato-card" style={{ padding: '14px 18px', borderLeft: '4px solid #1E40AF' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1E40AF' }}>Reservasi</span>
          <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '2px' }}>
            {reservedCount} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#8A8A83' }}>meja</span>
          </div>
        </div>
        <div className="renato-card" style={{ padding: '14px 18px', borderLeft: '4px solid #B91C1C' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#B91C1C' }}>Dibersihkan</span>
          <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '2px' }}>
            {cleaningCount} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#8A8A83' }}>meja</span>
          </div>
        </div>
      </div>

      {/* Grid of Tables */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '18px',
        }}
      >
        {tables.map((table) => {
          const badgeStyle = getStatusColor(table.status);
          return (
            <div
              key={table.id}
              className="renato-card"
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderTop: `4px solid ${badgeStyle.text}`,
                minHeight: '190px',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-charcoal)' }}>
                    {table.table_number}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: badgeStyle.bg,
                        color: badgeStyle.text,
                        border: `1px solid ${badgeStyle.border}`,
                      }}
                    >
                      {badgeStyle.label}
                    </span>
                    <button
                      onClick={() => openEditModal(table)}
                      className="btn-secondary"
                      title="Edit Meja"
                      style={{ padding: '4px 6px' }}
                    >
                      <Edit2 size={12} />
                    </button>
                    {table.status !== 'occupied' && (
                      <button
                        onClick={() => handleDeleteTable(table)}
                        className="btn-secondary"
                        title="Hapus Meja"
                        style={{ padding: '4px 6px', color: '#B91C1C' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.815rem', color: 'var(--color-neutral-gray)', marginTop: '8px' }}>
                  <Users size={14} />
                  <span>Kapasitas: {table.capacity} Orang</span>
                </div>
              </div>

              {/* Status Action Buttons */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '16px', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                <button
                  onClick={() => handleUpdateStatus(table.id, 'available')}
                  style={{
                    flex: 1,
                    padding: '6px',
                    borderRadius: '6px',
                    fontSize: '0.725rem',
                    fontWeight: 600,
                    border: '1px solid #B8DEC6',
                    backgroundColor: table.status === 'available' ? '#2D6A4F' : '#FFFFFF',
                    color: table.status === 'available' ? '#FFFFFF' : '#2D6A4F',
                    cursor: 'pointer',
                  }}
                >
                  Kosong
                </button>
                <button
                  onClick={() => handleUpdateStatus(table.id, 'occupied')}
                  style={{
                    flex: 1,
                    padding: '6px',
                    borderRadius: '6px',
                    fontSize: '0.725rem',
                    fontWeight: 600,
                    border: '1px solid #F6D8A8',
                    backgroundColor: table.status === 'occupied' ? '#B45309' : '#FFFFFF',
                    color: table.status === 'occupied' ? '#FFFFFF' : '#B45309',
                    cursor: 'pointer',
                  }}
                >
                  Terisi
                </button>
                <button
                  onClick={() => handleUpdateStatus(table.id, 'reserved')}
                  style={{
                    flex: 1,
                    padding: '6px',
                    borderRadius: '6px',
                    fontSize: '0.725rem',
                    fontWeight: 600,
                    border: '1px solid #C7D9FE',
                    backgroundColor: table.status === 'reserved' ? '#1E40AF' : '#FFFFFF',
                    color: table.status === 'reserved' ? '#FFFFFF' : '#1E40AF',
                    cursor: 'pointer',
                  }}
                >
                  Reservasi
                </button>
                <button
                  onClick={() => handleUpdateStatus(table.id, 'cleaning')}
                  style={{
                    flex: 1,
                    padding: '6px',
                    borderRadius: '6px',
                    fontSize: '0.725rem',
                    fontWeight: 600,
                    border: '1px solid #F8B4B4',
                    backgroundColor: table.status === 'cleaning' ? '#B91C1C' : '#FFFFFF',
                    color: table.status === 'cleaning' ? '#FFFFFF' : '#B91C1C',
                    cursor: 'pointer',
                  }}
                >
                  Bersihkan
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit Table */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div className="renato-card" style={{ width: '100%', maxWidth: '420px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>
                {editingTable ? `Edit Meja ${editingTable.table_number}` : 'Tambah Meja Makan Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--status-error-bg)',
                  color: 'var(--status-error-text)',
                  fontSize: '0.815rem',
                  marginBottom: '16px',
                }}
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveTable} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                  Nomor / Label Meja
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Cth: T-11, VIP-01, Outdoor-02"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                  Kapasitas Kursi (Orang)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className="input-field font-mono"
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '10px' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                  style={{ flex: 2, padding: '10px' }}
                >
                  {submitting ? 'Menyimpan...' : editingTable ? 'Simpan Meja' : 'Buat Meja'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
