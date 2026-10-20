import React, { useState, useEffect } from 'react';
import { apiRequest, formatIDR, formatDate } from '../../lib/api';
import { Ingredient } from '../../types';
import {
  Boxes,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  History,
  Search,
  X,
  Edit2,
  Trash2,
  CheckCircle,
  Package,
} from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low' | 'safe'>('all');

  // Modal Movement
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementType, setMovementType] = useState<'in' | 'out' | 'waste' | 'adjustment'>('in');
  const [quantity, setQuantity] = useState<number>(0);
  const [reason, setReason] = useState('');

  // Modal History
  const [movementsHistory, setMovementsHistory] = useState<any[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Modal Create / Edit Ingredient
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Ingredient | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Bahan Pokok');
  const [unit, setUnit] = useState('gram');
  const [currentStock, setCurrentStock] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(1000);
  const [costPerUnit, setCostPerUnit] = useState<number>(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchIngredients = async () => {
    let url = '/ingredients?';
    if (search) url += `search=${search}&`;
    const res = await apiRequest<Ingredient[]>(url);
    if (res.success && res.data) {
      setIngredients(res.data);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, [search]);

  const openCreateModal = () => {
    setEditingItem(null);
    setName('');
    setCategory('Bahan Pokok');
    setUnit('gram');
    setCurrentStock(0);
    setMinStock(1000);
    setCostPerUnit(0);
    setFormError(null);
    setIsItemModalOpen(true);
  };

  const openEditModal = (ing: Ingredient) => {
    setEditingItem(ing);
    setName(ing.name);
    setCategory(ing.category);
    setUnit(ing.unit);
    setCurrentStock(ing.current_stock);
    setMinStock(ing.min_stock);
    setCostPerUnit(ing.cost_per_unit);
    setFormError(null);
    setIsItemModalOpen(true);
  };

  const handleSaveIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    if (editingItem) {
      const res = await apiRequest(`/ingredients/${editingItem.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name,
          category,
          unit,
          min_stock: minStock,
          cost_per_unit: costPerUnit,
        }),
      });

      setSubmitting(false);
      if (res.success) {
        setIsItemModalOpen(false);
        fetchIngredients();
      } else {
        setFormError(res.message || 'Gagal memperbarui bahan baku.');
      }
    } else {
      const res = await apiRequest('/ingredients', {
        method: 'POST',
        body: JSON.stringify({
          name,
          category,
          unit,
          current_stock: currentStock,
          min_stock: minStock,
          cost_per_unit: costPerUnit,
        }),
      });

      setSubmitting(false);
      if (res.success) {
        setIsItemModalOpen(false);
        fetchIngredients();
      } else {
        setFormError(res.message || 'Gagal menambahkan bahan baku.');
      }
    }
  };

  const handleDeleteIngredient = async (ing: Ingredient) => {
    if (!confirm(`Hapus bahan baku '${ing.name}' (${ing.sku})?`)) return;

    const res = await apiRequest(`/ingredients/${ing.id}`, {
      method: 'DELETE',
    });

    if (res.success) {
      fetchIngredients();
    } else {
      alert(res.message || 'Gagal menghapus bahan baku.');
    }
  };

  const handleRecordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIngredient || quantity <= 0) return;

    const res = await apiRequest('/inventory/movements', {
      method: 'POST',
      body: JSON.stringify({
        ingredient_id: selectedIngredient.id,
        movement_type: movementType,
        quantity,
        reason,
      }),
    });

    if (res.success) {
      setIsMovementModalOpen(false);
      setQuantity(0);
      setReason('');
      fetchIngredients();
    } else {
      alert(res.message || 'Gagal mencatat mutasi stok.');
    }
  };

  const openHistory = async (ing: Ingredient) => {
    setSelectedIngredient(ing);
    setIsHistoryModalOpen(true);
    const res = await apiRequest<any[]>(`/ingredients/${ing.id}/movements`);
    if (res.success && res.data) {
      setMovementsHistory(res.data);
    }
  };

  const categories = Array.from(new Set(ingredients.map((i) => i.category))).filter(Boolean);

  const filteredIngredients = ingredients.filter((ing) => {
    const matchesCat = categoryFilter ? ing.category === categoryFilter : true;
    const isLow = ing.current_stock <= ing.min_stock;
    const matchesStatus =
      statusFilter === 'low' ? isLow : statusFilter === 'safe' ? !isLow : true;
    return matchesCat && matchesStatus;
  });

  const lowStockCount = ingredients.filter((i) => i.current_stock <= i.min_stock).length;
  const totalInventoryValue = ingredients.reduce(
    (sum, i) => sum + i.current_stock * i.cost_per_unit,
    0
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>
            Manajemen Inventaris & Bahan Baku Dapur
          </h2>
          <p style={{ fontSize: '0.815rem', color: 'var(--color-neutral-gray)', marginTop: '2px' }}>
            Pantau stok real-time, batas minimum, HPP bahan baku, dan riwayat mutasi otomatis
          </p>
        </div>

        <button onClick={openCreateModal} className="btn-primary" style={{ padding: '9px 18px' }}>
          <Plus size={16} /> Tambah Bahan Baku Baru
        </button>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div className="renato-card" style={{ padding: '16px', borderLeft: '4px solid #2D6A4F' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-neutral-gray)' }}>
            Total Jenis Bahan Baku
          </span>
          <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px' }}>
            {ingredients.length} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#8A8A83' }}>item</span>
          </div>
        </div>

        <div className="renato-card" style={{ padding: '16px', borderLeft: '4px solid #B91C1C' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#B91C1C' }}>
            Stok Di Bawah Batas Minimum
          </span>
          <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#B91C1C', marginTop: '4px' }}>
            {lowStockCount} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#8A8A83' }}>perlu re-order</span>
          </div>
        </div>

        <div className="renato-card" style={{ padding: '16px', borderLeft: '4px solid #C5A46D' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-neutral-gray)' }}>
            Estimasi Nilai Total Aset Stok
          </span>
          <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#8C6D37', marginTop: '4px' }}>
            {formatIDR(totalInventoryValue)}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="renato-card" style={{ padding: '16px 20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8A8A83' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Cari nama bahan baku atau SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '38px' }}
          />
        </div>

        <select
          className="input-field"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ width: '180px' }}
        >
          <option value="">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          className="input-field"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          style={{ width: '180px' }}
        >
          <option value="all">Semua Status Stok</option>
          <option value="low">⚠️ Menipis (Di Bawah Min)</option>
          <option value="safe">✅ Stok Aman</option>
        </select>
      </div>

      {/* Ingredients Table */}
      <div className="renato-card" style={{ overflow: 'hidden' }}>
        <table className="renato-table">
          <thead>
            <tr>
              <th>Nama Bahan Baku</th>
              <th>Kategori</th>
              <th>Stok Saat Ini</th>
              <th>Batas Minimum</th>
              <th>Biaya Pokok (HPP)</th>
              <th>Total Nilai Stok</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredIngredients.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--color-neutral-gray)' }}>
                  Tidak ada bahan baku yang cocok dengan pencarian.
                </td>
              </tr>
            ) : (
              filteredIngredients.map((ing) => {
                const isLow = ing.current_stock <= ing.min_stock;
                const valueOfStock = ing.current_stock * ing.cost_per_unit;

                return (
                  <tr key={ing.id}>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{ing.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-gray)' }}>SKU: {ing.sku}</div>
                    </td>
                    <td>
                      <span className="badge badge-gold">{ing.category}</span>
                    </td>
                    <td className="font-mono" style={{ fontWeight: 700, fontSize: '0.95rem', color: isLow ? '#B91C1C' : 'var(--color-charcoal)' }}>
                      {ing.current_stock.toLocaleString('id-ID')} {ing.unit}
                    </td>
                    <td className="font-mono text-muted">
                      {ing.min_stock.toLocaleString('id-ID')} {ing.unit}
                    </td>
                    <td className="font-mono">
                      {formatIDR(ing.cost_per_unit)} / {ing.unit}
                    </td>
                    <td className="font-mono" style={{ fontWeight: 600 }}>
                      {formatIDR(valueOfStock)}
                    </td>
                    <td>
                      {isLow ? (
                        <span className="badge badge-error">
                          <AlertTriangle size={12} /> Menipis
                        </span>
                      ) : (
                        <span className="badge badge-success">
                          <CheckCircle size={12} /> Aman
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => {
                            setSelectedIngredient(ing);
                            setIsMovementModalOpen(true);
                          }}
                          className="btn-primary"
                          title="Mutasi Stok"
                          style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                        >
                          <Plus size={13} /> Mutasi
                        </button>
                        <button
                          onClick={() => openHistory(ing)}
                          className="btn-secondary"
                          title="Riwayat Mutasi"
                          style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                        >
                          <History size={13} /> Riwayat
                        </button>
                        <button
                          onClick={() => openEditModal(ing)}
                          className="btn-secondary"
                          title="Edit Bahan"
                          style={{ padding: '6px 8px' }}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteIngredient(ing)}
                          className="btn-secondary"
                          title="Hapus Bahan"
                          style={{ padding: '6px 8px', color: '#B91C1C' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Add / Edit Ingredient */}
      {isItemModalOpen && (
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
          <div className="renato-card" style={{ width: '100%', maxWidth: '480px', padding: '26px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>
                {editingItem ? `Edit Bahan Baku: ${editingItem.name}` : 'Tambah Bahan Baku Baru'}
              </h3>
              <button onClick={() => setIsItemModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
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

            <form onSubmit={handleSaveIngredient} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                  Nama Bahan Baku
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Cth: Daging Ayam Fillet, Beras Pandan Wangi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                    Kategori Bahan
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Bahan Pokok, Daging, Sayur..."
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                    Satuan Takaran
                  </label>
                  <select className="input-field" value={unit} onChange={(e) => setUnit(e.target.value)}>
                    <option value="gram">gram (g)</option>
                    <option value="ml">mililiter (ml)</option>
                    <option value="pcs">buah / butir (pcs)</option>
                    <option value="kg">kilogram (kg)</option>
                    <option value="liter">liter (L)</option>
                    <option value="porsi">porsi</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {!editingItem && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                      Stok Awal ({unit})
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className="input-field font-mono"
                      value={currentStock}
                      onChange={(e) => setCurrentStock(Number(e.target.value))}
                      required
                    />
                  </div>
                )}

                <div style={{ gridColumn: editingItem ? 'span 2' : 'span 1' }}>
                  <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                    Batas Minimum Stok ({unit})
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    className="input-field font-mono"
                    value={minStock}
                    onChange={(e) => setMinStock(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                  Biaya Pokok per {unit} (Rp)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  className="input-field font-mono"
                  placeholder="Cth: 50 untuk Rp 50/gram (Rp 50.000/kg)"
                  value={costPerUnit}
                  onChange={(e) => setCostPerUnit(Number(e.target.value))}
                  required
                />
                <span style={{ fontSize: '0.725rem', color: 'var(--color-neutral-gray)', marginTop: '4px', display: 'block' }}>
                  Digunakan untuk otomatisasi perhitungan HPP menu masakan di dapur.
                </span>
              </div>

              <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
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
                  {submitting ? 'Menyimpan...' : editingItem ? 'Simpan Perubahan' : 'Buat Bahan Baku'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Stock Movement Modal */}
      {isMovementModalOpen && selectedIngredient && (
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
          <div className="renato-card" style={{ width: '100%', maxWidth: '440px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>Pencatatan Mutasi Stok</h3>
                <span style={{ fontSize: '0.815rem', color: 'var(--color-neutral-gray)' }}>
                  {selectedIngredient.name} ({selectedIngredient.unit})
                </span>
              </div>
              <button onClick={() => setIsMovementModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRecordMovement} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                  Jenis Mutasi
                </label>
                <select
                  className="input-field"
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value as any)}
                >
                  <option value="in">Stok Masuk (Penerimaan / Pembelian)</option>
                  <option value="out">Stok Keluar Manual</option>
                  <option value="waste">Barang Rusak / Basi (Food Waste)</option>
                  <option value="adjustment">Penyesuaian Langsung</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                  Jumlah ({selectedIngredient.unit})
                </label>
                <input
                  type="number"
                  step="any"
                  className="input-field font-mono"
                  value={quantity || ''}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  required
                  placeholder="0"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                  Alasan / Keterangan
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  placeholder="Cth: Belanja pasar pagi, kemasan bocor"
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '11px', marginTop: '6px' }}>
                Simpan Mutasi Stok
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Movement History Drawer */}
      {isHistoryModalOpen && selectedIngredient && (
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
          <div className="renato-card" style={{ width: '100%', maxWidth: '540px', padding: '24px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>Riwayat Mutasi Stok</h3>
                <span style={{ fontSize: '0.815rem', color: 'var(--color-neutral-gray)' }}>{selectedIngredient.name}</span>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                Tutup
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {movementsHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-neutral-gray)', fontSize: '0.875rem' }}>
                  Belum ada catatan mutasi untuk bahan ini.
                </div>
              ) : (
                movementsHistory.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-warm-cream)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.815rem', fontWeight: 700 }}>{m.reason}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-gray)' }}>
                        {formatDate(m.created_at)} • Petugas: {m.user?.name || 'Sistem'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span
                        className="font-mono"
                        style={{
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          color: m.movement_type === 'in' ? '#2D6A4F' : '#B91C1C',
                        }}
                      >
                        {m.movement_type === 'in' ? '+' : '-'}
                        {m.quantity} {selectedIngredient.unit}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
