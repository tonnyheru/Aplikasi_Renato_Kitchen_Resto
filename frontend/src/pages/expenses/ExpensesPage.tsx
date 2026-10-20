import React, { useState, useEffect } from 'react';
import { apiRequest, formatIDR, formatDate } from '../../lib/api';
import { Plus, Receipt, X, Trash2, Search, Edit2, CheckCircle } from 'lucide-react';

interface Expense {
  id: number;
  expense_number: string;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  user?: { name: string };
}

const CATEGORIES = [
  'Gas & Listrik',
  'Air & Sanitasi',
  'Kemasan & Kantong',
  'Kebersihan & Perlengkapan',
  'Perawatan Peralatan',
  'Biaya Lain-lain',
];

const emptyForm = () => ({
  category: CATEGORIES[0],
  description: '',
  amount: 0,
  expenseDate: new Date().toISOString().split('T')[0],
});

export const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form state
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  const fetchExpenses = async () => {
    const res = await apiRequest<Expense[]>('/expenses');
    if (res.success && res.data) {
      setExpenses(res.data);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const openCreateModal = () => {
    setEditingExpense(null);
    setCategory(CATEGORIES[0]);
    setDescription('');
    setAmount(0);
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setCategory(expense.category);
    setDescription(expense.description);
    setAmount(expense.amount);
    setExpenseDate(expense.expense_date);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !description) return;
    setSubmitting(true);

    const payload = { category, description, amount, expense_date: expenseDate };

    let res;
    if (editingExpense) {
      res = await apiRequest(`/expenses/${editingExpense.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    } else {
      res = await apiRequest('/expenses', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }

    setSubmitting(false);
    if (res.success) {
      setIsModalOpen(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      fetchExpenses();
    } else {
      alert(res.message || 'Gagal menyimpan pengeluaran.');
    }
  };

  const handleDeleteExpense = async (id: number, number: string) => {
    if (!confirm(`Hapus catatan biaya operasional ${number}?`)) return;

    const res = await apiRequest(`/expenses/${id}`, {
      method: 'DELETE',
    });

    if (res.success) {
      fetchExpenses();
    } else {
      alert(res.message || 'Gagal menghapus pengeluaran.');
    }
  };

  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.expense_number.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory ? e.category === selectedCategory : true;
    return matchesSearch && matchesCat;
  });

  const totalExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>
            Catatan Pengeluaran Operasional Restoran
          </h2>
          <p style={{ fontSize: '0.815rem', color: 'var(--color-neutral-gray)', marginTop: '2px' }}>
            Listrik, gas, air, kemasan, kebersihan, dan pemeliharaan alat
          </p>
        </div>

        <button onClick={openCreateModal} className="btn-primary" style={{ padding: '9px 18px' }}>
          <Plus size={16} /> Catat Pengeluaran Baru
        </button>
      </div>

      {savedSuccess && (
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success-text)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 600 }}>
          <CheckCircle size={16} />
          {editingExpense ? 'Data pengeluaran berhasil diperbarui!' : 'Pengeluaran baru berhasil dicatat!'}
        </div>
      )}

      {/* Summary Banner */}
      <div className="renato-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FDF2F2', border: '1px solid #F8B4B4' }}>
        <div>
          <span style={{ fontSize: '0.815rem', fontWeight: 600, color: '#B91C1C' }}>
            Total Biaya Operasional Tercatat ({filteredExpenses.length} transaksi)
          </span>
          <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#B91C1C', marginTop: '4px' }}>
            {formatIDR(totalExpense)}
          </div>
        </div>
        <Receipt size={32} color="#B91C1C" />
      </div>

      {/* Filter Bar */}
      <div className="renato-card" style={{ padding: '16px 20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8A8A83' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Cari keterangan atau no referensi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '38px' }}
          />
        </div>

        <select
          className="input-field"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ width: '220px' }}
        >
          <option value="">Semua Kategori Biaya</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Expenses Table */}
      <div className="renato-card" style={{ overflow: 'hidden' }}>
        <table className="renato-table">
          <thead>
            <tr>
              <th>No. Referensi</th>
              <th>Tanggal</th>
              <th>Kategori</th>
              <th>Keterangan Pengeluaran</th>
              <th>Nominal Biaya</th>
              <th>Pencatat</th>
              <th style={{ textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--color-neutral-gray)' }}>
                  Tidak ada catatan biaya operasional yang sesuai filter.
                </td>
              </tr>
            ) : (
              filteredExpenses.map((e) => (
                <tr key={e.id}>
                  <td className="font-mono" style={{ fontWeight: 700 }}>
                    {e.expense_number}
                  </td>
                  <td>{e.expense_date}</td>
                  <td>
                    <span className="badge badge-gold">{e.category}</span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{e.description}</td>
                  <td className="font-mono" style={{ fontWeight: 700, color: '#B91C1C' }}>
                    {formatIDR(e.amount)}
                  </td>
                  <td style={{ fontSize: '0.815rem', color: 'var(--color-neutral-gray)' }}>
                    {e.user?.name || 'Manager'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => openEditModal(e)}
                        className="btn-secondary"
                        title="Edit Pengeluaran"
                        style={{ padding: '6px 8px' }}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(e.id, e.expense_number)}
                        className="btn-secondary"
                        title="Hapus Pengeluaran"
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

      {/* Modal Add / Edit Expense */}
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
          <div className="renato-card" style={{ width: '100%', maxWidth: '440px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>
                {editingExpense ? 'Edit Pengeluaran' : 'Catat Pengeluaran Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {editingExpense && (
              <div style={{ padding: '8px 12px', backgroundColor: 'var(--color-warm-cream)', borderRadius: '6px', marginBottom: '14px', fontSize: '0.815rem', color: 'var(--color-neutral-gray)', fontWeight: 600 }}>
                Mengedit: {editingExpense.expense_number}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                  Kategori
                </label>
                <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                  Keterangan Pengeluaran
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Cth: Pembelian Gas Elpiji 12kg"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                  Nominal (Rp)
                </label>
                <input
                  type="number"
                  className="input-field font-mono"
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  required
                  placeholder="0"
                  min={1}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                  Tanggal Transaksi
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-primary" disabled={submitting} style={{ width: '100%', padding: '11px', marginTop: '6px' }}>
                {submitting ? 'Menyimpan...' : editingExpense ? 'Perbarui Pengeluaran' : 'Simpan Pengeluaran'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
