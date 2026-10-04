const Database = require("better-sqlite3");
const path = require("path");

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, "database.db");

console.log("📁 Database path:", dbPath);

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ============================================
// BUAT SEMUA TABEL
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'anggota',
    jabatan TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS class_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    namaKelas TEXT DEFAULT 'XI RPL 1',
    waliKelas TEXT DEFAULT '',
    jumlahMurid INTEGER DEFAULT 0,
    tahunAjaran TEXT DEFAULT '2024/2025',
    motto TEXT DEFAULT '',
    deskripsi TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hari TEXT NOT NULL,
    jamKe INTEGER NOT NULL,
    waktu TEXT NOT NULL,
    mataPelajaran TEXT NOT NULL,
    guru TEXT DEFAULT '',
    ruangan TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS cleanings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hari TEXT UNIQUE NOT NULL,
    petugas TEXT NOT NULL,
    tugas TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    judul TEXT NOT NULL,
    isi TEXT NOT NULL,
    author_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    tanggal TEXT NOT NULL,
    lokasi TEXT DEFAULT '',
    deskripsi TEXT DEFAULT ''
  );

  INSERT OR IGNORE INTO class_info (id) VALUES (1);
`);

console.log("✅ Database & tabel siap");

module.exports = db;
