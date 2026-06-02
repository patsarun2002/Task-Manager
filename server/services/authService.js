import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
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

    return {
      accessToken: generateAccessToken(user.id),
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name },
    };
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

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });
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
      user: { id: user.id, email: user.email, name: user.name },
    };
  },

  async logout(rawToken) {
    if (rawToken) {
      await prisma.refreshToken.deleteMany({
        where: { tokenHash: hashToken(rawToken) },
      });
    }
  },

  async updateProfile(userId, name, email) {
    if (!name && !email) {
      throw Object.assign(new Error("กรุณาระบุข้อมูลที่ต้องการแก้ไข"), {
        status: 400,
      });
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw Object.assign(new Error("รูปแบบอีเมลไม่ถูกต้อง"), {
          status: 400,
        });
      }

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== userId) {
        throw Object.assign(new Error("อีเมลนี้ถูกใช้งานแล้ว"), {
          status: 409,
        });
      }
    }

    const updateData = {};
    if (name !== undefined && name !== "") updateData.name = name;
    if (email !== undefined && email !== "") updateData.email = email;

    return prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, email: true, name: true, createdAt: true },
    });
  },

  async changePassword(userId, currentPassword, newPassword) {
    if (!currentPassword || !newPassword) {
      throw Object.assign(
        new Error("กรุณาระบุรหัสผ่านปัจจุบันและรหัสผ่านใหม่"),
        {
          status: 400,
        },
      );
    }

    if (newPassword.length < 8) {
      throw Object.assign(new Error("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"), {
        status: 400,
      });
    }

    if (currentPassword === newPassword) {
      throw Object.assign(
        new Error("รหัสผ่านใหม่ต้องแตกต่างจากรหัสผ่านปัจจุบัน"),
        {
          status: 400,
        },
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw Object.assign(new Error("ไม่พบผู้ใช้"), { status: 404 });
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      throw Object.assign(new Error("รหัสผ่านปัจจุบันไม่ถูกต้อง"), {
        status: 401,
      });
    }

    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { password: hashed, passwordChangedAt: new Date() },
      }),
      prisma.refreshToken.deleteMany({ where: { userId } }),
    ]);

    const refreshToken = generateRefreshToken(userId);
    await prisma.refreshToken.create({
      data: {
        tokenHash: hashToken(refreshToken),
        userId,
        expiresAt: new Date(Date.now() + REFRESH_TTL),
      },
    });

    return { accessToken: generateAccessToken(userId), refreshToken };
  },

  async forgotPassword(email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return;
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

    try {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        family: 4,
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: email,
        subject: "รีเซ็ตรหัสผ่านของคุณ",
        html: `
          <p>คุณได้ขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ</p>
          <p>คลิกลิงก์ด้านล่างเพื่อรีเซ็ตรหัสผ่าน:</p>
          <a href="${resetLink}">${resetLink}</a>
          <p>ลิงก์นี้จะหมดอายุใน 15 นาที</p>
        `,
      });
    } catch (err) {
      console.error("[forgotPassword] email send failed:", err);
      throw Object.assign(new Error("ไม่สามารถส่งอีเมลได้"), { status: 500 });
    }
  },

  async resetPassword(token, newPassword) {
    if (!newPassword || newPassword.length < 8) {
      throw Object.assign(new Error("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"), {
        status: 400,
      });
    }

    const tokenHash = hashToken(token);
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetToken) {
      throw Object.assign(new Error("ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้อง"), {
        status: 400,
      });
    }

    if (resetToken.used) {
      throw Object.assign(new Error("ลิงก์รีเซ็ตรหัสผ่านถูกใช้งานแล้ว"), {
        status: 400,
      });
    }

    if (resetToken.expiresAt < new Date()) {
      throw Object.assign(new Error("ลิงก์รีเซ็ตรหัสผ่านหมดอายุแล้ว"), {
        status: 400,
      });
    }

    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashed, passwordChangedAt: new Date() },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
      prisma.refreshToken.deleteMany({ where: { userId: resetToken.userId } }),
    ]);
  },
};
