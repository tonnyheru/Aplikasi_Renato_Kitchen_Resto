import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api';
import { RestaurantSetting } from '../../types';
import { Settings, Save, CheckCircle, QrCode, Sparkles } from 'lucide-react';

export const RestaurantSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<RestaurantSetting | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [taxRate, setTaxRate] = useState<number>(10);
  const [serviceChargeRate, setServiceChargeRate] = useState<number>(5);
  const [isTaxEnabled, setIsTaxEnabled] = useState(true);
  const [isServiceEnabled, setIsServiceEnabled] = useState(true);
  const [receiptFooter, setReceiptFooter] = useState('');

  // QRIS Settings
  const [qrisProvider, setQrisProvider] = useState('dana');
  const [qrisType, setQrisType] = useState<'static' | 'dynamic'>('static');
  const [qrisMerchantName, setQrisMerchantName] = useState('Renato Kitchen - DANA Bisnis');
  const [qrisNmid, setQrisNmid] = useState('ID1020268899001');
  const [qrisImageUrl, setQrisImageUrl] = useState('');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      const res = await apiRequest<RestaurantSetting>('/settings');
      if (res.success && res.data) {
        setSettings(res.data);
        setName(res.data.name);
        setPhone(res.data.phone);
        setEmail(res.data.email);
        setAddress(res.data.address || '');
        setTaxRate(res.data.tax_rate);
        setServiceChargeRate(res.data.service_charge_rate);
        setIsTaxEnabled(res.data.is_tax_enabled);
        setIsServiceEnabled(res.data.is_service_charge_enabled);
        setReceiptFooter(res.data.receipt_footer);

        setQrisProvider(res.data.qris_provider || 'dana');
        setQrisType(res.data.qris_type || 'static');
        setQrisMerchantName(res.data.qris_merchant_name || 'Renato Kitchen - DANA Bisnis');
        setQrisNmid(res.data.qris_nmid || 'ID1020268899001');
        setQrisImageUrl(res.data.qris_image_url || '');
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSavedSuccess(false);

    const res = await apiRequest('/settings', {
      method: 'PUT',
      body: JSON.stringify({
        name,
        phone,
        email,
        address,
        tax_rate: taxRate,
        service_charge_rate: serviceChargeRate,
        is_tax_enabled: isTaxEnabled,
        is_service_charge_enabled: isServiceEnabled,
        receipt_footer: receiptFooter,
        qris_provider: qrisProvider,
        qris_type: qrisType,
        qris_merchant_name: qrisMerchantName,
        qris_nmid: qrisNmid,
        qris_image_url: qrisImageUrl,
      }),
    });

    setLoading(false);
    if (res.success) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } else {
      alert(res.message || 'Gagal menyimpan pengaturan.');
    }
  };

  return (
    <div style={{ maxWidth: '860px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>
          Pengaturan Restoran & Sistem Pembayaran
        </h2>
        <p style={{ fontSize: '0.815rem', color: 'var(--color-neutral-gray)', marginTop: '2px' }}>
          Atur informasi resto, konfigurasi QRIS DANA Bisnis, tarif pajak PB1, dan footer struk
        </p>
      </div>

      {savedSuccess && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--status-success-bg)',
            color: 'var(--status-success-text)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          <CheckCircle size={18} />
          Pengaturan restoran dan QRIS berhasil diperbarui!
        </div>
      )}

      <form onSubmit={handleSave} className="renato-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Section 1: Business Profile */}
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' }}>
            Informasi Profil Restoran
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                Nama Restoran
              </label>
              <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                Nomor Telepon
              </label>
              <input type="text" className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                Email Resto
              </label>
              <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                Alamat Lengkap
              </label>
              <input type="text" className="input-field" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Section 2: QRIS Configuration (DANA BISNIS) */}
        <div style={{ backgroundColor: '#F0F7FF', padding: '20px', borderRadius: '10px', border: '1.5px solid #BEDBFE' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#118EEA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
              <QrCode size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1E40AF' }}>
                Konfigurasi Pembayaran QRIS (DANA Bisnis)
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#3B82F6' }}>
                Ganti dan hubungkan kode QRIS dengan akun DANA Bisnis resmi restoran Anda
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                Penyedia QRIS
              </label>
              <select
                className="input-field"
                value={qrisProvider}
                onChange={(e) => setQrisProvider(e.target.value)}
                style={{ fontWeight: 600 }}
              >
                <option value="dana">DANA Bisnis (Merchant Resmi)</option>
                <option value="bca">QRIS Bank BCA Merchant</option>
                <option value="gopay">GoPay / Midtrans QRIS</option>
                <option value="xendit">Xendit Dynamic QRIS</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                Metode Operasional QRIS
              </label>
              <select
                className="input-field"
                value={qrisType}
                onChange={(e) => setQrisType(e.target.value as any)}
                style={{ fontWeight: 600 }}
              >
                <option value="static">QRIS DANA Statis (Stiker / Gambar QR Toko)</option>
                <option value="dynamic">QRIS DANA Dinamis (Nominal Otomatis via API)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                Nama Merchant DANA (Tercetak di QR)
              </label>
              <input
                type="text"
                className="input-field"
                value={qrisMerchantName}
                onChange={(e) => setQrisMerchantName(e.target.value)}
                placeholder="Cth: Renato Kitchen - DANA Bisnis"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                NMID DANA (National Merchant ID)
              </label>
              <input
                type="text"
                className="input-field font-mono"
                value={qrisNmid}
                onChange={(e) => setQrisNmid(e.target.value)}
                placeholder="ID1020268899001"
              />
            </div>
          </div>

          <div style={{ marginTop: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
              URL Gambar QR Code DANA Bisnis Anda (Opsional)
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                className="input-field"
                value={qrisImageUrl}
                onChange={(e) => setQrisImageUrl(e.target.value)}
                placeholder="https://... atau biarkan kosong untuk menggunakan template DANA default"
              />
              <button
                type="button"
                onClick={() => setQrisImageUrl('https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=00020101021126580014ID.DANA.WWW01189360091100202688995204581253033605802ID5919RENATO+KITCHEN+DANA6007JAKARTA61051219062070703A01630489AB')}
                className="btn-secondary"
                style={{ whiteSpace: 'nowrap', fontSize: '0.75rem', padding: '8px 12px' }}
              >
                Gunakan Contoh DANA
              </button>
            </div>
            <p style={{ fontSize: '0.725rem', color: '#4B5563', marginTop: '4px' }}>
              💡 Pelanggan dapat memindai QRIS ini dari aplikasi <strong>DANA</strong>, BCA, GoPay, OVO, ShopeePay, atau bank mana saja yang mendukung QRIS.
            </p>
          </div>
        </div>

        {/* Section 3: Tax & Service Charge */}
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' }}>
            Pajak Restoran & Biaya Layanan
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                <input type="checkbox" checked={isTaxEnabled} onChange={(e) => setIsTaxEnabled(e.target.checked)} />
                Aktifkan Pajak PB1 (%)
              </label>
              <input
                type="number"
                className="input-field font-mono"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                disabled={!isTaxEnabled}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
                <input type="checkbox" checked={isServiceEnabled} onChange={(e) => setIsServiceEnabled(e.target.checked)} />
                Aktifkan Service Charge (%)
              </label>
              <input
                type="number"
                className="input-field font-mono"
                value={serviceChargeRate}
                onChange={(e) => setServiceChargeRate(Number(e.target.value))}
                disabled={!isServiceEnabled}
              />
            </div>
          </div>
        </div>

        {/* Section 4: Receipt Footer */}
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' }}>
            Format Struk Kasir
          </h3>

          <div style={{ marginTop: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.815rem', fontWeight: 600, marginBottom: '6px' }}>
              Pesan Penutup Struk Thermal
            </label>
            <input
              type="text"
              className="input-field"
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '12px 24px', alignSelf: 'flex-start', marginTop: '8px' }}>
          <Save size={16} /> {loading ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}
        </button>
      </form>
    </div>
  );
};
