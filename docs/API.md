# API DOCUMENTATION — ADMS QRIS INTERNAL

Seluruh endpoint API mengembalikan format JSON standar:
- **Success**: `{ "success": true, "message": "...", "data": { ... } }`
- **Error**: `{ "success": false, "message": "...", "errors": [ ... ] }`

---

## 1. Auth API
### `POST /api/auth/login`
- **Request Body**:
  ```json
  {
    "email": "admin@admsqris.local",
    "password": "Admin123!"
  }
  ```
- **Response Data**: `{ "user": { "id": 1, "name": "...", "role": "ADMIN" }, "token": "JWT_TOKEN_STRING" }`

### `GET /api/auth/me`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Response Data**: Detail profil pengguna saat ini.

### `POST /api/auth/logout`
- **Headers**: `Authorization: Bearer <TOKEN>`

---

## 2. Transactions API
### `GET /api/transactions/dashboard`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Response Data**: Ringkasan statistik (total transaksi, total nominal, berhasil, pending, gagal), grafik 7 hari terakhir, dan 5 transaksi terbaru.

### `GET /api/transactions`
- **Query Params**: `page=1&limit=10&search=INV&status=PAID&startDate=2026-08-01&endDate=2026-08-30`
- **Response Data**: List transaksi berpaginasi beserta meta pagination.

### `GET /api/transactions/:id`
- **Response Data**: Detail lengkap transaksi, status pembayaran, dan history payment logs.

### `POST /api/transactions/:id/cancel`
- **Response Data**: Membatalkan transaksi yang masih berstatus `PENDING`.

---

## 3. Payments API
### `POST /api/payments/create`
- **Request Body**:
  ```json
  {
    "customerName": "Kantin Utama",
    "customerPhone": "08123456789",
    "amount": 150000,
    "description": "Pembayaran Catering"
  }
  ```
- **Response Data**: Transaksi baru berstatus `PENDING`, muatan `qrContent`, `invoiceNumber` otomatis, dan durasi kedaluwarsa.

### `GET /api/payments/:id`
- **Response Data**: Informasi QR, status pembayaran saat ini, dan logs.

### `POST /api/payments/:id/simulate`
- **Request Body**: `{ "targetStatus": "PAID" | "FAILED" | "EXPIRED" }`
- **Response Data**: Mengubah status transaksi PENDING dalam mode sandbox untuk kebutuhan pengujian.

---

## 4. Webhook API
### `POST /api/webhooks/mock`
- **Request Body**: `{ "reference": "MOCK-REF-...", "status": "PAID", "paid_at": "..." }`
- **Response Data**: Memproses callback webhook dari mock simulator dengan proteksi idempotency.

### `POST /api/webhooks/dana`
- **Request Body**: Payload webhook DANA PJP.

---

## 5. Reports API
### `GET /api/reports`
- **Query Params**: `startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&status=PAID`
- **Response Data**: Ringkasan akumulasi dan daftar item laporan.

### `GET /api/reports/export/csv`
- **Response File**: Unduhan file `laporan_qris_YYYY-MM-DD.csv`.

---

## 6. Settings API
### `GET /api/settings`
- **Response Data**: Konfigurasi nama perusahaan, mata uang, timezone, dan status provider.

### `POST /api/settings` (Role ADMIN Only)
- **Request Body**: Map key-value pengaturan perusahaan & provider.
