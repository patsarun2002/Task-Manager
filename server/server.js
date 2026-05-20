import "dotenv/config";
import cron from "node-cron";
import prisma from "./db.js";
import app from "./app.js";

// ── [P1-Security] Validate required env vars before anything else ─────────────
const REQUIRED_ENV = ["JWT_SECRET", "JWT_REFRESH_SECRET", "DATABASE_URL"];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`[startup] Missing required env vars: ${missing.join(", ")}`);
  process.exit(1);
}

const PORT = process.env.PORT || 3001;

// ── Cron: ล้าง expired refresh tokens ทุกวัน 02:00 น. ──
cron.schedule("0 2 * * *", async () => {
  try {
    const { count } = await prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    console.log(`[cron] cleaned up ${count} expired refresh tokens`);
  } catch (err) {
    console.error("[cron] cleanup failed:", err);
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
