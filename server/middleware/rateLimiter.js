import rateLimit from "express-rate-limit";
import "dotenv/config";

// สำหรับ auth routes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX) || /* istanbul ignore next */ 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "ลองใหม่บ่อยเกินไป กรุณารอสักครู่แล้วลองอีกครั้ง" },
});

// สำหรับ forgot-password endpoint (3 requests per hour)
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "ลองใหม่บ่อยเกินไป กรุณารอสักครู่แล้วลองอีกครั้ง" },
});

// สำหรับ API ทั่วไป
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.API_RATE_LIMIT_MAX) || /* istanbul ignore next */ 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "มีการเรียกใช้งานมากเกินไป กรุณารอสักครู่แล้วลองอีกครั้ง" },
});
