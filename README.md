# Renato Kitchen & Resto Management System

Sistem Manajemen Terintegrasi Restoran & Kitchen modern berbasis web yang dibangun dengan Laravel (Backend API) dan React + Vite + TypeScript (Frontend).

---

## 🚀 Fitur Utama

- **Point of Sale (POS) & Kasir**: Pemesanan instan, pencatatan pembayaran (Cash, Transfer, QRIS Dinamis/Statis), cetak struk, dan perhitungan kembalian.
- **Dapur & KDS (Kitchen Display System)**: Tampilan pesanan dapur realtime dengan status antrean, proses masak, dan siap saji.
- **Pemesanan Mandiri Pelanggan (Online Ordering)**: Pelanggan dapat memesan langsung dari meja menggunakan QR code/web dengan integrasi pembayaran QRIS.
- **Manajemen Inventaris & Resep**:
  - Pelacakan stok bahan baku realtime.
  - Pengurangan stok otomatis berdasarkan resep tiap pesanan.
  - Stock Opname & penyesuaian inventaris.
  - Pembelian & Manajemen Supplier (Purchase Orders).
- **Laporan Finansial & Operasional**:
  - Laporan penjualan, laba rugi, dan margin.
  - Pencatatan & edit pengeluaran operasional (Expenses).
  - Ringkasan shift kasir & audit log.
- **Role-Based Access Control (RBAC)**:
  - Role: **Owner**, **Manager**, **Cashier**, **Kitchen**, **Inventory**.
  - Akses fitur dibatasi sesuai otorisasi role masing-masing untuk menjaga keamanan dan akuntabilitas data.

---

## 🛠️ Tech Stack

### Backend
- **Framework**: Laravel 11 / PHP 8.2+
- **Authentication**: Laravel Sanctum
- **Database**: SQLite / MySQL
- **Architecture**: RESTful API Controller & Resource Models

### Frontend
- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS & Lucide Icons
- **State Management**: React Context & Hooks
- **HTTP Client**: Axios

---

## ⚙️ Panduan Instalasi & Menjalankan Lokal

### 1. Clone Repository
```bash
git clone https://github.com/tonnyheru/renato-kitchen-resto.git
cd renato-kitchen-resto
```

### 2. Setup Backend (Laravel)
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve --port=8000
```

### 3. Setup Frontend (React + Vite)
Buka terminal baru:
```bash
cd frontend
npm install
npm run dev
```
Buka browser di `http://localhost:5173` atau port yang ditampilkan Vite.

---

## 🔐 Akun Default Demo (Hasil Seeder)

| Role | Email | Password |
|---|---|---|
| **Owner** | `owner@renato.id` | `password123` |
| **Manager** | `manager@renato.id` | `password123` |
| **Kasir** | `cashier@renato.id` | `password123` |
| **Dapur / Kitchen** | `kitchen@renato.id` | `password123` |
| **Inventaris** | `inventory@renato.id` | `password123` |

---

## 📄 Lisensi
Distributed under the MIT License.
