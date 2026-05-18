import express from "express";
import cors from "cors";
import morgan from "morgan";
import "dotenv/config";
import helmet from "helmet";

import taskRoutes from "./routes/tasks.js";
import authRoutes from "./routes/auth.js";
import { authLimiter, apiLimiter } from "./middleware/rateLimiter.js";
import { sanitizeBody } from "./middleware/sanitize.js";

const app = express();
const PORT = process.env.PORT || 3001;
const allowedOrigins =
  process.env.ALLOWED_ORIGIN?.split(",").map((o) => o.trim()) ?? [];
// ── Middleware ────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
  }),
);
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(sanitizeBody); // sanitize ทุก request
app.use("/api", apiLimiter); // rate limit ทั่วไป

// ── Routes ────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes); // rate limit เข้มสำหรับ auth
app.use("/api/tasks", taskRoutes);

app.get("/", (req, res) => res.json({ message: "Server running" }));

// ── 404 ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Error handler ─────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong" });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
