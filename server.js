const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");
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
  const { email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);

  db.run(
    "INSERT INTO users (email, password) VALUES (?, ?)",
    [email, hashed],
    function (err) {
      if (err) return res.status(400).json({ error: "User exists" });
      res.json({ success: true });
    }
  );
});

/* LOGIN */
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (!user) return res.status(400).json({ error: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(403).json({ error: "Wrong password" });

    const token = jwt.sign({ id: user.id }, SECRET);
    res.json({ token });
  });
});

/* GENERATE EMAIL (PROTECTED) */
app.post("/generate", authenticateToken, async (req, res) => {
  const {
    name,
    company,
    painPoint,
    senderName,
    senderPhone,
    senderCompany
  } = req.body;

  const emailContent = await generateEmail(
    name,
    company,
    painPoint,
    senderName,
    senderPhone,
    senderCompany
  );

  db.run(
    "INSERT INTO logs (user_id, prospect_name, company, pain_point) VALUES (?, ?, ?, ?)",
    [req.user.id, name, company, painPoint]
  );

  res.json({ email: emailContent });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});