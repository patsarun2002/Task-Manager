import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../db.js";

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

// ── helpers ──────────────────────────────────────────
function generateAccessToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  });
}

async function cleanupExpiredTokens() {
  await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
}

function generateRefreshToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
}

// ── register ──────────────────────────────────────────
export async function register(req, res) {
  try {
    const { email, password } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "รูปแบบอีเมลไม่ถูกต้อง" });
    }

    if (!password || password.length < 8) {
      return res
        .status(400)
        .json({ error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "อีเมลนี้ถูกใช้งานแล้ว" });
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { email, password: hashed },
    });

    res.status(201).json({ message: "สมัครสมาชิกสำเร็จ", userId: user.id });
  } catch (err) {
    console.error("[register]", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
}

// ── login ─────────────────────────────────────────────
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "กรุณากรอกอีเมลและรหัสผ่าน" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // เก็บ refresh token ใน database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    cleanupExpiredTokens().catch((err) =>
      console.error("[cleanupExpiredTokens]", err),
    );

    res.json({ accessToken, refreshToken });
  } catch (err) {
    console.error("[login]", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
}

// ── refresh ───────────────────────────────────────────
export async function refresh(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ error: "ไม่พบ refresh token" });
    }

    // ตรวจสอบ token ใน database
    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });
    if (!stored || stored.expiresAt < new Date()) {
      return res
        .status(403)
        .json({ error: "refresh token ไม่ถูกต้องหรือหมดอายุแล้ว" });
    }

    // verify signature
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    await prisma.refreshToken.delete({ where: { token: refreshToken } });

    const newRefreshToken = generateRefreshToken(payload.userId);
    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: payload.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const accessToken = generateAccessToken(payload.userId);
    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    console.error("[refresh]", err);
    res.status(403).json({ error: "refresh token ไม่ถูกต้อง" });
  }
}

// ── logout ────────────────────────────────────────────
export async function logout(req, res) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
    res.json({ message: "ออกจากระบบสำเร็จ" });
  } catch (err) {
    console.error("[logout]", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
}
