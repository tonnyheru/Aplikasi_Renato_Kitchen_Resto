import React, { useState, useEffect } from 'react';
import { apiRequest, formatDate } from '../../lib/api';
import { Order } from '../../types';
import {
  Flame,
  CheckCircle,
  Clock,
  Utensils,
  ShoppingBag,
  RefreshCw,
  Bell,
  AlertCircle,
} from 'lucide-react';

export const KitchenDisplayPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchKitchenOrders = async () => {
    setIsRefreshing(true);
    const res = await apiRequest<Order[]>('/kitchen/orders');
    if (res.success && res.data) {
      setOrders(res.data);
    }
    setIsRefreshing(false);
    setLoading(false);
  };

  useEffect(() => {
    fetchKitchenOrders();
    // Auto sync heartbeat every 6 seconds
    const interval = setInterval(fetchKitchenOrders, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleStartPreparing = async (id: number) => {
    const res = await apiRequest(`/kitchen/orders/${id}/start`, { method: 'PATCH' });
    if (res.success) {
      fetchKitchenOrders();
    }
  };

  const handleMarkReady = async (id: number) => {
    const res = await apiRequest(`/kitchen/orders/${id}/ready`, { method: 'PATCH' });
    if (res.success) {
      fetchKitchenOrders();
    }
  };

  const handleCompleteServe = async (id: number) => {
    const res = await apiRequest(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ order_status: 'completed', notes: 'Pesanan telah disajikan ke tamu.' }),
    });
    if (res.success) {
      fetchKitchenOrders();
    }
  };

  const confirmedOrders = orders.filter((o) => o.order_status === 'confirmed');
  const preparingOrders = orders.filter((o) => o.order_status === 'preparing');
  const readyOrders = orders.filter((o) => o.order_status === 'ready');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: 'calc(100vh - 110px)' }}>
      {/* Top Status Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>
            Kitchen Display System (KDS)
          </h2>
          <span className="badge badge-gold">
            <Flame size={12} /> {orders.length} Pesanan Aktif
          </span>
        </div>

        <button
          onClick={fetchKitchenOrders}
          className="btn-secondary"
          disabled={isRefreshing}
          style={{ padding: '7px 14px', fontSize: '0.815rem' }}
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          {isRefreshing ? 'Sinkronisasi...' : 'Segarkan Data'}
        </button>
      </div>

      {/* 3-Column Kanban Board */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
          overflowY: 'hidden',
        }}
      >
        {/* Column 1: Tiket Baru (Confirmed) */}
        <div
          style={{
            backgroundColor: '#F3EFE6',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            border: '1px solid var(--color-border)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>
              1. Pesanan Baru
            </span>
            <span
              style={{
                backgroundColor: 'var(--color-charcoal)',
                color: '#FFFFFF',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '9999px',
              }}
            >
              {confirmedOrders.length}
            </span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {confirmedOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--color-neutral-gray)', fontSize: '0.815rem' }}>
                Tidak ada tiket baru
              </div>
            ) : (
              confirmedOrders.map((order) => (
                <div
                  key={order.id}
                  className="renato-card"
                  style={{
                    padding: '16px',
                    borderLeft: '4px solid #C5A46D',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                        {order.order_type === 'dine_in' ? `Meja ${order.table?.table_number || order.table_id}` : 'Takeaway'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-gray)' }}>
                        {order.order_number} • {order.customer_name}
                      </div>
                    </div>
                    <span className="badge badge-warning">
                      <Clock size={11} /> {formatDate(order.created_at).split(' ')[1]}
                    </span>
                  </div>

                  {/* Items */}
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '8px' }}>
                    {order.items?.map((it, idx) => (
                      <div key={idx} style={{ marginBottom: '6px' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>
                          <span style={{ color: 'var(--color-forest-green)', marginRight: '6px' }}>{it.quantity}x</span>
                          {it.product_name}
                          {it.variant_name && <span style={{ fontSize: '0.75rem', color: '#8A8A83' }}> ({it.variant_name})</span>}
                        </div>
                        {it.special_notes && (
                          <div style={{ fontSize: '0.75rem', color: '#B45309', fontWeight: 600 }}>
                            Catatan: {it.special_notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleStartPreparing(order.id)}
                    className="btn-primary"
                    style={{ width: '100%', padding: '8px', fontSize: '0.815rem' }}
                  >
                    <Flame size={15} /> Mulai Masak
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: Sedang Dimasak (Preparing) */}
        <div
          style={{
            backgroundColor: '#FEF7EA',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            border: '1px solid #F6D8A8',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#B45309' }}>
              2. Sedang Dimasak
            </span>
            <span
              style={{
                backgroundColor: '#B45309',
                color: '#FFFFFF',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '9999px',
              }}
            >
              {preparingOrders.length}
            </span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {preparingOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#B45309', fontSize: '0.815rem' }}>
                Tidak ada masakan berjalan
              </div>
            ) : (
              preparingOrders.map((order) => (
                <div
                  key={order.id}
                  className="renato-card"
                  style={{
                    padding: '16px',
                    borderLeft: '4px solid #B45309',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                        {order.order_type === 'dine_in' ? `Meja ${order.table?.table_number || order.table_id}` : 'Takeaway'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-gray)' }}>
                        {order.order_number}
                      </div>
                    </div>
                    <span className="badge badge-warning">
                      <Flame size={11} /> Memasak
                    </span>
                  </div>

                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '8px' }}>
                    {order.items?.map((it, idx) => (
                      <div key={idx} style={{ marginBottom: '6px' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>
                          <span style={{ color: 'var(--color-forest-green)', marginRight: '6px' }}>{it.quantity}x</span>
                          {it.product_name}
                        </div>
                        {it.special_notes && (
                          <div style={{ fontSize: '0.75rem', color: '#B45309', fontWeight: 600 }}>
                            {it.special_notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleMarkReady(order.id)}
                    className="btn-primary"
                    style={{ width: '100%', padding: '8px', fontSize: '0.815rem', backgroundColor: '#2D6A4F' }}
                  >
                    <CheckCircle size={15} /> Masakan Siap Saji
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: Siap Saji / Diantar (Ready) */}
        <div
          style={{
            backgroundColor: '#EAF5ED',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            border: '1px solid #B8DEC6',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#2D6A4F' }}>
              3. Siap Disajikan / Diambil
            </span>
            <span
              style={{
                backgroundColor: '#2D6A4F',
                color: '#FFFFFF',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '9999px',
              }}
            >
              {readyOrders.length}
            </span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {readyOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#2D6A4F', fontSize: '0.815rem' }}>
                Tidak ada pesanan menunggu saji
              </div>
            ) : (
              readyOrders.map((order) => (
                <div
                  key={order.id}
                  className="renato-card"
                  style={{
                    padding: '16px',
                    borderLeft: '4px solid #2D6A4F',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                        {order.order_type === 'dine_in' ? `Meja ${order.table?.table_number || order.table_id}` : 'Takeaway'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-gray)' }}>
                        {order.order_number}
                      </div>
                    </div>
                    <span className="badge badge-success">Siap Diantar</span>
                  </div>

                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '8px' }}>
                    {order.items?.map((it, idx) => (
                      <div key={idx} style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                        {it.quantity}x {it.product_name}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleCompleteServe(order.id)}
                    className="btn-secondary"
                    style={{ width: '100%', padding: '8px', fontSize: '0.815rem' }}
                  >
                    Tandai Telah Diterima Tamu
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
