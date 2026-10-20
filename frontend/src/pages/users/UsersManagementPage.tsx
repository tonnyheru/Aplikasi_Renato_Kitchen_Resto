import React, { useState, useEffect } from 'react';
import { apiRequest, formatDate } from '../../lib/api';
import { User, Role } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  UserPlus,
  Shield,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Search,
  X,
  Phone,
  Mail,
  Lock,
} from 'lucide-react';

export const UsersManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Modal Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('cashier');
  const [phone, setPhone] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await apiRequest<User[]>('/users');
    if (res.success && res.data) {
      setUsers(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('cashier');
    setPhone('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setName(u.name);
    setEmail(u.email);
    setPassword('');
    setRole(u.role);
    setPhone(u.phone || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    if (editingUser) {
      // Update
      const payload: any = {
        name,
        email,
        role,
        phone,
      };
      if (password) {
        payload.password = password;
      }

      const res = await apiRequest(`/users/${editingUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      setSubmitting(false);
      if (res.success) {
        setIsModalOpen(false);
        fetchUsers();
      } else {
        setFormError(res.message || 'Gagal memperbarui pengguna.');
      }
    } else {
      // Create
      if (!password) {
        setFormError('Password wajib diisi untuk pengguna baru.');
        setSubmitting(false);
        return;
      }

      const res = await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          phone,
        }),
      });

      setSubmitting(false);
      if (res.success) {
        setIsModalOpen(false);
        fetchUsers();
      } else {
        setFormError(res.message || 'Gagal menambahkan pengguna.');
      }
    }
  };

  const handleToggleStatus = async (u: User) => {
    const action = (u as any).is_active ? 'menonaktifkan' : 'mengaktifkan';
    if (!confirm(`Apakah Anda yakin ingin ${action} akun ${u.name}?`)) return;

    const res = await apiRequest(`/users/${u.id}/toggle-status`, {
      method: 'PATCH',
    });

    if (res.success) {
      fetchUsers();
    } else {
      alert(res.message || 'Gagal mengubah status pengguna.');
    }
  };

  const handleDeleteUser = async (u: User) => {
    if (!confirm(`Hapus akun ${u.name} secara permanen? Tindakan ini tidak dapat dibatalkan.`)) return;

    const res = await apiRequest(`/users/${u.id}`, {
      method: 'DELETE',
    });

    if (res.success) {
      fetchUsers();
    } else {
      alert(res.message || 'Gagal menghapus pengguna.');
    }
  };

  const getRoleBadge = (r: Role) => {
    switch (r) {
      case 'owner':
        return <span className="badge badge-gold">👑 Owner</span>;
      case 'manager':
        return <span className="badge badge-info">💼 Manager</span>;
      case 'cashier':
        return <span className="badge badge-success">💳 Kasir (POS)</span>;
      case 'kitchen':
        return <span className="badge badge-warning">🍳 Dapur (KDS)</span>;
      case 'inventory':
        return <span className="badge badge-purple" style={{ backgroundColor: '#EDE9FE', color: '#6D28D9', border: '1px solid #DDD6FE' }}>📦 Gudang</span>;
      case 'admin':
        return <span className="badge">⚙️ Admin</span>;
      default:
        return <span className="badge">{r}</span>;
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.phone && u.phone.includes(search));
    const matchesRole = roleFilter ? u.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>
            Manajemen Karyawan & Akun Pengguna
          </h2>
          <p style={{ fontSize: '0.815rem', color: 'var(--color-neutral-gray)', marginTop: '2px' }}>
            Atur staf kasir, chef dapur, staf inventaris gudang, manajer, dan hak akses sistem
          </p>
        </div>

        <button onClick={openCreateModal} className="btn-primary" style={{ padding: '9px 18px' }}>
          <UserPlus size={16} /> Tambah Staf Baru
        </button>
      </div>

      {/* Role Summary Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px' }}>
        {[
          { label: 'Total Staf', count: users.length, icon: Users, color: '#2D6A4F', bg: '#EAF5ED' },
          { label: 'Kasir (POS)', count: users.filter((u) => u.role === 'cashier').length, icon: Shield, color: '#C5A46D', bg: '#FAF6ED' },
          { label: 'Tim Dapur (KDS)', count: users.filter((u) => u.role === 'kitchen').length, icon: Shield, color: '#B45309', bg: '#FEF7EA' },
          { label: 'Tim Gudang', count: users.filter((u) => u.role === 'inventory').length, icon: Shield, color: '#6D28D9', bg: '#F5F3FF' },
          { label: 'Manajemen', count: users.filter((u) => ['owner', 'manager', 'admin'].includes(u.role)).length, icon: Shield, color: '#1E40AF', bg: '#EFF6FF' },
        ].map((item, idx) => (
          <div
            key={idx}
            className="renato-card"
            style={{
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderLeft: `4px solid ${item.color}`,
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-neutral-gray)' }}>
                {item.label}
              </span>
              <div className="font-mono" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-charcoal)', marginTop: '4px' }}>
                {item.count}
              </div>
            </div>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color }}>
              <item.icon size={18} />
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="renato-card" style={{ padding: '16px 20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8A8A83' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Cari nama karyawan, email, atau no telp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '38px' }}
          />
        </div>

        <select
          className="input-field"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ width: '200px' }}
        >
          <option value="">Semua Peran / Role</option>
          <option value="owner">Owner</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
          <option value="cashier">Kasir</option>
          <option value="kitchen">Dapur</option>
          <option value="inventory">Gudang</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="renato-card" style={{ overflow: 'hidden' }}>
        <table className="renato-table">
          <thead>
            <tr>
              <th>Nama Pengguna</th>
              <th>Kontak</th>
              <th>Peran (Role)</th>
              <th>Status Akun</th>
              <th>Terdaftar</th>
              <th style={{ textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--color-neutral-gray)' }}>
                  Memuat data karyawan...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--color-neutral-gray)' }}>
                  Tidak ada pengguna yang cocok dengan pencarian.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const isActive = (u as any).is_active ?? true;
                const isSelf = currentUser?.id === u.id;

                return (
                  <tr key={u.id} style={{ opacity: isActive ? 1 : 0.65 }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: '#344C3D',
                            color: '#C5A46D',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                            {u.name} {isSelf && <span style={{ fontSize: '0.725rem', color: '#C5A46D' }}>(Anda)</span>}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-gray)' }}>
                            ID: #{u.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.815rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Mail size={12} color="#8A8A83" />
                          <span>{u.email}</span>
                        </div>
                        {u.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-neutral-gray)' }}>
                            <Phone size={12} color="#8A8A83" />
                            <span>{u.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{getRoleBadge(u.role)}</td>
                    <td>
                      {isActive ? (
                        <span className="badge badge-success">
                          <CheckCircle size={12} /> Aktif
                        </span>
                      ) : (
                        <span className="badge badge-error">
                          <XCircle size={12} /> Nonaktif
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.815rem', color: 'var(--color-neutral-gray)' }}>
                      {(u as any).created_at ? formatDate((u as any).created_at) : '-'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => openEditModal(u)}
                          className="btn-secondary"
                          title="Edit Pengguna"
                          style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                        >
                          <Edit2 size={13} /> Edit
                        </button>

                        {!isSelf && (
                          <>
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className="btn-secondary"
                              title={isActive ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                              style={{
                                padding: '6px 10px',
                                fontSize: '0.75rem',
                                color: isActive ? '#B91C1C' : '#2D6A4F',
                              }}
                            >
                              {isActive ? 'Nonaktifkan' : 'Aktifkan'}
                            </button>

                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="btn-secondary"
                              title="Hapus Akun"
                              style={{ padding: '6px 8px', color: '#B91C1C' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Create / Edit User */}
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
          <div className="renato-card" style={{ width: '100%', maxWidth: '480px', padding: '26px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>
                {editingUser ? `Edit Pengguna: ${editingUser.name}` : 'Tambah Staf / Pengguna Baru'}
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

            <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Cth: Siti Rahma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                  Alamat Email (Untuk Login)
                </label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="kasir@renato.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                  {editingUser ? 'Password Baru (Kosongkan jika tidak diubah)' : 'Password'}
                </label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!editingUser}
                  minLength={6}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                    Peran / Role
                  </label>
                  <select className="input-field" value={role} onChange={(e) => setRole(e.target.value as Role)}>
                    <option value="cashier">Kasir (POS)</option>
                    <option value="kitchen">Dapur (KDS)</option>
                    <option value="inventory">Gudang Inventaris</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                    <option value="owner">Owner</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                    Nomor WhatsApp / Telp
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="08123456789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
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
                  {submitting ? 'Menyimpan...' : editingUser ? 'Simpan Perubahan' : 'Buat Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
