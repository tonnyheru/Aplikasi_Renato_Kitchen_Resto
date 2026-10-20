import React, { useState, useEffect } from 'react';
import { apiRequest, formatIDR } from '../../lib/api';
import { Product, Category, DiningTable } from '../../types';
import { BrandLogo } from '../../components/shared/BrandLogo';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  QrCode,
  Utensils,
  X,
  Search,
} from 'lucide-react';

export const PublicOnlineOrderingPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway'>('dine_in');
  const [tableId, setTableId] = useState<number | ''>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderPlaced, setOrderPlaced] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadPublicData() {
      const [pRes, cRes, tRes] = await Promise.all([
        apiRequest<Product[]>('/products?available_only=1'),
        apiRequest<Category[]>('/categories'),
        apiRequest<DiningTable[]>('/tables'),
      ]);
      if (pRes.success && pRes.data) setProducts(pRes.data);
      if (cRes.success && cRes.data) setCategories(cRes.data);
      if (tRes.success && tRes.data) setTables(tRes.data);
    }
    loadPublicData();
  }, []);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.product.id === product.id);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx].quantity += 1;
        return copy;
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) => {
      const copy = [...prev];
      const idx = copy.findIndex((i) => i.product.id === productId);
      if (idx > -1) {
        copy[idx].quantity += delta;
        if (copy[idx].quantity <= 0) {
          return copy.filter((i) => i.product.id !== productId);
        }
      }
      return copy;
    });
  };

  const subtotal = cart.reduce((sum, i) => sum + i.product.base_price * i.quantity, 0);
  const tax = Math.round(subtotal * 0.10);
  const service = Math.round(subtotal * 0.05);
  const total = subtotal + tax + service;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || !customerName) return;
    setIsSubmitting(true);

    const payload = {
      order_type: orderType,
      table_id: orderType === 'dine_in' ? tableId || null : null,
      customer_name: customerName,
      customer_phone: customerPhone,
      items: cart.map((i) => ({
        product_id: i.product.id,
        quantity: i.quantity,
      })),
    };

    const res = await apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    setIsSubmitting(false);
    if (res.success && res.data) {
      setOrderPlaced(res.data);
      setCart([]);
      setIsCartOpen(false);
    } else {
      alert(res.message || 'Gagal memproses pesanan online.');
    }
  };

  const filtered = selectedCat
    ? products.filter((p) => p.category_id === selectedCat)
    : products;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-warm-cream)', paddingBottom: '90px' }}>
      {/* Top Banner */}
      <header
        style={{
          backgroundColor: 'var(--color-charcoal)',
          color: '#FFFFFF',
          padding: '16px 20px',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <BrandLogo light />
          <button
            onClick={() => setIsCartOpen(true)}
            style={{
              backgroundColor: 'var(--color-forest-green)',
              color: '#FFFFFF',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.815rem',
            }}
          >
            <ShoppingBag size={16} />
            <span>{cart.reduce((s, i) => s + i.quantity, 0)} Item</span>
          </button>
        </div>
      </header>

      {/* Hero Welcome */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 20px 12px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-charcoal)' }}>
          Selamat Datang di Renato Kitchen
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-neutral-gray)', marginTop: '4px' }}>
          Silakan pesan hidangan favorit Anda secara langsung dari meja atau untuk takeaway
        </p>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '16px 0 8px' }}>
          <button
            onClick={() => setSelectedCat(null)}
            style={{
              padding: '8px 16px',
              borderRadius: '9999px',
              border: 'none',
              fontSize: '0.815rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              backgroundColor: selectedCat === null ? 'var(--color-forest-green)' : 'var(--color-white)',
              color: selectedCat === null ? '#FFFFFF' : 'var(--color-charcoal)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            Semua Menu
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCat(c.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '9999px',
                border: 'none',
                fontSize: '0.815rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                backgroundColor: selectedCat === c.id ? 'var(--color-forest-green)' : 'var(--color-white)',
                color: selectedCat === c.id ? '#FFFFFF' : 'var(--color-charcoal)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
          {filtered.map((p) => (
            <div key={p.id} className="renato-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <img
                src={p.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'}
                alt={p.name}
                style={{ width: '100%', height: '140px', objectFit: 'cover' }}
                onError={(e) => {
                  const t = e.currentTarget;
                  t.onerror = null;
                  t.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='280' viewBox='0 0 400 280'%3E%3Crect width='400' height='280' fill='%23F5F0E8'/%3E%3Ctext x='200' y='120' font-family='Arial' font-size='52' text-anchor='middle' fill='%23344C3D'%3E\ud83c\udf7d%3C/text%3E%3Ctext x='200' y='168' font-family='Arial' font-size='14' text-anchor='middle' fill='%238A8A83'%3EGambar tidak tersedia%3C/text%3E%3C/svg%3E`;
                }}
              />
              <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>{p.name}</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-neutral-gray)', marginTop: '4px', lineHeight: 1.35 }}>
                    {p.description}
                  </p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                  <span className="font-mono" style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-forest-green)' }}>
                    {formatIDR(p.base_price)}
                  </span>
                  <button
                    onClick={() => addToCart(p)}
                    className="btn-primary"
                    style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                  >
                    <Plus size={14} /> Tambah
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Cart Drawer / Bottom Sheet */}
      {isCartOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            className="renato-card"
            style={{
              width: '100%',
              maxWidth: '500px',
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>Pesanan Anda</h3>
              <button onClick={() => setIsCartOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCheckout} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', gap: '16px' }}>
              {/* Order Type & Table */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setOrderType('dine_in')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.815rem',
                    backgroundColor: orderType === 'dine_in' ? 'var(--color-forest-green)' : 'var(--color-warm-cream)',
                    color: orderType === 'dine_in' ? '#FFFFFF' : 'var(--color-charcoal)',
                  }}
                >
                  Dine-In
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('takeaway')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.815rem',
                    backgroundColor: orderType === 'takeaway' ? 'var(--color-forest-green)' : 'var(--color-warm-cream)',
                    color: orderType === 'takeaway' ? '#FFFFFF' : 'var(--color-charcoal)',
                  }}
                >
                  Takeaway
                </button>
              </div>

              {orderType === 'dine_in' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>
                    Nomor Meja
                  </label>
                  <select
                    className="input-field"
                    value={tableId}
                    onChange={(e) => setTableId(Number(e.target.value))}
                    required
                  >
                    <option value="">Pilih Nomor Meja</option>
                    {tables.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.table_number}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>
                  Nama Pemesan
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Nama Anda"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>

              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      backgroundColor: 'var(--color-warm-cream)',
                      borderRadius: '8px',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.product.name}</div>
                      <div className="font-mono text-muted" style={{ fontSize: '0.75rem' }}>
                        {formatIDR(item.product.base_price)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      >
                        -
                      </button>
                      <span className="font-mono" style={{ fontWeight: 700 }}>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Breakdown */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.815rem' }}>
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatIDR(subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.815rem' }}>
                  <span>Pajak Restoran (10%):</span>
                  <span className="font-mono">{formatIDR(tax)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.815rem' }}>
                  <span>Service Charge (5%):</span>
                  <span className="font-mono">{formatIDR(service)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem', fontWeight: 800, marginTop: '6px' }}>
                  <span>Total:</span>
                  <span className="font-mono" style={{ color: 'var(--color-forest-green)' }}>
                    {formatIDR(total)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || cart.length === 0}
                className="btn-primary"
                style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
              >
                {isSubmitting ? 'Memproses Pesanan...' : `Pesan Sekarang • ${formatIDR(total)}`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Order Confirmed Banner */}
      {orderPlaced && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 120,
            padding: '20px',
          }}
        >
          <div className="renato-card" style={{ width: '100%', maxWidth: '420px', padding: '28px', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--status-success-bg)', color: '#2D6A4F', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Pesanan Berhasil Terkirim!</h3>
            <p style={{ fontSize: '0.815rem', color: 'var(--color-neutral-gray)', marginTop: '4px' }}>
              Pesanan Anda telah diteruskan ke dapur Renato Kitchen.
            </p>

            <div style={{ backgroundColor: 'var(--color-warm-cream)', padding: '14px', borderRadius: '8px', margin: '20px 0' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-gray)' }}>Nomor Pesanan</div>
              <div className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-forest-green)' }}>
                {orderPlaced.order_number}
              </div>
            </div>

            <button
              onClick={() => setOrderPlaced(null)}
              className="btn-primary"
              style={{ width: '100%', padding: '10px' }}
            >
              Kembali ke Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
