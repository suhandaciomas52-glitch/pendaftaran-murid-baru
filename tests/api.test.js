require('dotenv').config();
process.env.DB_NAME = 'eduenroll_test';
process.env.JWT_SECRET = 'test_secret';

const request = require('supertest');
const app = require('../server');
const setupDb = require('./setupDb');
const bcrypt = require('bcryptjs');

const pool = require('../config/db');

let adminToken;
let studentToken;
let adminId;
let applicantId;

beforeAll(async () => {
  await setupDb();
  const hash = await bcrypt.hash('secret123', 10);
  await pool.query(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)',
    ['Super Admin Test', 'super@test.dev', hash, 'super_admin']
  );
  await pool.query(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)',
    ['Admin Sekolah', 'admin@test.dev', hash, 'admin_school']
  );
  await pool.query(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)',
    ['Calon Siswa', 'siswa@test.dev', hash, 'candidate_student']
  );
});

afterAll(async () => {
  await pool.end();
});

describe('Health', () => {
  it('GET /api/v1/health -> 200 ok', async () => {
    const res = await request(app).get('/api/v1/health').expect(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Auth', () => {
  test('Login gagal dengan password salah', async () => {
    await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'super@test.dev', password: 'salah000' })
      .expect(401);
  });

  test('Login berhasil super admin', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'super@test.dev', password: 'secret123' })
      .expect(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('super_admin');
    adminToken = res.body.token;
  });

  test('Login berhasil calon siswa', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'siswa@test.dev', password: 'secret123' })
      .expect(200);
    expect(res.body.user.role).toBe('candidate_student');
    studentToken = res.body.token;
  });

  test('Access protected tanpa token -> 401', async () => {
    await request(app).get('/api/v1/users').expect(401);
  });
});

describe('Schools CRUD', () => {
  test('POST /schools (super admin)', async () => {
    const res = await request(app)
      .post('/api/v1/schools')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'SMK Negeri X', npsn: '2020', address: 'Jl. Test' })
      .expect(201);
    adminId = res.body.id;
    expect(res.body.id).toBeTruthy();
  });

  test('Calon siswa dilarang buat sekolah -> 403', async () => {
    await request(app)
      .post('/api/v1/schools')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ name: 'X' })
      .expect(403);
  });

  test('GET /schools (publik)', async () => {
    const res = await request(app).get('/api/v1/schools').expect(200);
    expect(Array.isArray(res.body.schools)).toBe(true);
  });
});

describe('Majors CRUD', () => {
  test('POST /majors', async () => {
    const res = await request(app)
      .post('/api/v1/majors')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ school_id: adminId, code: 'RPL', name: 'Rekayasa Perangkat Lunak', quota: 50 })
      .expect(201);
    expect(res.body.id).toBeTruthy();
  });

  test('Validasi: wajib name', async () => {
    await request(app)
      .post('/api/v1/majors')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ school_id: adminId })
      .expect(400);
  });
});

describe('Applicants', () => {
  test('POST /applicants', async () => {
    const res = await request(app)
      .post('/api/v1/applicants')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        user_id: 3,
        school_id: adminId,
        major_id: 1,
        full_name: 'Siswa Baru',
      })
      .expect(201);
    expect(res.body.registration_number).toMatch(/^PPDB-/);
    applicantId = res.body.id;
  });

  test('Lengkapi data tanpa status diizinkan -> 200', async () => {
    await request(app)
      .put(`/api/v1/applicants/${applicantId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ address: 'Jl. Siswa 1', gender: 'male' })
      .expect(200);
  });

  test('PATCH status pending -> accepted oleh admin', async () => {
    await request(app)
      .patch(`/api/v1/applicants/${applicantId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'accepted' })
      .expect(200);
  });

  test('PATCH status tidak valid -> 400', async () => {
    await request(app)
      .patch(`/api/v1/applicants/${applicantId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'bukan-status' })
      .expect(400);
  });
});

describe('Announcements', () => {
  test('POST pengumuman (admin)', async () => {
    const res = await request(app)
      .post('/api/v1/announcements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ school_id: adminId, title: 'Pengumuman 1', content: 'Konten' })
      .expect(201);
    expect(res.body.id).toBeTruthy();
  });

  test('GET pengumuman publik', async () => {
    const res = await request(app).get('/api/v1/announcements').expect(200);
    expect(res.body.announcements.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Error handling', () => {
  test('Rute tidak ada -> 404', async () => {
    await request(app).get('/api/v1/tidak-ada').expect(404);
  });

  test('Email duplikat -> 409', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Dup', email: 'siswa@test.dev', password: 'secret123' })
      .expect(409);
  });
});