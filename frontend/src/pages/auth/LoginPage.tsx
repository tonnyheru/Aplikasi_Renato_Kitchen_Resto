import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../../components/shared/BrandLogo';
import { Role } from '../../types';
import { Shield, ArrowRight, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, switchRole } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('cashier@renato.id');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.message || 'Login gagal.');
    }
  };

  const handleQuickRole = async (role: Role) => {
    setLoading(true);
    const ok = await switchRole(role);
    setLoading(false);
    if (ok) {
      navigate('/dashboard');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-warm-cream)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="renato-card"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '36px',
          border: '1px solid var(--color-border)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <BrandLogo />
        </div>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>
            Masuk ke Sistem Restoran
          </h2>
          <p style={{ fontSize: '0.815rem', color: 'var(--color-neutral-gray)', marginTop: '4px' }}>
            Integrated Restaurant Management & Point of Sale
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              backgroundColor: 'var(--status-error-bg)',
              color: 'var(--status-error-text)',
              fontSize: '0.815rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '18px',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
              Alamat Email
            </label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="nama@renato.id"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
              Kata Sandi
            </label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '11px', marginTop: '8px' }}
          >
            {loading ? 'Memproses...' : 'Masuk Sekarang'}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Quick Demo Access Roles */}
        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--color-border)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--color-neutral-gray)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '12px',
            }}
          >
            <Shield size={14} color="#C5A46D" />
            <span>Akses Cepat Demo Portofolio</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleQuickRole('owner')}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '6px 10px', justifyContent: 'flex-start' }}
            >
              👑 Owner
            </button>
            <button
              type="button"
              onClick={() => handleQuickRole('manager')}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '6px 10px', justifyContent: 'flex-start' }}
            >
              💼 Manager
            </button>
            <button
              type="button"
              onClick={() => handleQuickRole('cashier')}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '6px 10px', justifyContent: 'flex-start' }}
            >
              💳 Kasir (POS)
            </button>
            <button
              type="button"
              onClick={() => handleQuickRole('kitchen')}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '6px 10px', justifyContent: 'flex-start' }}
            >
              🍳 Dapur (KDS)
            </button>
            <button
              type="button"
              onClick={() => handleQuickRole('inventory')}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '6px 10px', justifyContent: 'flex-start' }}
            >
              📦 Gudang
            </button>
            <button
              type="button"
              onClick={() => handleQuickRole('admin')}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '6px 10px', justifyContent: 'flex-start' }}
            >
              ⚙️ Admin Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
