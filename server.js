const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("./database/db");
const { authenticateToken, SECRET } = require("./middleware/auth");
const { generateEmail } = require("./services/openai");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* REGISTER */
app.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const hashed = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (email, password) VALUES ($1, $2)",
      [email, hashed]
    );

    res.json({ success: true });

  } catch (err) {
    res.status(400).json({ error: "User exists or invalid data" });
  }
});

/* LOGIN */
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const result = await db.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(403).json({ error: "Wrong password" });
    }

    const token = jwt.sign({ id: user.id }, SECRET);

    res.json({ token });

  } catch (err) {
    res.status(500).json({ error: "Login error" });
  }
});

/* GENERATE EMAIL */
app.post("/generate", authenticateToken, async (req, res) => {
  try {
    const {
      name,
      company,
      painPoint,
      levers,
      senderName,
      senderPhone,
      senderCompany
    } = req.body;

    if (!name || !company || !painPoint) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 🔍 Récupérer utilisateur
    const result = await db.query(
      "SELECT * FROM users WHERE id = $1",
      [req.user.id]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    // 🔁 RESET mensuel automatique
    const now = new Date();
    const lastReset = new Date(user.last_reset);

    if (
      now.getMonth() !== lastReset.getMonth() ||
      now.getFullYear() !== lastReset.getFullYear()
    ) {
      let newCredits = 5;

      if (user.plan_type === "starter") newCredits = 150;
      if (user.plan_type === "growth") newCredits = 500;
      if (user.plan_type === "pro") newCredits = 1500;

      await db.query(
        "UPDATE users SET credits_remaining = $1, last_reset = CURRENT_DATE WHERE id = $2",
        [newCredits, user.id]
      );

      user.credits_remaining = newCredits;
    }

    // 🚫 Bloquer si plus de crédits
    if (user.credits_remaining <= 0) {
      return res.status(403).json({ error: "No credits remaining" });
    }

    // ➖ Décrémenter crédit
    await db.query(
      "UPDATE users SET credits_remaining = credits_remaining - 1 WHERE id = $1",
      [user.id]
    );

    // ✉️ Générer email
    const emailContent = await generateEmail(
      name,
      company,
      painPoint,
      levers,
      senderName,
      senderPhone,
      senderCompany
    );

    // 📝 Log
    await db.query(
      "INSERT INTO logs (user_id, prospect_name, company, pain_point) VALUES ($1, $2, $3, $4)",
      [user.id, name, company, painPoint]
    );

    res.json({
      email: emailContent,
      credits_remaining: user.credits_remaining - 1
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Generation error" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});