# DATABASE DOCUMENTATION — ADMS QRIS INTERNAL

## Relational Entity Schema

### 1. `users`
Sistem autentikasi & peran pengguna internal.
- `id`: INT (Primary Key, Auto Increment)
- `name`: VARCHAR(255) — Nama lengkap operator/admin
- `email`: VARCHAR(255) UNIQUE — Email login
- `password_hash`: VARCHAR(255) — Hashed dengan bcryptjs
- `role`: ENUM('ADMIN', 'OPERATOR')
- `is_active`: TINYINT(1) — Status aktif (1/0)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### 2. `transactions`
Pencatatan transaksi pembayaran QRIS.
- `id`: INT (Primary Key, Auto Increment)
- `invoice_number`: VARCHAR(100) UNIQUE — Contoh: `INV-20260811-000001`
- `customer_name`: VARCHAR(255) — Nama pembuat/pemesan
- `customer_phone`: VARCHAR(50) — Nomor telepon customer
- `amount`: DECIMAL(15, 2) — Nominal pembayaran (Aman untuk uang)
- `description`: TEXT — Catatan/deskripsi pembayaran
- `status`: ENUM('PENDING', 'PAID', 'FAILED', 'EXPIRED', 'CANCELLED', 'REFUNDED')
- `expired_at`: DATETIME — Tanggal/waktu kedaluwarsa QR
- `paid_at`: DATETIME NULL — Tanggal/waktu pelunasan
- `created_by`: INT (Foreign Key -> users.id)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### 3. `payment_providers`
Katalog penyedia gateway / provider QRIS.
- `id`: INT (Primary Key, Auto Increment)
- `name`: VARCHAR(100) — Nama provider (misal: "Mock QRIS", "DANA QRIS")
- `code`: VARCHAR(50) UNIQUE — Kode provider (`mock`, `dana`)
- `environment`: ENUM('sandbox', 'production')
- `is_active`: TINYINT(1)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### 4. `payments`
Detail teknis muatan QR dan referensi provider.
- `id`: INT (Primary Key, Auto Increment)
- `transaction_id`: INT (Foreign Key -> transactions.id)
- `provider_id`: INT (Foreign Key -> payment_providers.id)
- `provider_reference`: VARCHAR(255) — Referensi eksternal dari provider
- `qr_content`: TEXT — Payload string EMVCo QRIS
- `payment_method`: VARCHAR(50) — Default `QRIS`
- `status`: ENUM('PENDING', 'PAID', 'FAILED', 'EXPIRED', 'CANCELLED', 'REFUNDED')
- `paid_at`: DATETIME NULL
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### 5. `payment_logs`
Audit log peristiwa webhook dan simulasi.
- `id`: INT (Primary Key, Auto Increment)
- `payment_id`: INT (Foreign Key -> payments.id)
- `event_type`: VARCHAR(100) — Jenis event (misal: `PAYMENT_CREATED`, `SIMULATED_PAID`)
- `reference`: VARCHAR(255)
- `payload`: JSON / TEXT — Payload JSON event
- `created_at`: TIMESTAMP

### 6. `settings`
Pengaturan konfigurasi perusahaan & sistem.
- `id`: INT (Primary Key, Auto Increment)
- `key`: VARCHAR(100) UNIQUE — `company_name`, `currency`, `timezone`, `mock_expiry_minutes`, dll.
- `value`: TEXT
- `updated_at`: TIMESTAMP

## Entity Relationship Diagram (ERD) Text Representation
```
users (1) ---------> (N) transactions (1) ---------> (N) payments (1) ---------> (N) payment_logs
                                                        ^
                                                        |
payment_providers (1) ----------------------------------+
```
