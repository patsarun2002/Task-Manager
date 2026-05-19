import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import prisma from "../db.js";

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

// ── helpers ──────────────────────────────────────────
function generateAccessToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  });
}

function generateRefreshToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
}

// [P1-Security] hash token ด้วย SHA-256 ก่อน store/compare
// ทำให้แม้ DB รั่ว ก็ไม่สามารถนำ token ไป reuse ได้ทันที
function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// ── cookie options ────────────────────────────────────
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const COOKIE_CLEAR_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
};

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

    const refreshToken = generateRefreshToken(user.id);
    const accessToken = generateAccessToken(user.id);

    // [P1-Security] เก็บ hash แทน plain token
    await prisma.refreshToken.create({
      data: {
        tokenHash: hashToken(refreshToken),
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
    res.json({ accessToken });
  } catch (err) {
    console.error("[login]", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
}

// ── refresh ───────────────────────────────────────────
export async function refresh(req, res) {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ error: "ไม่พบ refresh token" });
    }

    // verify ก่อน แล้วค่อย touch DB
    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      res.clearCookie("refreshToken", COOKIE_CLEAR_OPTIONS);
      return res.status(403).json({ error: "refresh token ไม่ถูกต้อง" });
    }

    // [P1-Security] lookup ด้วย hash
    const tokenHash = hashToken(refreshToken);
    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!stored) {
      // token verify ผ่านแต่ไม่อยู่ใน DB → สงสัย reuse attack → revoke ทุก session
      await prisma.refreshToken.deleteMany({
        where: { userId: payload.userId },
      });
      res.clearCookie("refreshToken", COOKIE_CLEAR_OPTIONS);
      return res.status(403).json({ error: "refresh token ไม่ถูกต้อง" });
    }

    if (stored.expiresAt < new Date()) {
      res.clearCookie("refreshToken", COOKIE_CLEAR_OPTIONS);
      return res.status(403).json({ error: "refresh token หมดอายุแล้ว" });
    }

    // rotate: delete + create แบบ atomic
    const newRefreshToken = generateRefreshToken(payload.userId);
    await prisma.$transaction([
      prisma.refreshToken.delete({ where: { tokenHash } }),
      prisma.refreshToken.create({
        data: {
          tokenHash: hashToken(newRefreshToken),
          userId: payload.userId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    const accessToken = generateAccessToken(payload.userId);
    res.cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS);
    res.json({ accessToken });
  } catch (err) {
    console.error("[refresh]", err);
    res.clearCookie("refreshToken", COOKIE_CLEAR_OPTIONS);
    res.status(403).json({ error: "refresh token ไม่ถูกต้อง" });
  }
}

// ── logout ────────────────────────────────────────────
export async function logout(req, res) {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      // [P1-Security] lookup/delete ด้วย hash
      await prisma.refreshToken.deleteMany({
        where: { tokenHash: hashToken(refreshToken) },
      });
    }
    res.clearCookie("refreshToken", COOKIE_CLEAR_OPTIONS);
    res.json({ message: "ออกจากระบบสำเร็จ" });
  } catch (err) {
    console.error("[logout]", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
}
