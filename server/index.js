require("dotenv").config();
const express = require("express");
const multer = require("multer");
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth");
const analyzeRoutes = require("./routes/analyze");

const Session = require("./models/Session");
const Player = require("./models/Player");

const app = express();

/* ================================
   🔧 Middleware
================================ */
app.use(cors());
app.use(express.json());

/* ================================
   🔥 MongoDB Connection (SAFE + DEBUG)
================================ */
console.log("MONGO_URI:", process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("MongoDB connected"))
.catch(err => {
  console.error("MongoDB connection error:", err);
});

/* ================================
   🧠 Tactical Insight Engine
================================ */
function generateTacticalInsight(stats) {
  const {
    distance_meters,
    avg_speed_m_per_s,
    active_time_percent
  } = stats;

  let intensity =
    avg_speed_m_per_s < 1.5
      ? "Low-intensity movement profile."
      : avg_speed_m_per_s < 3
      ? "Moderate transitional intensity."
      : "High-intensity dynamic performance.";

  let activity =
    active_time_percent < 20
      ? "Limited active engagement."
      : active_time_percent < 40
      ? "Balanced involvement across phases."
      : "High continuous work rate.";

  let coverage =
    distance_meters < 40
      ? "Controlled positional coverage."
      : distance_meters < 80
      ? "Effective spatial mobility."
      : "Extensive field coverage indicating aggressive transitions.";

  return `
Performance Profile:
• ${intensity}
• ${activity}

Tactical Interpretation:
${coverage}

Recommended Development Focus:
• Improve acceleration bursts
• Increase sustained high-intensity efforts
• Enhance off-ball positioning
`;
}

/* ================================
   📊 Performance Score (0–100)
================================ */
function calculatePerformanceScore(stats) {
  const {
    distance_meters,
    avg_speed_m_per_s,
    active_time_percent
  } = stats;

  const distanceScore = Math.min(distance_meters / 100, 1) * 40;
  const speedScore = Math.min(avg_speed_m_per_s / 5, 1) * 30;
  const activityScore = Math.min(active_time_percent / 50, 1) * 30;

  return Math.round(distanceScore + speedScore + activityScore);
}

/* ================================
   📁 File Upload Setup
================================ */
const upload = multer({ dest: "uploads/" });

app.get("/", (req, res) => {
  res.send("SmartKick Server Running 🚀");
});

/* ================================
   🎥 Upload Route
================================ */
app.post("/upload", upload.single("video"), async (req, res) => {
  try {
    console.log("Upload route hit");

    if (!req.file) {
      return res.status(400).json({ error: "No video uploaded" });
    }

    if (!process.env.AI_URL) {
      return res.status(500).json({ error: "AI_URL not configured" });
    }

    const formData = new FormData();
    formData.append("file", fs.createReadStream(req.file.path));

    console.log("Calling Python AI...");

    const aiResponse = await axios.post(
      `${process.env.AI_URL}/analyze-video`,
      formData,
      { headers: formData.getHeaders() }
    );

    const stats = aiResponse.data;
    console.log("Stats received:", stats);

    const tacticalInsight = generateTacticalInsight(stats);
    const performanceScore = calculatePerformanceScore(stats);

    const newSession = new Session({
      ...stats,
      tactical_insight: tacticalInsight,
      performance_score: performanceScore
    });

    await newSession.save();
    console.log("Session saved to MongoDB");

    fs.unlink(req.file.path, (err) => {
      if (err) console.log("File cleanup error:", err);
    });

    res.json({
      ...stats,
      tactical_insight: tacticalInsight,
      performance_score: performanceScore
    });

  } catch (err) {
    console.error("Server error:", err.response?.data || err.message);
    res.status(500).json({ error: "Error processing video" });
  }
});

/* ================================
   📊 Routes
================================ */
app.use("/api", analyzeRoutes);
app.use("/api/auth", authRoutes);

app.get("/sessions", async (req, res) => {
  const sessions = await Session.find().sort({ created_at: -1 });
  res.json(sessions);
});

/* ================================
   🚀 Start Server
================================ */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});