import React, { useState, useEffect } from 'react';
import { apiRequest, formatIDR, formatDate } from '../../lib/api';
import { PurchaseOrder, Supplier, Ingredient } from '../../types';
import {
  Truck,
  Plus,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Edit2,
  X,
  Package,
  Layers,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  ArrowDownLeft,
} from 'lucide-react';

interface POItemForm {
  ingredient_id: number;
  quantity: number;
  unit_cost: number;
}

export const PurchaseOrdersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'suppliers'>('orders');

  // Purchase Orders State
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // Suppliers & Ingredients State
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  // Create PO Modal
  const [isCreatePOOpen, setIsCreatePOOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | ''>('');
  const [poItems, setPoItems] = useState<POItemForm[]>([]);
  const [poFormError, setPoFormError] = useState<string | null>(null);
  const [submittingPO, setSubmittingPO] = useState(false);

  // Supplier Create / Edit Modal
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supName, setSupName] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supAddress, setSupAddress] = useState('');
  const [supError, setSupError] = useState<string | null>(null);
  const [submittingSup, setSubmittingSup] = useState(false);

  const fetchData = async () => {
    let poUrl = '/purchase-orders?';
    if (statusFilter) poUrl += `status=${statusFilter}&`;
    if (search) poUrl += `search=${search}&`;

    const [poRes, supRes, ingRes] = await Promise.all([
      apiRequest<PurchaseOrder[]>(poUrl),
      apiRequest<Supplier[]>('/suppliers'),
      apiRequest<Ingredient[]>('/ingredients'),
    ]);

    if (poRes.success && poRes.data) setPurchaseOrders(poRes.data);
    if (supRes.success && supRes.data) setSuppliers(supRes.data);
    if (ingRes.success && ingRes.data) setIngredients(ingRes.data);
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, search]);

  // Open Create PO Modal
  const openCreatePOModal = () => {
    if (suppliers.length === 0) {
      alert('Tambahkan minimal satu pemasok (supplier) terlebih dahulu.');
      return;
    }
    if (ingredients.length === 0) {
      alert('Tambahkan bahan baku di menu Inventaris terlebih dahulu.');
      return;
    }

    setSelectedSupplierId(suppliers[0].id);
    const firstIng = ingredients[0];
    setPoItems([{ ingredient_id: firstIng.id, quantity: 1000, unit_cost: firstIng.cost_per_unit }]);
    setPoFormError(null);
    setIsCreatePOOpen(true);
  };

  // Add Item to PO Form
  const addPoItemRow = () => {
    const firstIng = ingredients[0];
    setPoItems([...poItems, { ingredient_id: firstIng.id, quantity: 1000, unit_cost: firstIng.cost_per_unit }]);
  };

  const removePoItemRow = (idx: number) => {
    setPoItems(poItems.filter((_, i) => i !== idx));
  };

  const updatePoItemRow = (idx: number, field: keyof POItemForm, val: any) => {
    const updated = [...poItems];
    if (field === 'ingredient_id') {
      const ing = ingredients.find((i) => i.id === val);
      updated[idx] = {
        ...updated[idx],
        ingredient_id: val,
        unit_cost: ing ? ing.cost_per_unit : updated[idx].unit_cost,
      };
    } else {
      updated[idx] = { ...updated[idx], [field]: val };
    }
    setPoItems(updated);
  };

  const calculatedTotalCost = poItems.reduce((sum, item) => sum + item.quantity * item.unit_cost, 0);

  // Submit Create PO
  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    setPoFormError(null);
    if (!selectedSupplierId) {
      setPoFormError('Pilih supplier.');
      return;
    }
    if (poItems.length === 0) {
      setPoFormError('Tambahkan minimal 1 item bahan baku.');
      return;
    }

    setSubmittingPO(true);
    const res = await apiRequest('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify({
        supplier_id: selectedSupplierId,
        items: poItems,
      }),
    });

    setSubmittingPO(false);
    if (res.success) {
      setIsCreatePOOpen(false);
      fetchData();
    } else {
      setPoFormError(res.message || 'Gagal membuat Purchase Order.');
    }
  };

  // Receive PO in Warehouse
  const handleReceivePO = async (poId: number) => {
    if (!confirm('Konfirmasi penerimaan barang dari supplier ini? Stok bahan baku di gudang akan otomatis bertambah secara real-time.')) return;

    const res = await apiRequest(`/purchase-orders/${poId}/receive`, {
      method: 'POST',
    });

    if (res.success) {
      alert(res.message || 'Barang berhasil diterima dan stok telah bertambah!');
      setSelectedPO(null);
      fetchData();
    } else {
      alert(res.message || 'Gagal menerima pesanan.');
    }
  };

  // Cancel PO
  const handleCancelPO = async (poId: number) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan Purchase Order ini?')) return;

    const res = await apiRequest(`/purchase-orders/${poId}/cancel`, {
      method: 'POST',
    });

    if (res.success) {
      setSelectedPO(null);
      fetchData();
    } else {
      alert(res.message || 'Gagal membatalkan PO.');
    }
  };

  // Supplier CRUD
  const openCreateSupplier = () => {
    setEditingSupplier(null);
    setSupName('');
    setSupContact('');
    setSupPhone('');
    setSupEmail('');
    setSupAddress('');
    setSupError(null);
    setIsSupplierModalOpen(true);
  };

  const openEditSupplier = (s: Supplier) => {
    setEditingSupplier(s);
    setSupName(s.name);
    setSupContact(s.contact_person || '');
    setSupPhone(s.phone || '');
    setSupEmail(s.email || '');
    setSupAddress(s.address || '');
    setSupError(null);
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupError(null);
    setSubmittingSup(true);

    const payload = {
      name: supName,
      contact_person: supContact,
      phone: supPhone,
      email: supEmail,
      address: supAddress,
    };

    if (editingSupplier) {
      const res = await apiRequest(`/suppliers/${editingSupplier.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      setSubmittingSup(false);
      if (res.success) {
        setIsSupplierModalOpen(false);
        fetchData();
      } else {
        setSupError(res.message || 'Gagal memperbarui supplier.');
      }
    } else {
      const res = await apiRequest('/suppliers', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setSubmittingSup(false);
      if (res.success) {
        setIsSupplierModalOpen(false);
        fetchData();
      } else {
        setSupError(res.message || 'Gagal menambahkan supplier.');
      }
    }
  };

  const handleDeleteSupplier = async (s: Supplier) => {
    if (!confirm(`Hapus pemasok '${s.name}'?`)) return;

    const res = await apiRequest(`/suppliers/${s.id}`, {
      method: 'DELETE',
    });

    if (res.success) {
      fetchData();
    } else {
      alert(res.message || 'Gagal menghapus supplier.');
    }
  };

  const pendingPOCount = purchaseOrders.filter((p) => p.status === 'submitted').length;
  const receivedPOCount = purchaseOrders.filter((p) => p.status === 'received').length;
  const totalPOValue = purchaseOrders.filter((p) => p.status === 'received').reduce((sum, p) => sum + p.total_cost, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'received':
        return (
          <span className="badge badge-success">
            <CheckCircle size={12} /> Diterima di Gudang
          </span>
        );
      case 'submitted':
        return (
          <span className="badge badge-warning">
            <Clock size={12} /> Menunggu Pengiriman
          </span>
        );
      case 'cancelled':
        return (
          <span className="badge badge-error">
            <XCircle size={12} /> Dibatalkan
          </span>
        );
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>
            Pengadaan Barang (Purchase Order) & Pemasok
          </h2>
          <p style={{ fontSize: '0.815rem', color: 'var(--color-neutral-gray)', marginTop: '2px' }}>
            Kelola pesanan pembelian bahan baku ke supplier dan penerimaan otomatis ke stok gudang
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {activeTab === 'orders' ? (
            <button onClick={openCreatePOModal} className="btn-primary" style={{ padding: '9px 18px' }}>
              <Plus size={16} /> Buat Purchase Order (PO)
            </button>
          ) : (
            <button onClick={openCreateSupplier} className="btn-primary" style={{ padding: '9px 18px' }}>
              <Plus size={16} /> Tambah Supplier Baru
            </button>
          )}
        </div>
      </div>

      {/* Summary Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div className="renato-card" style={{ padding: '16px', borderLeft: '4px solid #C5A46D' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-neutral-gray)' }}>
            Total Purchase Order
          </span>
          <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px' }}>
            {purchaseOrders.length} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#8A8A83' }}>dokumen</span>
          </div>
        </div>

        <div className="renato-card" style={{ padding: '16px', borderLeft: '4px solid #B45309' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#B45309' }}>
            Menunggu Pengiriman
          </span>
          <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#B45309', marginTop: '4px' }}>
            {pendingPOCount} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#8A8A83' }}>dalam proses</span>
          </div>
        </div>

        <div className="renato-card" style={{ padding: '16px', borderLeft: '4px solid #2D6A4F' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2D6A4F' }}>
            PO Selesai Diterima
          </span>
          <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2D6A4F', marginTop: '4px' }}>
            {receivedPOCount} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#8A8A83' }}>sukses</span>
          </div>
        </div>

        <div className="renato-card" style={{ padding: '16px', borderLeft: '4px solid #1E40AF' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-neutral-gray)' }}>
            Total Realisasi Pengadaan
          </span>
          <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1E40AF', marginTop: '4px' }}>
            {formatIDR(totalPOValue)}
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.875rem',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: activeTab === 'orders' ? 'var(--color-forest-green)' : 'transparent',
            color: activeTab === 'orders' ? '#FFFFFF' : 'var(--color-charcoal)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Truck size={16} /> Daftar Purchase Order ({purchaseOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.875rem',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: activeTab === 'suppliers' ? 'var(--color-forest-green)' : 'transparent',
            color: activeTab === 'suppliers' ? '#FFFFFF' : 'var(--color-charcoal)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Layers size={16} /> Daftar Pemasok / Supplier ({suppliers.length})
        </button>
      </div>

      {/* TAB 1: PURCHASE ORDERS */}
      {activeTab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Filters Bar */}
          <div className="renato-card" style={{ padding: '16px 20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8A8A83' }} />
              <input
                type="text"
                className="input-field"
                placeholder="Cari nomor PO atau nama supplier..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '38px' }}
              />
            </div>

            <select
              className="input-field"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '200px' }}
            >
              <option value="">Semua Status PO</option>
              <option value="submitted">Menunggu Pengiriman</option>
              <option value="received">Diterima di Gudang</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
          </div>

          {/* PO Table */}
          <div className="renato-card" style={{ overflow: 'hidden' }}>
            <table className="renato-table">
              <thead>
                <tr>
                  <th>No. Purchase Order</th>
                  <th>Tanggal Terbit</th>
                  <th>Pemasok (Supplier)</th>
                  <th>Total Biaya</th>
                  <th>Petugas PO</th>
                  <th>Status Pengadaan</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--color-neutral-gray)' }}>
                      Belum ada Purchase Order yang sesuai kriteria.
                    </td>
                  </tr>
                ) : (
                  purchaseOrders.map((po) => (
                    <tr key={po.id}>
                      <td>
                        <div className="font-mono" style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                          {po.po_number}
                        </div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--color-neutral-gray)' }}>
                          {po.items?.length || 0} item bahan baku
                        </div>
                      </td>
                      <td>{formatDate(po.created_at)}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{po.supplier?.name || '-'}</div>
                        {po.supplier?.phone && (
                          <div style={{ fontSize: '0.725rem', color: 'var(--color-neutral-gray)' }}>
                            {po.supplier.phone}
                          </div>
                        )}
                      </td>
                      <td className="font-mono" style={{ fontWeight: 700, color: 'var(--color-forest-green)' }}>
                        {formatIDR(po.total_cost)}
                      </td>
                      <td style={{ fontSize: '0.815rem', color: 'var(--color-neutral-gray)' }}>
                        {po.user?.name || 'Gudang'}
                      </td>
                      <td>{getStatusBadge(po.status)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setSelectedPO(po)}
                            className="btn-secondary"
                            title="Lihat Rincian PO"
                            style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                          >
                            <Eye size={13} /> Rincian
                          </button>
                          {po.status === 'submitted' && (
                            <button
                              onClick={() => handleReceivePO(po.id)}
                              className="btn-primary"
                              title="Terima Barang di Gudang"
                              style={{ padding: '6px 10px', fontSize: '0.75rem', backgroundColor: '#2D6A4F' }}
                            >
                              <ArrowDownLeft size={13} /> Terima Barang
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SUPPLIERS */}
      {activeTab === 'suppliers' && (
        <div className="renato-card" style={{ overflow: 'hidden' }}>
          <table className="renato-table">
            <thead>
              <tr>
                <th>Nama Pemasok / PT / CV</th>
                <th>Contact Person</th>
                <th>Kontak (Telp / Email)</th>
                <th>Alamat</th>
                <th>Total PO</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--color-neutral-gray)' }}>
                    Belum ada data supplier. Klik tombol 'Tambah Supplier Baru' di atas.
                  </td>
                </tr>
              ) : (
                suppliers.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{s.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-gray)' }}>
                        {s.ingredients_count || 0} bahan baku terikat
                      </div>
                    </td>
                    <td>{s.contact_person || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.815rem' }}>
                        {s.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Phone size={12} color="#8A8A83" />
                            <span>{s.phone}</span>
                          </div>
                        )}
                        {s.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-neutral-gray)' }}>
                            <Mail size={12} color="#8A8A83" />
                            <span>{s.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.815rem', color: 'var(--color-neutral-gray)', maxWidth: '200px' }}>
                      {s.address || '-'}
                    </td>
                    <td>
                      <span className="badge badge-gold font-mono">{s.purchase_orders_count || 0} PO</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => openEditSupplier(s)}
                          className="btn-secondary"
                          title="Edit Supplier"
                          style={{ padding: '6px 8px' }}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteSupplier(s)}
                          className="btn-secondary"
                          title="Hapus Supplier"
                          style={{ padding: '6px 8px', color: '#B91C1C' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Detail PO */}
      {selectedPO && (
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
          <div className="renato-card" style={{ width: '100%', maxWidth: '560px', padding: '26px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Purchase Order {selectedPO.po_number}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-gray)' }}>
                  Diterbitkan: {formatDate(selectedPO.created_at)}
                </span>
              </div>
              <button onClick={() => setSelectedPO(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Supplier Banner */}
            <div style={{ backgroundColor: 'var(--color-warm-cream)', padding: '14px', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-gray)' }}>Pemasok:</span>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{selectedPO.supplier?.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-gray)' }}>
                    Kontak: {selectedPO.supplier?.contact_person || '-'} • {selectedPO.supplier?.phone || '-'}
                  </div>
                </div>
                <div>{getStatusBadge(selectedPO.status)}</div>
              </div>
            </div>

            {/* Ordered Items Table */}
            <div style={{ maxHeight: '240px', overflowY: 'auto', marginBottom: '16px', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
              <table className="renato-table">
                <thead>
                  <tr>
                    <th>Bahan Baku</th>
                    <th>Jumlah</th>
                    <th>Harga Satuan</th>
                    <th style={{ textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPO.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{item.ingredient?.name || `Item #${item.ingredient_id}`}</td>
                      <td className="font-mono">
                        {item.quantity.toLocaleString('id-ID')} {item.ingredient?.unit}
                      </td>
                      <td className="font-mono">{formatIDR(item.unit_cost)}</td>
                      <td className="font-mono" style={{ textAlign: 'right', fontWeight: 700 }}>
                        {formatIDR(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Grand Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', backgroundColor: '#FAF6ED', borderRadius: '8px', marginBottom: '18px' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Total Nilai Pengadaan:</span>
              <span className="font-mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-forest-green)' }}>
                {formatIDR(selectedPO.total_cost)}
              </span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {selectedPO.status === 'submitted' && (
                <>
                  <button
                    onClick={() => handleReceivePO(selectedPO.id)}
                    className="btn-primary"
                    style={{ flex: 2, padding: '10px', backgroundColor: '#2D6A4F' }}
                  >
                    <CheckCircle size={15} /> Konfirmasi Terima Barang di Gudang
                  </button>
                  <button
                    onClick={() => handleCancelPO(selectedPO.id)}
                    className="btn-secondary"
                    style={{ flex: 1, padding: '10px', color: '#B91C1C' }}
                  >
                    Batalkan PO
                  </button>
                </>
              )}
              {selectedPO.status === 'received' && (
                <div style={{ padding: '8px', textAlign: 'center', width: '100%', fontSize: '0.815rem', color: '#2D6A4F', fontWeight: 600 }}>
                  ✅ Barang telah diterima di gudang pada {selectedPO.received_at ? formatDate(selectedPO.received_at) : '-'}.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Create PO */}
      {isCreatePOOpen && (
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
          <div className="renato-card" style={{ width: '100%', maxWidth: '640px', padding: '26px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Terbitkan Purchase Order Baru</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-gray)' }}>
                  Pilih supplier dan cantumkan jumlah bahan baku yang dipesan
                </span>
              </div>
              <button onClick={() => setIsCreatePOOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {poFormError && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'var(--status-error-bg)', color: 'var(--status-error-text)', fontSize: '0.815rem', marginBottom: '14px' }}>
                {poFormError}
              </div>
            )}

            <form onSubmit={handleCreatePO} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                  Pilih Pemasok (Supplier)
                </label>
                <select
                  className="input-field"
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(Number(e.target.value))}
                  required
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.contact_person ? `(PIC: ${s.contact_person})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Items Section */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                    Item Bahan Baku yang Dipesan
                  </label>
                  <button
                    type="button"
                    onClick={addPoItemRow}
                    className="btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                  >
                    <Plus size={12} /> Tambah Baris Bahan
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {poItems.map((item, idx) => {
                    const ing = ingredients.find((i) => i.id === item.ingredient_id);
                    return (
                      <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select
                          className="input-field"
                          value={item.ingredient_id}
                          onChange={(e) => updatePoItemRow(idx, 'ingredient_id', Number(e.target.value))}
                          style={{ flex: 2 }}
                        >
                          {ingredients.map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.name} ({i.unit})
                            </option>
                          ))}
                        </select>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1.2 }}>
                          <input
                            type="number"
                            step="any"
                            min="0.01"
                            className="input-field font-mono"
                            value={item.quantity}
                            onChange={(e) => updatePoItemRow(idx, 'quantity', Number(e.target.value))}
                            placeholder="Kuantitas"
                            required
                          />
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-gray)', width: '32px' }}>
                            {ing?.unit || ''}
                          </span>
                        </div>

                        <div style={{ flex: 1.5 }}>
                          <input
                            type="number"
                            min="0"
                            className="input-field font-mono"
                            value={item.unit_cost}
                            onChange={(e) => updatePoItemRow(idx, 'unit_cost', Number(e.target.value))}
                            placeholder="Harga / Satuan"
                            required
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => removePoItemRow(idx)}
                          className="btn-secondary"
                          style={{ padding: '6px 8px', color: '#B91C1C' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total Calculation */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', backgroundColor: '#FAF6ED', borderRadius: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Estimasi Total Biaya PO:</span>
                <span className="font-mono" style={{ fontWeight: 800, color: 'var(--color-forest-green)' }}>
                  {formatIDR(calculatedTotalCost)}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsCreatePOOpen(false)}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '10px' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingPO}
                  className="btn-primary"
                  style={{ flex: 2, padding: '10px' }}
                >
                  {submittingPO ? 'Memproses...' : 'Terbitkan Purchase Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Create / Edit Supplier */}
      {isSupplierModalOpen && (
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
          <div className="renato-card" style={{ width: '100%', maxWidth: '460px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>
                {editingSupplier ? `Edit Supplier: ${editingSupplier.name}` : 'Tambah Supplier / Pemasok Baru'}
              </h3>
              <button onClick={() => setIsSupplierModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {supError && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'var(--status-error-bg)', color: 'var(--status-error-text)', fontSize: '0.815rem', marginBottom: '14px' }}>
                {supError}
              </div>
            )}

            <form onSubmit={handleSaveSupplier} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                  Nama Perusahaan / Pemasok
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Cth: PT Sumber Unggas Jaya"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                  Contact Person (Nama PIC / Sales)
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Cth: Pak Hendra"
                  value={supContact}
                  onChange={(e) => setSupContact(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                    Nomor Telepon / WhatsApp
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="0812888801"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                    Email Pemasok
                  </label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="sales@sumber.id"
                    value={supEmail}
                    onChange={(e) => setSupEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                  Alamat Kantor / Gudang Pemasok
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Cth: Pergudangan Sentra Bogor Blok B-4"
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '10px' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingSup}
                  className="btn-primary"
                  style={{ flex: 2, padding: '10px' }}
                >
                  {submittingSup ? 'Menyimpan...' : editingSupplier ? 'Simpan Perubahan' : 'Tambah Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
