import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../shared/BrandLogo';
import { Role } from '../../types';
import {
  LayoutDashboard,
  CreditCard,
  ClipboardList,
  Flame,
  LayoutGrid,
  UtensilsCrossed,
  Boxes,
  FileCheck2,
  Receipt,
  BarChart3,
  Settings,
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ShoppingBag,
  Truck,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface MenuItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  roles: Role[];
  badge?: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    name: 'Overview',
    path: '/dashboard',
    icon: LayoutDashboard,
    roles: ['owner', 'manager', 'admin', 'cashier', 'kitchen', 'inventory'],
  },
  {
    name: 'Point of Sale',
    path: '/pos',
    icon: CreditCard,
    roles: ['owner', 'manager', 'cashier'],
  },
  {
    name: 'Orders',
    path: '/orders',
    icon: ClipboardList,
    roles: ['owner', 'manager', 'admin', 'cashier'],
  },
  {
    name: 'Kitchen Display',
    path: '/kitchen',
    icon: Flame,
    roles: ['owner', 'manager', 'kitchen'],
  },
  {
    name: 'Manajemen Meja',
    path: '/tables',
    icon: LayoutGrid,
    roles: ['owner', 'manager', 'cashier'],
  },
  {
    name: 'Menu & Resep',
    path: '/menu',
    icon: UtensilsCrossed,
    roles: ['owner', 'manager', 'admin'],
  },
  {
    name: 'Inventaris Stok',
    path: '/inventory',
    icon: Boxes,
    roles: ['owner', 'manager', 'inventory'],
  },
  {
    name: 'Stock Opname',
    path: '/stock-opname',
    icon: FileCheck2,
    roles: ['owner', 'manager', 'inventory'],
  },
  {
    name: 'Pembelian & Supplier',
    path: '/purchase-orders',
    icon: Truck,
    roles: ['owner', 'manager', 'inventory'],
  },
  {
    name: 'Pengeluaran',
    path: '/expenses',
    icon: Receipt,
    roles: ['owner', 'manager'],
  },
  {
    name: 'Laporan Bisnis',
    path: '/reports',
    icon: BarChart3,
    roles: ['owner', 'manager'],
  },
  {
    name: 'Staf & Pengguna',
    path: '/users',
    icon: Users,
    roles: ['owner', 'manager'],
  },
  {
    name: 'Pengaturan Resto',
    path: '/settings',
    icon: Settings,
    roles: ['owner'],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { user, logout, hasRole } = useAuth();

  const filteredMenuItems = MENU_ITEMS.filter((item) => hasRole(item.roles));

  return (
    <aside
      style={{
        width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        backgroundColor: 'var(--color-charcoal)',
        color: '#FFFFFF',
        height: '100vh',
        position: 'sticky',
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: 50,
        boxShadow: '2px 0 12px rgba(0, 0, 0, 0.1)',
        borderRight: '1px solid #33332E',
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          height: 'var(--header-height)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '0' : '0 20px',
          borderBottom: '1px solid #33332E',
        }}
      >
        <BrandLogo collapsed={collapsed} light />
        {!collapsed && (
          <button
            onClick={onToggle}
            title="Ciutkan Sidebar"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-neutral-gray)',
              cursor: 'pointer',
              display: 'flex',
              padding: '6px',
              borderRadius: '6px',
            }}
          >
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={collapsed ? item.name : undefined}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: collapsed ? '12px 0' : '10px 14px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#FFFFFF' : '#B5B5AC',
                backgroundColor: isActive ? 'var(--color-forest-green)' : 'transparent',
                borderLeft: isActive && !collapsed ? '3px solid #C5A46D' : '3px solid transparent',
                transition: 'all 0.15s ease',
              })}
            >
              <Icon size={20} />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          );
        })}

        {/* Public Ordering Link */}
        <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #33332E' }}>
          <NavLink
            to="/order-online"
            target="_blank"
            title={collapsed ? 'Pemesanan Tamu (Online)' : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: collapsed ? '12px 0' : '10px 14px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '0.815rem',
              fontWeight: 500,
              color: '#C5A46D',
              backgroundColor: 'rgba(197, 164, 109, 0.1)',
            }}
          >
            <ShoppingBag size={18} />
            {!collapsed && <span>Menu Publik (Tamu)</span>}
          </NavLink>
        </div>
      </nav>

      {/* Footer / Toggle & User Profile */}
      <div
        style={{
          padding: '14px',
          borderTop: '1px solid #33332E',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {collapsed ? (
          <button
            onClick={onToggle}
            title="Perluas Sidebar"
            style={{
              width: '100%',
              background: '#33332E',
              border: 'none',
              color: '#FFFFFF',
              borderRadius: '6px',
              padding: '8px 0',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <ChevronRight size={18} />
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  backgroundColor: '#344C3D',
                  color: '#C5A46D',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {user ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span
                  style={{
                    fontSize: '0.815rem',
                    fontWeight: 600,
                    color: '#FFFFFF',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user?.name || 'Kasir'}
                </span>
                <span
                  style={{
                    fontSize: '0.675rem',
                    textTransform: 'uppercase',
                    color: '#C5A46D',
                    letterSpacing: '0.05em',
                  }}
                >
                  {user?.role || 'Guest'}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              title="Keluar / Logout"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-neutral-gray)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
