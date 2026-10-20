import React, { useState, useEffect } from 'react';
import { apiRequest, formatIDR, formatDate } from '../../lib/api';
import { Product, Category, DiningTable, Order, RestaurantSetting, CashShift } from '../../types';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  CheckCircle,
  CreditCard,
  QrCode,
  Banknote,
  Utensils,
  UtensilsCrossed,
  ShoppingBag,
  X,
  FileText,
  Wallet,
  AlertCircle,
  Coins,
} from 'lucide-react';

interface CartItem {
  product: Product;
  variantId?: number;
  variantName?: string;
  variantPriceAdjustment: number;
  addonIds: number[];
  addonNames: string[];
  addonPriceTotal: number;
  quantity: number;
  specialNotes?: string;
}

export const POSPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [settings, setSettings] = useState<RestaurantSetting | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway'>('dine_in');
  const [selectedTableId, setSelectedTableId] = useState<number | ''>('');
  const [customerName, setCustomerName] = useState('Pelanggan');

  // Modal states
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | undefined>();
  const [selectedAddonIds, setSelectedAddonIds] = useState<number[]>([]);
  const [itemNote, setItemNote] = useState('');

  // Checkout & Payment
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris'>('cash');
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Cash Shift States
  const [currentShift, setCurrentShift] = useState<CashShift | null>(null);
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
  const [shiftStartCash, setShiftStartCash] = useState<number>(100000);
  const [shiftNotes, setShiftNotes] = useState('');
  const [closeActualCash, setCloseActualCash] = useState<number>(0);
  const [closeNotes, setCloseNotes] = useState('');

  const fetchCurrentShift = async () => {
    const res = await apiRequest<CashShift>('/shifts/current');
    if (res.success) {
      setCurrentShift(res.data || null);
    }
  };

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiRequest('/shifts/open', {
      method: 'POST',
      body: JSON.stringify({ start_cash: shiftStartCash, notes: shiftNotes }),
    });
    if (res.success) {
      setIsOpenShiftModalOpen(false);
      fetchCurrentShift();
    } else {
      alert(res.message || 'Gagal membuka shift kasir.');
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiRequest('/shifts/close', {
      method: 'POST',
      body: JSON.stringify({ actual_cash: closeActualCash, notes: closeNotes }),
    });
    if (res.success) {
      setIsCloseShiftModalOpen(false);
      fetchCurrentShift();
      alert('Shift kasir berhasil ditutup.');
    } else {
      alert(res.message || 'Gagal menutup shift kasir.');
    }
  };

  // Load Initial Data
  useEffect(() => {
    async function initData() {
      const [prodRes, catRes, tabRes, setRes] = await Promise.all([
        apiRequest<Product[]>('/products?available_only=1'),
        apiRequest<Category[]>('/categories'),
        apiRequest<DiningTable[]>('/tables'),
        apiRequest<RestaurantSetting>('/settings'),
      ]);

      if (prodRes.success && prodRes.data) setProducts(prodRes.data);
      if (catRes.success && catRes.data) setCategories(catRes.data);
      if (setRes.success && setRes.data) setSettings(setRes.data);
      if (tabRes.success && tabRes.data) {
        setTables(tabRes.data);
        const avail = tabRes.data.find((t) => t.status === 'available');
        if (avail) setSelectedTableId(avail.id);
      }

      fetchCurrentShift();
    }

    initData();
  }, []);

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory ? p.category_id === selectedCategory : true;
    const matchesSearch = search ? p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()) : true;
    return matchesCat && matchesSearch;
  });

  // Open item customization or add direct
  const handleProductClick = (product: Product) => {
    if ((product.variants && product.variants.length > 0) || (product.addons && product.addons.length > 0)) {
      setCustomizingProduct(product);
      setSelectedVariantId(product.variants?.[0]?.id);
      setSelectedAddonIds([]);
      setItemNote('');
    } else {
      addToCart(product, undefined, [], '');
    }
  };

  const addToCart = (
    product: Product,
    variantId?: number,
    addonIds: number[] = [],
    specialNotes: string = ''
  ) => {
    const variant = product.variants?.find((v) => v.id === variantId);
    const variantAdj = variant ? variant.price_adjustment : 0;
    const variantName = variant ? variant.name : undefined;

    const addons = product.addons?.filter((a) => addonIds.includes(a.id)) || [];
    const addonPriceTotal = addons.reduce((sum, a) => sum + a.price, 0);
    const addonNames = addons.map((a) => a.name);

    setCart((prev) => {
      // Check if matching item already exists
      const existingIdx = prev.findIndex(
        (ci) =>
          ci.product.id === product.id &&
          ci.variantId === variantId &&
          JSON.stringify(ci.addonIds.sort()) === JSON.stringify(addonIds.sort()) &&
          ci.specialNotes === specialNotes
      );

      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += 1;
        return updated;
      }

      return [
        ...prev,
        {
          product,
          variantId,
          variantName,
          variantPriceAdjustment: variantAdj,
          addonIds,
          addonNames,
          addonPriceTotal,
          quantity: 1,
          specialNotes,
        },
      ];
    });

    setCustomizingProduct(null);
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart((prev) => {
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      updated[index].quantity = newQty;
      return updated;
    });
  };

  const removeItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  // Cart Totals
  const subtotal = cart.reduce((sum, item) => {
    const unitPrice = item.product.base_price + item.variantPriceAdjustment + item.addonPriceTotal;
    return sum + unitPrice * item.quantity;
  }, 0);

  const taxRate = settings && settings.is_tax_enabled ? settings.tax_rate : 0;
  const serviceRate = settings && settings.is_service_charge_enabled ? settings.service_charge_rate : 0;
  const taxAmount = Math.round((subtotal * taxRate) / 100);
  const serviceAmount = Math.round((subtotal * serviceRate) / 100);
  const totalAmount = subtotal + taxAmount + serviceAmount;

  // Checkout Submission
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);

    // 1. Create Order
    const orderPayload = {
      order_type: orderType,
      table_id: orderType === 'dine_in' ? selectedTableId || null : null,
      customer_name: customerName,
      items: cart.map((ci) => ({
        product_id: ci.product.id,
        variant_id: ci.variantId || null,
        addon_ids: ci.addonIds,
        quantity: ci.quantity,
        special_notes: ci.specialNotes || null,
      })),
    };

    const orderRes = await apiRequest<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderPayload),
    });

    if (!orderRes.success || !orderRes.data) {
      alert(orderRes.message || 'Gagal membuat pesanan.');
      setIsSubmitting(false);
      return;
    }

    const createdOrder = orderRes.data;

    // 2. Process Payment immediately in POS flow
    const payRes = await apiRequest(`/orders/${createdOrder.id}/pay`, {
      method: 'POST',
      body: JSON.stringify({
        payment_method: paymentMethod,
        amount_paid: paymentMethod === 'cash' ? (cashTendered || totalAmount) : totalAmount,
      }),
    });

    setIsSubmitting(false);
    setIsCheckoutOpen(false);

    if (payRes.success) {
      setCompletedOrder({
        ...createdOrder,
        total_amount: totalAmount,
        subtotal,
        tax_amount: taxAmount,
        service_charge_amount: serviceAmount,
        payment_status: 'paid',
        payment: {
          id: 1,
          order_id: createdOrder.id,
          payment_method: paymentMethod,
          amount_paid: paymentMethod === 'cash' ? (cashTendered || totalAmount) : totalAmount,
          change_amount: paymentMethod === 'cash' ? Math.max(0, (cashTendered || totalAmount) - totalAmount) : 0,
          status: 'paid',
        },
      });
      setCart([]);
      setIsReceiptOpen(true);
      fetchCurrentShift();
    } else {
      alert('Pesanan tersimpan namun pembayaran gagal: ' + payRes.message);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', height: 'calc(100vh - 110px)' }}>
      {/* Left: Product Catalog */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'hidden' }}>
        {/* Cash Shift Banner */}
        {currentShift ? (
          <div
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              backgroundColor: '#EAF5ED',
              border: '1px solid #B8DEC6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.815rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2D6A4F', fontWeight: 700 }}>
                <CheckCircle size={15} /> Shift Kasir Aktif
              </div>
              <div style={{ color: 'var(--color-neutral-gray)' }}>
                Modal Awal: <strong className="font-mono" style={{ color: 'var(--color-charcoal)' }}>{formatIDR(currentShift.start_cash)}</strong>
              </div>
              <div style={{ color: 'var(--color-neutral-gray)' }}>
                Penjualan Kas: <strong className="font-mono" style={{ color: '#2D6A4F' }}>{formatIDR(currentShift.cash_sales || 0)}</strong>
              </div>
              <div style={{ color: 'var(--color-neutral-gray)' }}>
                Target Kas Laci: <strong className="font-mono" style={{ color: 'var(--color-charcoal)' }}>{formatIDR(currentShift.expected_cash)}</strong>
              </div>
            </div>

            <button
              onClick={() => {
                setCloseActualCash(currentShift.expected_cash);
                setCloseNotes('');
                setIsCloseShiftModalOpen(true);
              }}
              className="btn-secondary"
              style={{ padding: '6px 14px', fontSize: '0.75rem', fontWeight: 700 }}
            >
              <Coins size={14} /> Tutup Shift Kasir
            </button>
          </div>
        ) : (
          <div
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              backgroundColor: '#FEF7EA',
              border: '1px solid #F6D8A8',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.815rem', color: '#B45309', fontWeight: 600 }}>
              <AlertCircle size={16} />
              <span>Shift Kasir Belum Dibuka. Buka shift sekarang untuk mencatat modal kasir dan omzet.</span>
            </div>
            <button
              onClick={() => {
                setShiftStartCash(100000);
                setShiftNotes('');
                setIsOpenShiftModalOpen(true);
              }}
              className="btn-primary"
              style={{ padding: '6px 14px', fontSize: '0.75rem' }}
            >
              <Wallet size={14} /> Buka Shift Kasir
            </button>
          </div>
        )}

        {/* Search & Categories Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <Search
              size={18}
              style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#8A8A83' }}
            />
            <input
              type="text"
              className="input-field"
              placeholder="Cari menu makanan atau minuman..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '42px' }}
            />
          </div>

          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            <button
              onClick={() => setSelectedCategory(null)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.815rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                backgroundColor: selectedCategory === null ? 'var(--color-forest-green)' : 'var(--color-white)',
                color: selectedCategory === null ? '#FFFFFF' : 'var(--color-charcoal)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              Semua Menu
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.815rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  backgroundColor: selectedCategory === c.id ? 'var(--color-forest-green)' : 'var(--color-white)',
                  color: selectedCategory === c.id ? '#FFFFFF' : 'var(--color-charcoal)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
            gap: '16px',
            alignContent: 'start',
            paddingRight: '4px',
          }}
        >
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              onClick={() => handleProductClick(p)}
              className="renato-card"
              style={{
                cursor: 'pointer',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                height: '240px',
              }}
            >
              <div style={{ height: '120px', width: '100%', position: 'relative', overflow: 'hidden' }}>
                <img
                  src={p.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'}
                  alt={p.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.onerror = null;
                    target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23F5F0E8'/%3E%3Ctext x='200' y='130' font-family='Arial' font-size='48' text-anchor='middle' fill='%23344C3D'%3E🍽%3C/text%3E%3Ctext x='200' y='180' font-family='Arial' font-size='14' text-anchor='middle' fill='%238A8A83'%3EGambar tidak tersedia%3C/text%3E%3C/svg%3E`;
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(37,37,34,0.75)',
                    color: '#FFFFFF',
                    fontSize: '0.675rem',
                    fontWeight: 600,
                  }}
                >
                  {p.prep_time_minutes}m
                </span>
              </div>

              <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-charcoal)', lineHeight: 1.25 }}>
                    {p.name}
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-gray)', display: 'block', marginTop: '2px' }}>
                    SKU: {p.sku}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <span className="font-mono" style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--color-forest-green)' }}>
                    {formatIDR(p.base_price)}
                  </span>
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-warm-cream)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-forest-green)',
                    }}
                  >
                    <Plus size={16} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Cart & Checkout Panel */}
      <div
        className="renato-card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
          backgroundColor: 'var(--color-white)',
        }}
      >
        {/* Cart Header & Order Type Switcher */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button
              onClick={() => setOrderType('dine_in')}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.815rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                backgroundColor: orderType === 'dine_in' ? 'var(--color-forest-green)' : 'var(--color-warm-cream)',
                color: orderType === 'dine_in' ? '#FFFFFF' : 'var(--color-charcoal)',
              }}
            >
              <Utensils size={15} />
              Dine-In
            </button>
            <button
              onClick={() => setOrderType('takeaway')}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.815rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                backgroundColor: orderType === 'takeaway' ? 'var(--color-forest-green)' : 'var(--color-warm-cream)',
                color: orderType === 'takeaway' ? '#FFFFFF' : 'var(--color-charcoal)',
              }}
            >
              <ShoppingBag size={15} />
              Takeaway
            </button>
          </div>

          {/* Table / Customer Details */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {orderType === 'dine_in' ? (
              <select
                className="input-field"
                value={selectedTableId}
                onChange={(e) => setSelectedTableId(Number(e.target.value))}
                style={{ flex: 1, padding: '7px 10px', fontSize: '0.815rem' }}
              >
                <option value="">Pilih Meja</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.table_number} ({t.status === 'occupied' ? 'Terisi' : 'Tersedia'} - {t.capacity} org)
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                className="input-field"
                placeholder="Nama Tamu"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                style={{ flex: 1, padding: '7px 10px', fontSize: '0.815rem' }}
              />
            )}
          </div>
        </div>

        {/* Cart Item List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {cart.length === 0 ? (
            <div
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-neutral-gray)',
                fontSize: '0.875rem',
                textAlign: 'center',
              }}
            >
              <UtensilsCrossed size={36} strokeWidth={1.5} style={{ marginBottom: '8px', opacity: 0.4 }} />
              Keranjang masih kosong.<br />Klik menu untuk menambahkan.
            </div>
          ) : (
            cart.map((item, idx) => {
              const itemTotal = (item.product.base_price + item.variantPriceAdjustment + item.addonPriceTotal) * item.quantity;
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-warm-cream)',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{item.product.name}</div>
                      {item.variantName && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-forest-green)', fontWeight: 500 }}>
                          Varian: {item.variantName}
                        </div>
                      )}
                      {item.addonNames.length > 0 && (
                        <div style={{ fontSize: '0.75rem', color: '#8C6D37' }}>
                          Add-on: {item.addonNames.join(', ')}
                        </div>
                      )}
                      {item.specialNotes && (
                        <div style={{ fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--color-neutral-gray)' }}>
                          "{item.specialNotes}"
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(idx)}
                      style={{ background: 'none', border: 'none', color: '#B91C1C', cursor: 'pointer', padding: '2px' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <div className="font-mono" style={{ fontSize: '0.875rem', fontWeight: 700 }}>
                      {formatIDR(itemTotal)}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => updateQuantity(idx, -1)}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          border: '1px solid var(--color-border)',
                          background: '#FFFFFF',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Minus size={13} />
                      </button>
                      <span className="font-mono" style={{ fontSize: '0.875rem', fontWeight: 700, minWidth: '18px', textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(idx, 1)}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          border: '1px solid var(--color-border)',
                          background: '#FFFFFF',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Cart Summary & Pay Button */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--color-border)', backgroundColor: '#FAF9F5' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.815rem', marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Subtotal:</span>
              <span className="font-mono">{formatIDR(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">PB1 Resto (10%):</span>
              <span className="font-mono">{formatIDR(taxAmount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Service Charge (5%):</span>
              <span className="font-mono">{formatIDR(serviceAmount)}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1.05rem',
                fontWeight: 700,
                paddingTop: '6px',
                borderTop: '1px dashed var(--color-border)',
                color: 'var(--color-charcoal)',
              }}
            >
              <span>Total Akhir:</span>
              <span className="font-mono" style={{ color: 'var(--color-forest-green)' }}>
                {formatIDR(totalAmount)}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              setCashTendered(totalAmount);
              setIsCheckoutOpen(true);
            }}
            disabled={cart.length === 0}
            className="btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
          >
            Lanjut ke Pembayaran • {formatIDR(totalAmount)}
          </button>
        </div>
      </div>

      {/* Product Customization Modal (Variants & Addons) */}
      {customizingProduct && (
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
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{customizingProduct.name}</h3>
              <button
                onClick={() => setCustomizingProduct(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-neutral-gray)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Variants */}
            {customizingProduct.variants && customizingProduct.variants.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '8px' }}>
                  Pilih Varian
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {customizingProduct.variants.map((v) => (
                    <label
                      key={v.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: selectedVariantId === v.id ? '2px solid var(--color-forest-green)' : '1px solid var(--color-border)',
                        backgroundColor: selectedVariantId === v.id ? 'var(--color-forest-light)' : 'transparent',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="radio"
                          name="variant"
                          checked={selectedVariantId === v.id}
                          onChange={() => setSelectedVariantId(v.id)}
                        />
                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{v.name}</span>
                      </div>
                      <span className="font-mono" style={{ fontSize: '0.815rem', color: 'var(--color-forest-green)' }}>
                        {v.price_adjustment > 0 ? `+${formatIDR(v.price_adjustment)}` : 'Gratis'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Addons */}
            {customizingProduct.addons && customizingProduct.addons.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '8px' }}>
                  Topping / Add-on
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {customizingProduct.addons.map((a) => (
                    <label
                      key={a.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: selectedAddonIds.includes(a.id) ? '2px solid #C5A46D' : '1px solid var(--color-border)',
                        backgroundColor: selectedAddonIds.includes(a.id) ? 'var(--color-muted-gold-light)' : 'transparent',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          checked={selectedAddonIds.includes(a.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAddonIds([...selectedAddonIds, a.id]);
                            } else {
                              setSelectedAddonIds(selectedAddonIds.filter((id) => id !== a.id));
                            }
                          }}
                        />
                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{a.name}</span>
                      </div>
                      <span className="font-mono" style={{ fontSize: '0.815rem', color: '#8C6D37' }}>
                        +{formatIDR(a.price)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Special Notes */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                Catatan Khusus (Opsional)
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Cth: Sambal dipisah, jangan pakai bawang"
                value={itemNote}
                onChange={(e) => setItemNote(e.target.value)}
              />
            </div>

            <button
              onClick={() => addToCart(customizingProduct, selectedVariantId, selectedAddonIds, itemNote)}
              className="btn-primary"
              style={{ width: '100%', padding: '11px' }}
            >
              Tambahkan ke Keranjang
            </button>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
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
          <div className="renato-card" style={{ width: '100%', maxWidth: '480px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Pembayaran Transaksi</h3>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-neutral-gray)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Total Display */}
            <div
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: 'var(--color-warm-cream)',
                textAlign: 'center',
                marginBottom: '20px',
              }}
            >
              <div style={{ fontSize: '0.815rem', color: 'var(--color-neutral-gray)', marginBottom: '4px' }}>
                Total Yang Harus Dibayar
              </div>
              <div className="font-mono" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-forest-green)' }}>
                {formatIDR(totalAmount)}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button
                onClick={() => setPaymentMethod('cash')}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: paymentMethod === 'cash' ? '2px solid var(--color-forest-green)' : '1px solid var(--color-border)',
                  backgroundColor: paymentMethod === 'cash' ? 'var(--color-forest-light)' : 'transparent',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                <Banknote size={24} color="var(--color-forest-green)" />
                <span>Tunai (Cash)</span>
              </button>
              <button
                onClick={() => setPaymentMethod('qris')}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: paymentMethod === 'qris' ? '2px solid var(--color-forest-green)' : '1px solid var(--color-border)',
                  backgroundColor: paymentMethod === 'qris' ? 'var(--color-forest-light)' : 'transparent',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                <QrCode size={24} color="var(--color-forest-green)" />
                <span>QRIS Instant</span>
              </button>
            </div>

            {/* Cash Input */}
            {paymentMethod === 'cash' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                    Nominal Uang Diterima (Rp)
                  </label>
                  <input
                    type="number"
                    className="input-field font-mono"
                    style={{ fontSize: '1.125rem', fontWeight: 700 }}
                    value={cashTendered || ''}
                    onChange={(e) => setCashTendered(Number(e.target.value))}
                  />
                </div>

                {/* Quick Cash Buttons */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setCashTendered(totalAmount)}
                    className="btn-secondary"
                    style={{ flex: 1, padding: '6px', fontSize: '0.75rem' }}
                  >
                    Uang Pas
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashTendered(50000)}
                    className="btn-secondary"
                    style={{ flex: 1, padding: '6px', fontSize: '0.75rem' }}
                  >
                    50.000
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashTendered(100000)}
                    className="btn-secondary"
                    style={{ flex: 1, padding: '6px', fontSize: '0.75rem' }}
                  >
                    100.000
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashTendered(200000)}
                    className="btn-secondary"
                    style={{ flex: 1, padding: '6px', fontSize: '0.75rem' }}
                  >
                    200.000
                  </button>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-warm-cream)',
                    fontWeight: 600,
                  }}
                >
                  <span>Kembalian:</span>
                  <span className="font-mono" style={{ color: cashTendered >= totalAmount ? '#2D6A4F' : '#B91C1C' }}>
                    {formatIDR(Math.max(0, cashTendered - totalAmount))}
                  </span>
                </div>
              </div>
            ) : (
              /* QRIS DANA Bisnis View */
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: '#F0F7FF',
                  border: '1.5px solid #BEDBFE',
                  marginBottom: '20px',
                  gap: '8px',
                }}
              >
                {/* DANA Bisnis Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', borderBottom: '1px solid #DBEAFE', paddingBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ backgroundColor: '#118EEA', color: '#FFFFFF', fontWeight: 800, fontSize: '0.725rem', padding: '2px 8px', borderRadius: '4px' }}>
                      DANA
                    </span>
                    <span style={{ fontSize: '0.815rem', fontWeight: 700, color: '#1E40AF' }}>
                      QRIS DANA Bisnis
                    </span>
                  </div>
                  <span className="font-mono" style={{ fontSize: '0.7rem', color: '#3B82F6', fontWeight: 600 }}>
                    NMID: {settings?.qris_nmid || 'ID1020268899001'}
                  </span>
                </div>

                <div style={{ fontSize: '0.815rem', fontWeight: 700, color: '#1E3A8A', marginTop: '2px' }}>
                  {settings?.qris_merchant_name || 'Renato Kitchen - DANA Bisnis'}
                </div>

                {/* QR Code Container */}
                <div
                  style={{
                    padding: '8px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #BFDBFE',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(17,142,234,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={
                      settings?.qris_image_url ||
                      `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=00020101021126580014ID.DANA.WWW01189360091100202688995204581253033605802ID5919RENATO+KITCHEN+DANA6007JAKARTA61051219062070703A01630489AB`
                    }
                    alt="QRIS DANA Renato Kitchen"
                    style={{ width: '170px', height: '170px', display: 'block' }}
                  />
                </div>

                <div className="font-mono" style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1E40AF', marginTop: '2px' }}>
                  {formatIDR(totalAmount)}
                </div>

                <div style={{ fontSize: '0.725rem', color: '#4B5563', textAlign: 'center', lineHeight: 1.3 }}>
                  Pindai dengan aplikasi <strong>DANA</strong> atau aplikasi perbankan/e-wallet berlogo QRIS
                </div>
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={isSubmitting || (paymentMethod === 'cash' && cashTendered < totalAmount)}
              className="btn-primary"
              style={{ width: '100%', padding: '12px' }}
            >
              {isSubmitting ? 'Memproses Transaksi...' : 'Konfirmasi & Selesaikan Transaksi'}
            </button>
          </div>
        </div>
      )}

      {/* Printable Thermal Receipt Modal (58mm/80mm format) */}
      {isReceiptOpen && completedOrder && (
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
          <div
            className="renato-card"
            style={{
              width: '100%',
              maxWidth: '380px',
              backgroundColor: '#FFFFFF',
              padding: '24px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <button onClick={() => window.print()} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.815rem' }}>
                <Printer size={15} /> Cetak Struk
              </button>
              <button
                onClick={() => setIsReceiptOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-neutral-gray)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Thermal Receipt Paper */}
            <div
              id="thermal-receipt"
              style={{
                border: '1px dashed #D1CBBF',
                padding: '20px 16px',
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                color: '#111111',
                lineHeight: 1.4,
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>RENATO KITCHEN / RESTO</div>
                <div>Jl. Boulevard Kuliner No. 88</div>
                <div>Jakarta Selatan • Telp: 0812-3456-7890</div>
              </div>

              <div style={{ borderBottom: '1px dashed #111', paddingBottom: '6px', marginBottom: '6px' }}>
                <div>No: {completedOrder.order_number}</div>
                <div>Waktu: {formatDate(completedOrder.created_at)}</div>
                <div>Tipe: {completedOrder.order_type.toUpperCase()} {completedOrder.table_id ? `(Meja ${completedOrder.table_id})` : ''}</div>
                <div>Tamu: {completedOrder.customer_name}</div>
              </div>

              {/* Items */}
              <div style={{ borderBottom: '1px dashed #111', paddingBottom: '8px', marginBottom: '8px' }}>
                {completedOrder.items?.map((item, idx) => (
                  <div key={idx} style={{ marginBottom: '6px' }}>
                    <div style={{ fontWeight: 600 }}>{item.product_name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>
                        {item.quantity} x {formatIDR(item.unit_price)}
                      </span>
                      <span>{formatIDR(item.subtotal)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financials */}
              <div style={{ borderBottom: '1px dashed #111', paddingBottom: '8px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal:</span>
                  <span>{formatIDR(completedOrder.subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>PB1 (10%):</span>
                  <span>{formatIDR(completedOrder.tax_amount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Service (5%):</span>
                  <span>{formatIDR(completedOrder.service_charge_amount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.85rem', marginTop: '4px' }}>
                  <span>TOTAL:</span>
                  <span>{formatIDR(completedOrder.total_amount)}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div style={{ borderBottom: '1px dashed #111', paddingBottom: '8px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Metode:</span>
                  <span>{completedOrder.payment?.payment_method?.toUpperCase()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Dibayar:</span>
                  <span>{formatIDR(completedOrder.payment?.amount_paid || completedOrder.total_amount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Kembalian:</span>
                  <span>{formatIDR(completedOrder.payment?.change_amount || 0)}</span>
                </div>
              </div>

              <div style={{ textAlign: 'center', fontSize: '0.7rem' }}>
                Terima kasih atas kunjungan Anda di Renato Kitchen!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Buka Shift Kasir */}
      {isOpenShiftModalOpen && (
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
          <div className="renato-card" style={{ width: '100%', maxWidth: '420px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wallet size={20} color="#2D6A4F" />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>Buka Shift Kasir Baru</h3>
              </div>
              <button onClick={() => setIsOpenShiftModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleOpenShift} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                  Modal Awal Laci Kasir / Float (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  className="input-field font-mono"
                  value={shiftStartCash || ''}
                  onChange={(e) => setShiftStartCash(Number(e.target.value))}
                  required
                  placeholder="Cth: 100000"
                />
                <span style={{ fontSize: '0.725rem', color: 'var(--color-neutral-gray)', marginTop: '4px', display: 'block' }}>
                  Uang kembalian yang dimasukkan ke laci kasir saat awal shift kerja.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                  Catatan Pembukaan Shift (Opsional)
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Cth: Shift Pagi Kasir Siti Rahma"
                  value={shiftNotes}
                  onChange={(e) => setShiftNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsOpenShiftModalOpen(false)}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '10px' }}
                >
                  Batal
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 2, padding: '10px' }}>
                  Buka Shift Kasir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tutup Shift Kasir & Rekonsiliasi Kas */}
      {isCloseShiftModalOpen && currentShift && (
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Coins size={20} color="#C5A46D" />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>Tutup Shift & Rekonsiliasi Kas</h3>
              </div>
              <button onClick={() => setIsCloseShiftModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Shift Breakdown */}
            <div style={{ backgroundColor: 'var(--color-warm-cream)', padding: '14px', borderRadius: '8px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.815rem' }}>
                <span style={{ color: 'var(--color-neutral-gray)' }}>Modal Awal Laci:</span>
                <span className="font-mono" style={{ fontWeight: 600 }}>{formatIDR(currentShift.start_cash)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.815rem' }}>
                <span style={{ color: 'var(--color-neutral-gray)' }}>Total Penjualan Tunai di Shift:</span>
                <span className="font-mono" style={{ fontWeight: 600, color: '#2D6A4F' }}>
                  +{formatIDR(currentShift.cash_sales || 0)}
                </span>
              </div>
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700 }}>
                <span>Estimasi Seharusnya di Laci:</span>
                <span className="font-mono">{formatIDR(currentShift.expected_cash)}</span>
              </div>
            </div>

            <form onSubmit={handleCloseShift} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                  Hitung Uang Fisik Riil di Laci (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  className="input-field font-mono"
                  value={closeActualCash || ''}
                  onChange={(e) => setCloseActualCash(Number(e.target.value))}
                  required
                  placeholder="0"
                />
              </div>

              {/* Discrepancy feedback */}
              {(() => {
                const diff = closeActualCash - currentShift.expected_cash;
                if (diff === 0) {
                  return (
                    <div style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: '#EAF5ED', color: '#2D6A4F', fontSize: '0.815rem', fontWeight: 600 }}>
                      ✅ Kas Pas! Tidak ada selisih uang fisik dengan sistem.
                    </div>
                  );
                } else if (diff > 0) {
                  return (
                    <div style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: '#FEF7EA', color: '#B45309', fontSize: '0.815rem', fontWeight: 600 }}>
                      ⚠️ Selisih Lebih: +{formatIDR(diff)} (Uang fisik lebih banyak dari sistem)
                    </div>
                  );
                } else {
                  return (
                    <div style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: '#FDF2F2', color: '#B91C1C', fontSize: '0.815rem', fontWeight: 600 }}>
                      ❌ Selisih Kurang: {formatIDR(diff)} (Uang fisik kurang dari sistem)
                    </div>
                  );
                }
              })()}

              <div>
                <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                  Catatan Serah Terima Kasir
                </label>
                <textarea
                  className="input-field"
                  rows={2}
                  placeholder="Cth: Uang pecahan koin diserahkan ke kasir shift sore..."
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsCloseShiftModalOpen(false)}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '10px' }}
                >
                  Batal
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 2, padding: '10px' }}>
                  Konfirmasi & Tutup Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
