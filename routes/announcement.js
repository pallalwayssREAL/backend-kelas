const express = require("express");
const db = require("../db");
const { protect, onlyAdmin } = require("../middleware/auth");

const router = express.Router();

// ============================================
// GET — Ambil semua pengumuman (PUBLIK)
// Diurutkan dari yang terbaru + ada nama penulis
// ============================================
router.get("/", (req, res) => {
  try {
    const rows = db
      .prepare(
        `SELECT 
           a.id, a.judul, a.isi, a.created_at,
           u.name AS author_name, u.jabatan AS author_jabatan
         FROM announcements a
         JOIN users u ON u.id = a.author_id
         ORDER BY a.created_at DESC`,
      )
      .all();

    const announcements = rows.map((r) => ({
      _id: r.id,
      judul: r.judul,
      isi: r.isi,
      createdAt: r.created_at,
      author: {
        name: r.author_name,
        jabatan: r.author_jabatan,
      },
    }));

    res.json({ announcements });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal ambil pengumuman" });
  }
});

// ============================================
// POST — Buat pengumuman (HANYA ADMIN)
// ============================================
router.post("/", protect, onlyAdmin, (req, res) => {
  try {
    const { judul, isi } = req.body;

    if (!judul || !isi)
      return res.status(400).json({ message: "Judul & isi wajib diisi" });

    const info = db
      .prepare(
        "INSERT INTO announcements (judul, isi, author_id) VALUES (?, ?, ?)",
      )
      .run(judul, isi, req.user.id);

    const announcement = db
      .prepare(
        `SELECT 
           a.id, a.judul, a.isi, a.created_at,
           u.name AS author_name, u.jabatan AS author_jabatan
         FROM announcements a
         JOIN users u ON u.id = a.author_id
         WHERE a.id = ?`,
      )
      .get(info.lastInsertRowid);

    res.status(201).json({
      message: "Pengumuman dibuat",
      announcement: {
        _id: announcement.id,
        judul: announcement.judul,
        isi: announcement.isi,
        createdAt: announcement.created_at,
        author: {
          name: announcement.author_name,
          jabatan: announcement.author_jabatan,
        },
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal buat pengumuman" });
  }
});

// ============================================
// DELETE — Hapus pengumuman (HANYA ADMIN)
// ============================================
router.delete("/:id", protect, onlyAdmin, (req, res) => {
  try {
    db.prepare("DELETE FROM announcements WHERE id = ?").run(req.params.id);
    res.json({ message: "Pengumuman dihapus" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal hapus pengumuman" });
  }
});

module.exports = router;
