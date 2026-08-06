# EduEnroll - PPDB SaaS untuk Yayasan Pendidikan SMK

Backend REST API untuk mengelola Pendaftaran Peserta Didik Baru (PPDB) berbasis SaaS.

## Fitur MVP
- Autentikasi & otorisasi (JWT + bcrypt) dengan 3 peran: **Super Admin, Admin Sekolah, Calon Siswa**
- CRUD: Users, Schools, Majors, Applicants, Documents, Payments, Announcements
- Upload dokumen dan bukti pembayaran (multer) tanpa payment gateway
- Verifikasi dokumen & pembayaran
- Responsive-ready via REST API

## Tech Stack
Node.js, Express, MySQL (mysql2), JWT, bcryptjs, Multer, dotenv, CORS.

## Setup

### 1. Kebutuhan
- Node.js 18+
- MySQL / MariaDB (misal via XAMPP)

### 2. Instalasi
```bash
npm install
```

### 3. Konfigurasi
Salin `.env.example` menjadi `.env` lalu sesuaikan kredensial database dan `JWT_SECRET`.

### 4. Buat database
```bash
mysql -u root -p < db/schema.sql
```

### 5. Jalankan
```bash
npm start
# atau
npm run dev
```
Server berjalan di `http://localhost:3000`. API berada di prefix `/api/v1`.

## Endpoint Utama

| Resource | Method | Path |
|---|---|---|
| Health | GET | `/api/v1/health` |
| Register | POST | `/api/v1/auth/register` |
| Login | POST | `/api/v1/auth/login` |
| Profil | GET | `/api/v1/auth/me` |
| Users | GET/POST/PUT/DELETE | `/api/v1/users` |
| Schools | GET/POST/PUT/DELETE | `/api/v1/schools` |
| Majors | GET/POST/PUT/DELETE | `/api/v1/majors` |
| Applicants | GET/POST/PUT/DELETE | `/api/v1/applicants` |
| Status Applicant | PATCH | `/api/v1/applicants/:id/status` |
| Documents | POST (multer) | `/api/v1/documents/applicant/:applicant_id` |
| Payments | POST (multer) | `/api/v1/payments/applicant/:applicant_id` |
| Verify Payment | PATCH | `/api/v1/payments/:id/verify` |
| Announcements | GET/POST/PUT/DELETE | `/api/v1/announcements` |

Otorisasi menggunakan header `Authorization: Bearer <token>`. Access/OTP tertentu dibatasi per peran.

## Struktur
```
config/     koneksi database
controllers/  logika bisnis per entitas
middleware/   auth, upload, errorHandler
routes/       definisi rute API
db/schema.sql skema database
uploads/      file hasil upload
server.js     entry point
```