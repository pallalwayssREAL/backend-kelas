const express = require("express");
const db = require("../db");
const { protect, onlyAdmin } = require("../middleware/auth");

const router = express.Router();

// ============================================
// GET — Ambil semua agenda (PUBLIK)
// Diurutkan dari tanggal terdekat
// ============================================
router.get("/", (req, res) => {
  try {
    const events = db
      .prepare("SELECT * FROM events ORDER BY tanggal ASC")
      .all()
      .map((e) => ({ ...e, _id: e.id }));
    res.json({ events });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal ambil agenda" });
  }
});

// ============================================
// POST — Tambah agenda (HANYA ADMIN)
// ============================================
router.post("/", protect, onlyAdmin, (req, res) => {
  try {
    const { nama, tanggal, lokasi, deskripsi } = req.body;

    if (!nama || !tanggal)
      return res.status(400).json({ message: "Nama & tanggal wajib diisi" });

    const info = db
      .prepare(
        "INSERT INTO events (nama, tanggal, lokasi, deskripsi) VALUES (?, ?, ?, ?)",
      )
      .run(nama, tanggal, lokasi || "", deskripsi || "");

    const event = db
      .prepare("SELECT * FROM events WHERE id = ?")
      .get(info.lastInsertRowid);

    res.status(201).json({
      message: "Agenda dibuat",
      event: { ...event, _id: event.id },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal buat agenda" });
  }
});

// ============================================
// PUT — Update agenda (HANYA ADMIN)
// ============================================
router.put("/:id", protect, onlyAdmin, (req, res) => {
  try {
    const { nama, tanggal, lokasi, deskripsi } = req.body;

    const existing = db
      .prepare("SELECT id FROM events WHERE id = ?")
      .get(req.params.id);

    if (!existing) return res.status(404).json({ message: "Agenda tidak ada" });

    db.prepare(
      "UPDATE events SET nama = ?, tanggal = ?, lokasi = ?, deskripsi = ? WHERE id = ?",
    ).run(nama, tanggal, lokasi || "", deskripsi || "", req.params.id);

    const event = db
      .prepare("SELECT * FROM events WHERE id = ?")
      .get(req.params.id);

    res.json({
      message: "Agenda diupdate",
      event: { ...event, _id: event.id },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal update agenda" });
  }
});

// ============================================
// DELETE — Hapus agenda (HANYA ADMIN)
// ============================================
router.delete("/:id", protect, onlyAdmin, (req, res) => {
  try {
    db.prepare("DELETE FROM events WHERE id = ?").run(req.params.id);
    res.json({ message: "Agenda dihapus" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal hapus agenda" });
  }
});

module.exports = router;
