const express = require("express");
const db = require("../db");
const { protect, onlyAdmin } = require("../middleware/auth");

const router = express.Router();

// ============================================
// GET — Ambil semua jadwal piket (PUBLIK)
// ============================================
router.get("/", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM cleanings ORDER BY id").all();
    // petugas disimpan sebagai JSON string di database
    // jadi harus di-parse dulu jadi array
    const cleanings = rows.map((r) => ({
      ...r,
      petugas: JSON.parse(r.petugas || "[]"),
    }));
    res.json({ cleanings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal ambil piket" });
  }
});

// ============================================
// POST — Tambah / Update piket (HANYA ADMIN)
// Kalau hari sudah ada → update. Kalau belum → create baru.
// ============================================
router.post("/", protect, onlyAdmin, (req, res) => {
  try {
    const { hari, petugas, tugas } = req.body;

    if (!hari || !petugas || !petugas.length)
      return res.status(400).json({ message: "Hari & petugas wajib" });

    const existing = db
      .prepare("SELECT id FROM cleanings WHERE hari = ?")
      .get(hari);

    const petugasJSON = JSON.stringify(petugas);

    if (existing) {
      db.prepare(
        "UPDATE cleanings SET petugas = ?, tugas = ? WHERE hari = ?",
      ).run(petugasJSON, tugas || "", hari);
    } else {
      db.prepare(
        "INSERT INTO cleanings (hari, petugas, tugas) VALUES (?, ?, ?)",
      ).run(hari, petugasJSON, tugas || "");
    }

    res.json({ message: "Jadwal piket disimpan" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal simpan piket" });
  }
});

// ============================================
// DELETE — Hapus piket (HANYA ADMIN)
// ============================================
router.delete("/:id", protect, onlyAdmin, (req, res) => {
  try {
    db.prepare("DELETE FROM cleanings WHERE id = ?").run(req.params.id);
    res.json({ message: "Piket dihapus" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal hapus piket" });
  }
});

module.exports = router;
