const jwt = require("jsonwebtoken");
const db = require("../db");

// ============================================
// CEK LOGIN — pastikan user sudah login
// ============================================
const protect = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Belum login" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = db
      .prepare("SELECT id, name, email, role, jabatan FROM users WHERE id = ?")
      .get(decoded.id);

    if (!user) return res.status(401).json({ message: "User tidak ditemukan" });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Token tidak valid" });
  }
};

// ============================================
// HANYA ADMIN — role harus admin atau developer
// (buat edit data kelas)
// ============================================
const onlyAdmin = (req, res, next) => {
  if (req.user.role !== "admin" && req.user.role !== "developer") {
    return res.status(403).json({ message: "Hanya admin yang bisa" });
  }
  next();
};

// ============================================
// HANYA DEVELOPER — role harus developer
// (buat kelola akun admin)
// ============================================
const onlyDeveloper = (req, res, next) => {
  if (req.user.role !== "developer") {
    return res.status(403).json({ message: "Hanya developer yang bisa" });
  }
  next();
};

module.exports = { protect, onlyAdmin, onlyDeveloper };
