const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Player = require("../models/Player");

const router = express.Router();


// SIGNUP
router.post("/signup", async (req, res) => {

  const { name, email, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  const player = new Player({
    name,
    email,
    password: hashed
  });

  await player.save();

  res.json({ message: "Player created" });

});


// LOGIN
router.post("/login", async (req, res) => {

  const { email, password } = req.body;

  const player = await Player.findOne({ email });

  if (!player) {
    return res.status(400).json({ error: "User not found" });
  }

  const valid = await bcrypt.compare(password, player.password);

  if (!valid) {
    return res.status(400).json({ error: "Wrong password" });
  }

  const token = jwt.sign(
    { id: player._id },
    "smartkick_secret"
  );

  res.json({
    token,
    player_id: player._id,
    name: player.name
  });

});

module.exports = router;