const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const apiRoutes = require("./routemain/apiRoutes");

const app = express();

// ── Middlewares ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/api", apiRoutes);

// ── Health Check ─────────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({ success: true, message: "BPVS API is running 🚀" });
});

// ── Database + Server ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/bpvs";

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`),
    );
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });
