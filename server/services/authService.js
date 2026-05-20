import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../db.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import { hashToken } from "../utils/hash.js";

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
const REFRESH_TTL = 7 * 24 * 60 * 60 * 1000;

export const authService = {
  async register(email, password) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw Object.assign(new Error("รูปแบบอีเมลไม่ถูกต้อง"), { status: 400 });
    }
    if (!password || password.length < 8) {
      throw Object.assign(new Error("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"), {
        status: 400,
      });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      throw Object.assign(new Error("อีเมลนี้ถูกใช้งานแล้ว"), { status: 409 });

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    return prisma.user.create({ data: { email, password: hashed } });
  },

  async login(email, password) {
    if (!email || !password) {
      throw Object.assign(new Error("กรุณากรอกอีเมลและรหัสผ่าน"), {
        status: 400,
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    const valid = user && (await bcrypt.compare(password, user.password));
    if (!valid)
      throw Object.assign(new Error("อีเมลหรือรหัสผ่านไม่ถูกต้อง"), {
        status: 401,
      });

    const refreshToken = generateRefreshToken(user.id);
    await prisma.refreshToken.create({
      data: {
        tokenHash: hashToken(refreshToken),
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_TTL),
      },
    });

    return { accessToken: generateAccessToken(user.id), refreshToken };
  },

  async refresh(rawToken) {
    if (!rawToken)
      throw Object.assign(new Error("ไม่พบ refresh token"), { status: 401 });

    let payload;
    try {
      payload = jwt.verify(rawToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      throw Object.assign(new Error("refresh token ไม่ถูกต้อง"), {
        status: 403,
      });
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(rawToken) },
    });
    if (!stored) {
      await prisma.refreshToken.deleteMany({
        where: { userId: payload.userId },
      });
      throw Object.assign(new Error("refresh token ไม่ถูกต้อง"), {
        status: 403,
      });
    }
    if (stored.expiresAt < new Date()) {
      throw Object.assign(new Error("refresh token หมดอายุแล้ว"), {
        status: 403,
      });
    }

    const newRefreshToken = generateRefreshToken(payload.userId);
    await prisma.$transaction([
      prisma.refreshToken.delete({ where: { tokenHash: hashToken(rawToken) } }),
      prisma.refreshToken.create({
        data: {
          tokenHash: hashToken(newRefreshToken),
          userId: payload.userId,
          expiresAt: new Date(Date.now() + REFRESH_TTL),
        },
      }),
    ]);

    return {
      accessToken: generateAccessToken(payload.userId),
      refreshToken: newRefreshToken,
    };
  },

  async logout(rawToken) {
    if (rawToken) {
      await prisma.refreshToken.deleteMany({
        where: { tokenHash: hashToken(rawToken) },
      });
    }
  },
};
