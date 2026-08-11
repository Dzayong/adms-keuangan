# ARCHITECTURE DOCUMENTATION — ADMS QRIS INTERNAL

## Overview
ADMS QRIS INTERNAL adalah sistem manajemen transaksi pembayaran QRIS untuk kebutuhan internal kantor. Aplikasi berfungsi sebagai sistem pencatatan, pembuat transaksi, pembuat QR pembayaran, dan penerima notifikasi webhook dari Payment Provider resmi.

Aplikasi **BUKAN** payment provider, bukan bank, dan tidak melakukan pencatatan saldo/wallet.

## System Architecture

```
+-------------------------------------------------------------+
|                        BROWSER                              |
|   React SPA + Tailwind CSS + Lucide Icons + Motion         |
+------------------------------+------------------------------+
                               |
                        HTTP / REST API (JWT Bearer)
                               |
+------------------------------v------------------------------+
|                     EXPRESS SERVER                          |
|  - Auth Middleware & Role Guard (ADMIN / OPERATOR)          |
|  - Rate Limiting & Input Validation (Zod)                   |
|  - Centralized Error Handler                                |
+--------------+-------------------------------+--------------+
               |                               |
        SQL / ORM Query                 Payment Abstraction
               |                               |
+--------------v---------------+   +-----------v--------------+
|        SQL DATABASE          |   | PAYMENT PROVIDER LAYER   |
| (MySQL / SQLite Storage)     |   | - Mock QRIS Provider     |
| - Users & Credentials        |   | - DANA QRIS Skeleton     |
| - Transactions & Payments    |   +-----------+--------------+
| - Audit Payment Logs         |               |
| - Settings                   |        Simulated Webhook
+------------------------------+               |
                                   +-----------v--------------+
                                   |   POST /api/webhooks/*   |
                                   | (Idempotency Protected)  |
                                   +--------------------------+
```

## Security & Architectural Principles
1. **Separation of Scope**: Direct payment credentials (e.g. DANA client secrets) are stored exclusively in backend environment variables or DB settings table. Frontends never access payment secrets directly.
2. **Payment Provider Abstraction**: Controllers interact with the `PaymentProvider` interface (`createPayment`, `checkPayment`, `cancelPayment`, `refundPayment`, `handleWebhook`), making the app ready to plug in production DANA/PJP APIs without refactoring business logic.
3. **Role-Based Access Control (RBAC)**:
   - **ADMIN**: Access to all modules, system settings, provider management, and audit logs.
   - **OPERATOR**: Access to transaction creation, viewing, reporting, and payment status checks. Cannot modify system credentials or settings.
4. **Webhook Idempotency**: Webhook callbacks verify reference existence and existing status to avoid duplicate payment processing or duplicate accounting entries.
