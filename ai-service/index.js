const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;

app.get("/", (req, res) => {
  res.send("AI Service Running 🤖");
});

// Example AI route
app.post("/analyze", (req, res) => {
  const data = req.body;

  // fake AI logic (replace later)
  res.json({
    message: "Analysis complete",
    input: data
  });
});

app.listen(PORT, () => {
  console.log(`AI Service running on ${PORT}`);
});