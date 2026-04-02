const mongoose = require("mongoose");

const SessionSchema = new mongoose.Schema({

  player_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Player"
  },

  distance_meters: Number,
  avg_speed_m_per_s: Number,
  active_time_percent: Number,
  performance_score: Number,
  tactical_insight: String,

  created_at: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Session", SessionSchema);