const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { protect, onlyAdmin, onlyDeveloper } = require("../middleware/auth");
const DEVELOPERS = require("../developer-accounts");

const router = express.Router();

// ============================================
// HELPER: Kirim token sebagai cookie
// ============================================
const sendTokenCookie = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

// ============================================
// LOGIN
// ============================================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email & password wajib diisi" });

    // ============================================
    // 1. CEK DULU KE AKUN DEVELOPER (hardcoded)
    // ============================================
    const dev = DEVELOPERS.find(
      (d) => d.email.toLowerCase() === email.toLowerCase(),
    );

    if (dev) {
      const ok = await bcrypt.compare(password, dev.passwordHash);

      if (ok) {
        // Pastikan user developer ada di database (buat author_id pengumuman)
        let dbUser = db
          .prepare("SELECT * FROM users WHERE email = ?")
          .get(dev.email);

        if (!dbUser) {
          // Bikin otomatis di database
          const info = db
            .prepare(
              "INSERT INTO users (name, email, password, role, jabatan) VALUES (?, ?, ?, ?, ?)",
            )
            .run(
              dev.name,
              dev.email,
              dev.passwordHash,
              dev.role,
              dev.jabatan || "",
            );

          dbUser = db
            .prepare("SELECT * FROM users WHERE id = ?")
            .get(info.lastInsertRowid);
        }

        sendTokenCookie(res, dbUser.id);

        return res.json({
          message: "Login berhasil (developer)",
          user: {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role,
            jabatan: dbUser.jabatan,
          },
        });
      } else {
        // Email ketemu tapi password salah
        return res.status(401).json({ message: "Email atau password salah" });
      }
    }

    // ============================================
    // 2. KALAU BUKAN DEVELOPER, CEK KE DATABASE
    // ============================================
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!user)
      return res.status(401).json({ message: "Email atau password salah" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok)
      return res.status(401).json({ message: "Email atau password salah" });

    if (user.role !== "admin" && user.role !== "developer") {
      return res.status(403).json({ message: "Akun ini bukan admin" });
    }

    sendTokenCookie(res, user.id);

    res.json({
      message: "Login berhasil",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        jabatan: user.jabatan,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal login" });
  }
});

// ============================================
// LOGOUT
// ============================================
router.post("/logout", (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  });
  res.json({ message: "Logout berhasil" });
});

// ============================================
// CEK USER YANG SEDANG LOGIN
// ============================================
router.get("/me", protect, (req, res) => {
  res.json({ user: req.user });
});

// ============================================
// LIST USERS — untuk struktur kelas (publik)
// ============================================
router.get("/users", (req, res) => {
  const users = db
    .prepare("SELECT id, name, jabatan FROM users WHERE jabatan != ''")
    .all();
  res.json({ users });
});

// ============================================
// LIST ADMINS — KHUSUS DEVELOPER
// ============================================
router.get("/admins", protect, onlyDeveloper, (req, res) => {
  const admins = db
    .prepare(
      "SELECT id, name, email, role, jabatan, created_at FROM users WHERE role IN ('admin', 'developer') ORDER BY created_at ASC",
    )
    .all();
  res.json({ admins });
});

// ============================================
// BUAT ADMIN BARU — KHUSUS DEVELOPER
// ============================================
router.post("/admins", protect, onlyDeveloper, async (req, res) => {
  try {
    const { name, email, password, role, jabatan } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "Field wajib diisi" });

    if (password.length < 6)
      return res.status(400).json({ message: "Password minimal 6 karakter" });

    const finalRole = role === "developer" ? "developer" : "admin";

    const existing = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(email);
    if (existing)
      return res.status(400).json({ message: "Email sudah terdaftar" });

    const hashed = await bcrypt.hash(password, 10);

    const info = db
      .prepare(
        "INSERT INTO users (name, email, password, role, jabatan) VALUES (?, ?, ?, ?, ?)",
      )
      .run(name, email, hashed, finalRole, jabatan || "");

    res.status(201).json({
      message: "Admin baru dibuat",
      admin: {
        id: info.lastInsertRowid,
        name,
        email,
        role: finalRole,
        jabatan: jabatan || "",
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal buat admin" });
  }
});

// ============================================
// HAPUS ADMIN — KHUSUS DEVELOPER
// ============================================
router.delete("/admins/:id", protect, onlyDeveloper, (req, res) => {
  try {
    const target = db
      .prepare("SELECT id, role, email FROM users WHERE id = ?")
      .get(req.params.id);

    if (!target)
      return res.status(404).json({ message: "User tidak ditemukan" });

    if (target.id === req.user.id)
      return res.status(400).json({ message: "Gak bisa hapus akun sendiri" });

    // Cek apakah ini developer hardcoded (jangan boleh dihapus)
    const isHardcoded = DEVELOPERS.some(
      (d) => d.email.toLowerCase() === target.email.toLowerCase(),
    );

    if (isHardcoded) {
      return res
        .status(400)
        .json({ message: "Gak bisa hapus developer hardcoded" });
    }

    db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
    res.json({ message: "Admin dihapus" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal hapus admin" });
  }
});

module.exports = router;
