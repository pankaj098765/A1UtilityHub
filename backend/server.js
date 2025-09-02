// backend/server.js
import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors"; // ✅ CORS import

dotenv.config(); // 👈 .env load sabse pehle

if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY missing! Add it in Render > Environment.");
  process.exit(1);
}

const app = express();
app.use(express.json());

// 👇 CORS middleware (Netlify frontend allow)
app.use(cors({
  origin: "https://a1utilityhub.netlify.app", // replace with your Netlify URL
  credentials: true
}));

// Resolve __dirname (ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔹 Health check
app.get("/health", (_req, res) => res.json({ ok: true }));

// 🔹 Proxy endpoint for Gemini
app.post("/api/prompt", async (req, res) => {
  try {
    const { prompt, inlineData } = req.body;

    const payload = {
      contents: [
        {
          role: "user",
          parts: inlineData ? [{ text: prompt }, inlineData] : [{ text: prompt }],
        },
      ],
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const r = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data?.error?.message || "Gemini error" });
    res.json(data);
  } catch (err) {
    console.error("Backend Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
