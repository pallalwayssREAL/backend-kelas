const express = require("express");
const db = require("../db");
const { protect, onlyAdmin } = require("../middleware/auth");

const router = express.Router();

// GET semua jadwal (publik)
router.get("/", (req, res) => {
  try {
    const schedules = db
      .prepare("SELECT * FROM schedules ORDER BY hari, jamKe")
      .all();
    res.json({ schedules });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal ambil jadwal" });
  }
});

// POST tambah jadwal (admin)
router.post("/", protect, onlyAdmin, (req, res) => {
  try {
    const { hari, jamKe, waktu, mataPelajaran, guru, ruangan } = req.body;

    if (!hari || !jamKe || !waktu || !mataPelajaran)
      return res.status(400).json({ message: "Field wajib diisi" });

    const info = db
      .prepare(
        "INSERT INTO schedules (hari, jamKe, waktu, mataPelajaran, guru, ruangan) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run(hari, jamKe, waktu, mataPelajaran, guru || "", ruangan || "");

    const schedule = db
      .prepare("SELECT * FROM schedules WHERE id = ?")
      .get(info.lastInsertRowid);

    res.status(201).json({ message: "Jadwal ditambah", schedule });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal tambah jadwal" });
  }
});

// PUT update jadwal (admin)
router.put("/:id", protect, onlyAdmin, (req, res) => {
  try {
    const { hari, jamKe, waktu, mataPelajaran, guru, ruangan } = req.body;

    const existing = db
      .prepare("SELECT id FROM schedules WHERE id = ?")
      .get(req.params.id);

    if (!existing) return res.status(404).json({ message: "Jadwal tidak ada" });

    db.prepare(
      "UPDATE schedules SET hari = ?, jamKe = ?, waktu = ?, mataPelajaran = ?, guru = ?, ruangan = ? WHERE id = ?",
    ).run(
      hari,
      jamKe,
      waktu,
      mataPelajaran,
      guru || "",
      ruangan || "",
      req.params.id,
    );

    const schedule = db
      .prepare("SELECT * FROM schedules WHERE id = ?")
      .get(req.params.id);

    res.json({ message: "Jadwal diupdate", schedule });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal update jadwal" });
  }
});

// DELETE hapus jadwal (admin)
router.delete("/:id", protect, onlyAdmin, (req, res) => {
  try {
    db.prepare("DELETE FROM schedules WHERE id = ?").run(req.params.id);
    res.json({ message: "Jadwal dihapus" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal hapus jadwal" });
  }
});

module.exports = router;
