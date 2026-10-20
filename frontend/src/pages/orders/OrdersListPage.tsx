import React, { useState, useEffect } from 'react';
import { apiRequest, formatIDR, formatDate } from '../../lib/api';
import { Order } from '../../types';
import {
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';

export const OrdersListPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    let url = '/orders?';
    if (statusFilter) url += `order_status=${statusFilter}&`;
    if (search) url += `search=${search}&`;
    const res = await apiRequest<Order[]>(url);
    if (res.success && res.data) {
      setOrders(res.data);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, search]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="badge badge-success">Selesai</span>;
      case 'preparing':
        return <span className="badge badge-warning">Dimasak</span>;
      case 'ready':
        return <span className="badge badge-info">Siap Saji</span>;
      case 'confirmed':
        return <span className="badge badge-gold">Dikonfirmasi</span>;
      case 'cancelled':
        return <span className="badge badge-error">Dibatalkan</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Filters Bar */}
      <div className="renato-card" style={{ padding: '16px 20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8A8A83' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Cari nomor pesanan atau nama tamu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '38px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Filter size={16} color="#8A8A83" />
          <select
            className="input-field"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '180px' }}
          >
            <option value="">Semua Status</option>
            <option value="confirmed">Dikonfirmasi</option>
            <option value="preparing">Sedang Dimasak</option>
            <option value="ready">Siap Saji</option>
            <option value="completed">Selesai</option>
            <option value="cancelled">Dibatalkan</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="renato-card" style={{ overflow: 'hidden' }}>
        <table className="renato-table">
          <thead>
            <tr>
              <th>No. Pesanan</th>
              <th>Waktu</th>
              <th>Tipe / Meja</th>
              <th>Tamu</th>
              <th>Total</th>
              <th>Status Pembayaran</th>
              <th>Status Dapur</th>
              <th style={{ textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--color-neutral-gray)' }}>
                  Tidak ada pesanan yang sesuai filter.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td className="font-mono" style={{ fontWeight: 700 }}>
                    {order.order_number}
                  </td>
                  <td>{formatDate(order.created_at)}</td>
                  <td>
                    <span style={{ fontWeight: 600 }}>
                      {order.order_type === 'dine_in' ? `Meja ${order.table?.table_number || order.table_id}` : 'Takeaway'}
                    </span>
                  </td>
                  <td>{order.customer_name}</td>
                  <td className="font-mono" style={{ fontWeight: 700, color: 'var(--color-forest-green)' }}>
                    {formatIDR(order.total_amount)}
                  </td>
                  <td>
                    <span className={`badge ${order.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                      {order.payment_status === 'paid' ? 'Lunas' : 'Menunggu Bayar'}
                    </span>
                  </td>
                  <td>{getStatusBadge(order.order_status)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                    >
                      <Eye size={13} /> Rincian
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Order Detail Drawer / Modal */}
      {selectedOrder && (
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
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>{selectedOrder.order_number}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-gray)' }}>
                  {formatDate(selectedOrder.created_at)}
                </span>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                Tutup
              </button>
            </div>

            <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
              {getStatusBadge(selectedOrder.order_status)}
              <span className={`badge ${selectedOrder.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                {selectedOrder.payment_status === 'paid' ? 'Lunas' : 'Belum Lunas'}
              </span>
            </div>

            <div style={{ maxHeight: '250px', overflowY: 'auto', borderTop: '1px solid var(--color-border)', paddingTop: '10px' }}>
              {selectedOrder.items?.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem' }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{item.quantity}x {item.product_name}</span>
                    {item.variant_name && <div style={{ fontSize: '0.75rem', color: '#8A8A83' }}>Varian: {item.variant_name}</div>}
                  </div>
                  <span className="font-mono">{formatIDR(item.subtotal)}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px', marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.815rem', color: 'var(--color-neutral-gray)' }}>
                <span>Subtotal:</span>
                <span>{formatIDR(selectedOrder.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.815rem', color: 'var(--color-neutral-gray)' }}>
                <span>PB1 Resto (10%):</span>
                <span>{formatIDR(selectedOrder.tax_amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.815rem', color: 'var(--color-neutral-gray)' }}>
                <span>Service Charge (5%):</span>
                <span>{formatIDR(selectedOrder.service_charge_amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem', fontWeight: 800, marginTop: '6px', color: 'var(--color-forest-green)' }}>
                <span>Total:</span>
                <span>{formatIDR(selectedOrder.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
