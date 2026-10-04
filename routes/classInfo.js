const express = require("express");
const db = require("../db");
const { protect, onlyAdmin } = require("../middleware/auth");

const router = express.Router();

// ============================================
// GET — Ambil info kelas (PUBLIK, tanpa login)
// ============================================
router.get("/", (req, res) => {
  try {
    const info = db.prepare("SELECT * FROM class_info WHERE id = 1").get();
    res.json({ info });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal ambil info" });
  }
});

// ============================================
// PUT — Update info kelas (HANYA ADMIN)
// ============================================
router.put("/", protect, onlyAdmin, (req, res) => {
  try {
    const { namaKelas, waliKelas, jumlahMurid, tahunAjaran, motto, deskripsi } =
      req.body;

    db.prepare(
      `UPDATE class_info 
       SET namaKelas = ?, waliKelas = ?, jumlahMurid = ?, 
           tahunAjaran = ?, motto = ?, deskripsi = ? 
       WHERE id = 1`,
    ).run(
      namaKelas || "",
      waliKelas || "",
      jumlahMurid || 0,
      tahunAjaran || "",
      motto || "",
      deskripsi || "",
    );

    const info = db.prepare("SELECT * FROM class_info WHERE id = 1").get();
    res.json({ message: "Info kelas diupdate", info });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal update info" });
  }
});

module.exports = router;
