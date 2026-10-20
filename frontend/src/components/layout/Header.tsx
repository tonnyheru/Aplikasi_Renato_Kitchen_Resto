import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';
import { Wifi, UserCheck, Shield } from 'lucide-react';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const { user, switchRole } = useAuth();

  const handleRoleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const targetRole = e.target.value as Role;
    await switchRole(targetRole);
  };

  return (
    <header
      style={{
        height: 'var(--header-height)',
        backgroundColor: 'var(--color-white)',
        borderBottom: '1px solid var(--color-border)',
        padding: '0 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: '0 1px 3px rgba(37, 37, 34, 0.02)',
      }}
    >
      {/* Title & Context */}
      <div>
        <h1
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--color-charcoal)',
            lineHeight: 1.2,
          }}
        >
          {title}
        </h1>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
        {/* System Online Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 10px',
            borderRadius: '9999px',
            backgroundColor: 'var(--status-success-bg)',
            color: 'var(--status-success-text)',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#2D6A4F',
              boxShadow: '0 0 0 2px rgba(45, 106, 79, 0.2)',
            }}
          />
          <Wifi size={13} />
          <span>Sistem Aktif (Online)</span>
        </div>

        {/* Demo Fast Role Switcher — HANYA OWNER */}
        {user?.role === 'owner' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--color-warm-cream)',
              padding: '4px 10px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
            }}
          >
            <Shield size={14} color="#C5A46D" />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-neutral-gray)' }}>
              Peran Aktif:
            </span>
            <select
              value={user?.role || 'owner'}
              onChange={handleRoleChange}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '0.815rem',
                fontWeight: 700,
                color: 'var(--color-forest-green)',
                cursor: 'pointer',
                outline: 'none',
                paddingRight: '4px',
              }}
            >
              <option value="owner">Owner (Super Admin)</option>
              <option value="manager">Manager Resto</option>
              <option value="admin">Admin Menu</option>
              <option value="cashier">Kasir (POS)</option>
              <option value="kitchen">Staf Dapur (KDS)</option>
              <option value="inventory">Staf Gudang / Inventaris</option>
            </select>
          </div>
        )}

        {/* User Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderLeft: '1px solid var(--color-border)',
            paddingLeft: '16px',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-forest-green)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.815rem',
              fontWeight: 700,
            }}
          >
            {user?.name?.charAt(0) || 'R'}
          </div>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-charcoal)' }}>
            {user?.name?.split(' ')[0] || 'User'}
          </span>
        </div>
      </div>
    </header>
  );
};
