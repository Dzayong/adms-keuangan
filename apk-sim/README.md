# SIM Digital — Korlantas POLRI (Clone)

Proyek aplikasi SIM digital terinspirasi dari platform resmi Korlantas POLRI.

## Struktur Folder

```
apk-sim/
├── web/        → Frontend React + Vite & Backend Node.js (dari repo fikrighifari17-collab/SIM)
└── android/    → Mobile App React Native + Expo (tugasmu)
```

## Database

Satu database shared: `db_jejak_sim` (MySQL)

- Tabel `users` — akun customer & admin
- Tabel `submissions` — pengajuan SIM
- Tabel `satpas_locations` — lokasi SATPAS seluruh Indonesia

Backend Node.js di `web/` bertindak sebagai API server yang dipakai oleh keduanya.

## Stack

| Bagian | Tech |
|---|---|
| Web Frontend | React + Vite |
| Web Backend | Node.js (Express) |
| Database | MySQL |
| Mobile | React Native + Expo |
| Navigation | React Navigation (Tab + Stack) |
| Styling | NativeWind |
| State | Zustand / Context API |

## Fitur Utama

- SINAR: Pendaftaran & perpanjangan SIM online
- Upload dokumen (foto KTP, SIM lama, foto diri)
- Liveness check (face detection via kamera)
- Cek status pengajuan (resi)
- Pilih SATPAS & metode pengiriman
- Pembayaran via Virtual Account BNI

## Setup Web (clone dulu)

```bash
cd web
git clone https://github.com/fikrighifari17-collab/SIM .
npm install
npm run dev
```

## Setup Android

```bash
cd android
npx create-expo-app . --template blank
npm install
npx expo start
```
