const express = require("express");
const db = require("../db");
const { protect, onlyAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/", (req, res) => {
  try {
    const structure = db
      .prepare("SELECT * FROM structure ORDER BY urutan ASC, id ASC")
      .all();
    res.json({ structure });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal ambil struktur" });
  }
});

router.post("/", protect, onlyAdmin, (req, res) => {
  try {
    const { nama, jabatan, urutan } = req.body;

    if (!nama || !jabatan)
      return res.status(400).json({ message: "Nama & jabatan wajib diisi" });

    const info = db
      .prepare(
        "INSERT INTO structure (nama, jabatan, urutan) VALUES (?, ?, ?)"
      )
      .run(nama, jabatan, urutan || 0);

    const item = db
      .prepare("SELECT * FROM structure WHERE id = ?")
      .get(info.lastInsertRowid);

    res.status(201).json({ message: "Anggota ditambah", structure: item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal tambah" });
  }
});

router.put("/:id", protect, onlyAdmin, (req, res) => {
  try {
    const { nama, jabatan, urutan } = req.body;

    const existing = db
      .prepare("SELECT id FROM structure WHERE id = ?")
      .get(req.params.id);

    if (!existing) return res.status(404).json({ message: "Tidak ada" });

    db.prepare(
      "UPDATE structure SET nama = ?, jabatan = ?, urutan = ? WHERE id = ?"
    ).run(nama, jabatan, urutan || 0, req.params.id);

    const item = db
      .prepare("SELECT * FROM structure WHERE id = ?")
      .get(req.params.id);

    res.json({ message: "Diupdate", structure: item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal update" });
  }
});

router.delete("/:id", protect, onlyAdmin, (req, res) => {
  try {
    db.prepare("DELETE FROM structure WHERE id = ?").run(req.params.id);
    res.json({ message: "Dihapus" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal hapus" });
  }
});

module.exports = router;
