require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

require("./db");

const app = express();

app.use(express.json());
app.use(cookieParser());

// ============================================
// CORS — izinkan domain frontend
// ============================================
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "https://admin-kelas-rpl.pallalwayss.workers.dev",
  "https://kelas-rpl-otm.pallalwayss.workers.dev",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log("❌ CORS blocked:", origin);
        callback(new Error("CORS tidak izinkan"));
      }
    },
    credentials: true,
  })
);

app.set("trust proxy", 1);

// ============================================
// ROUTES
// ============================================
app.use("/api/auth", require("./routes/auth"));
app.use("/api/class-info", require("./routes/classInfo"));
app.use("/api/schedule", require("./routes/schedule"));
app.use("/api/cleaning", require("./routes/cleaning"));
app.use("/api/announcement", require("./routes/announcement"));
app.use("/api/event", require("./routes/event"));
app.use("/api/structure", require("./routes/structure"));

// ============================================
// HEALTH CHECK
// ============================================
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "Backend website kelas jalan",
    time: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

// ============================================
// ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res.status(500).json({ message: "Terjadi kesalahan server" });
});

// ============================================
// START
// ============================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("============================================");
  console.log(`🚀 Server jalan di http://localhost:${PORT}`);
  console.log(`📁 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log("============================================");
});
