require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { initDb } = require("./db");
const { startScheduler } = require("./scheduler");
const authRoutes = require("./routes/auth");
const postsRoutes = require("./routes/posts");
const mediaRoutes = require("./routes/media");

const app = express();
const PORT = process.env.PORT || 3001;

app.set("trust proxy", 1);
app.use(helmet());
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").map(o => o.trim());
app.use(cors({ origin: (origin, cb) => (!origin || allowedOrigins.includes(origin) ? cb(null, true) : cb(new Error("CORS blocked"))), credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => res.json({ status: "ok", service: "strategic-honesty-scheduler", timestamp: new Date().toISOString() }));
app.get("/", (req, res) => res.json({ name: "Strategic Honesty Scheduler API", tagline: "Be Good. Do Good. Do Well." }));
app.use("/auth", authRoutes);
app.use("/posts", postsRoutes);
app.use("/media", mediaRoutes);
app.use((err, req, res, next) => res.status(500).json({ error: err.message }));

async function boot() {
  await initDb();
  startScheduler();
  app.listen(PORT, () => console.log(`🚀 Running on port ${PORT} — Be Good. Do Good. Do Well.`));
}
boot().catch(err => { console.error(err); process.exit(1); });
