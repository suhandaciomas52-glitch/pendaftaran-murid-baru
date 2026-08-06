const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const DB = process.env.DB_NAME || 'eduenroll_test';

async function setupDb() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    charset: 'UTF8MB4_GENERAL_CI',
    multipleStatements: true,
  });
  await conn.query(`DROP DATABASE IF EXISTS \`${DB}\``);
  await conn.query(`CREATE DATABASE \`${DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.query(`USE \`${DB}\``);
  const schema = fs
    .readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf-8')
    .replace(/CREATE DATABASE IF NOT EXISTS eduenroll.*?\nUSE eduenroll;/s, '')
    .replace(/USE eduenroll;/g, '');
  await conn.query(schema);
  await conn.end();
  return true;
}

module.exports = setupDb;