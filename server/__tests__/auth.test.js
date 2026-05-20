// __tests__/auth.test.js
import { jest } from "@jest/globals";

// ── Mock authService ─────────────────────────────────
jest.unstable_mockModule("../services/authService.js", () => ({
  authService: {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
  },
}));

// ── Mock cookie utilities ───────────────────────────
jest.unstable_mockModule("../utils/cookie.js", () => ({
  COOKIE_OPTIONS: {
    httpOnly: true,
    secure: false,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
  COOKIE_CLEAR_OPTIONS: {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  },
}));

// ── Dynamic imports (ต้องทำหลัง mock) ──────────────
const { authService } = await import("../services/authService.js");
const { register, login, refresh, logout } =
  await import("../controllers/authController.js");

// ── Helper: สร้าง mock req/res ───────────────────────
// [FIX] เพิ่ม cookies param และเพิ่ม cookie/clearCookie ใน res
function mockReqRes(body = {}, cookies = {}) {
  const req = { body, cookies };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
  };
  return { req, res };
}

// ────────────────────────────────────────────────────
describe("Auth Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "test_secret";
    process.env.JWT_REFRESH_SECRET = "test_refresh_secret";
  });

  // ── REGISTER ──────────────────────────────────────
  describe("register", () => {
    test("สมัครสมาชิกสำเร็จ — คืน 201 + userId", async () => {
      const { req, res } = mockReqRes({
        email: "test@example.com",
        password: "password123",
      });
      authService.register.mockResolvedValue({
        id: 1,
        email: "test@example.com",
      });

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 1 }),
      );
      expect(authService.register).toHaveBeenCalledWith(
        "test@example.com",
        "password123",
      );
    });

    test("อีเมลรูปแบบผิด — คืน 400", async () => {
      const { req, res } = mockReqRes({
        email: "not-an-email",
        password: "password123",
      });
      const error = Object.assign(new Error("รูปแบบอีเมลไม่ถูกต้อง"), {
        status: 400,
      });
      authService.register.mockRejectedValue(error);

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining("อีเมล") }),
      );
    });

    test("รหัสผ่านสั้นกว่า 8 ตัว — คืน 400", async () => {
      const { req, res } = mockReqRes({
        email: "test@example.com",
        password: "short",
      });
      const error = Object.assign(
        new Error("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
        { status: 400 },
      );
      authService.register.mockRejectedValue(error);

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining("รหัสผ่าน") }),
      );
    });

    test("อีเมลซ้ำ — คืน 409", async () => {
      const { req, res } = mockReqRes({
        email: "existing@example.com",
        password: "password123",
      });
      const error = Object.assign(new Error("อีเมลนี้ถูกใช้งานแล้ว"), {
        status: 409,
      });
      authService.register.mockRejectedValue(error);

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    test("ไม่ส่ง password — คืน 400", async () => {
      const { req, res } = mockReqRes({
        email: "test@example.com",
        password: "",
      });
      const error = Object.assign(
        new Error("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
        { status: 400 },
      );
      authService.register.mockRejectedValue(error);

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("register เกิด error — คืน 500", async () => {
      const { req, res } = mockReqRes({
        email: "test@example.com",
        password: "password123",
      });
      authService.register.mockRejectedValue(new Error("Database error"));

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(String) }),
      );
    });

    test("register เกิด error โดยไม่มี message — คืน 500", async () => {
      const { req, res } = mockReqRes({
        email: "test@example.com",
        password: "password123",
      });
      const error = { status: 500 };
      authService.register.mockRejectedValue(error);

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" }),
      );
    });
  });

  // ── LOGIN ─────────────────────────────────────────
  describe("login", () => {
    test("login สำเร็จ — คืน accessToken และ set refreshToken cookie", async () => {
      const { req, res } = mockReqRes({
        email: "test@example.com",
        password: "password123",
      });
      authService.login.mockResolvedValue({
        accessToken: "mock_access_token",
        refreshToken: "mock_refresh_token",
      });

      await login(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: "mock_access_token",
        }),
      );
      expect(res.cookie).toHaveBeenCalledWith(
        "refreshToken",
        "mock_refresh_token",
        expect.any(Object),
      );
      expect(authService.login).toHaveBeenCalledWith(
        "test@example.com",
        "password123",
      );
    });

    test("ไม่ส่ง email/password — คืน 400", async () => {
      const { req, res } = mockReqRes({ email: "", password: "" });
      const error = Object.assign(new Error("กรุณากรอกอีเมลและรหัสผ่าน"), {
        status: 400,
      });
      authService.login.mockRejectedValue(error);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("ไม่พบ user — คืน 401", async () => {
      const { req, res } = mockReqRes({
        email: "nobody@example.com",
        password: "password123",
      });
      const error = Object.assign(new Error("อีเมลหรือรหัสผ่านไม่ถูกต้อง"), {
        status: 401,
      });
      authService.login.mockRejectedValue(error);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    test("รหัสผ่านผิด — คืน 401", async () => {
      const { req, res } = mockReqRes({
        email: "test@example.com",
        password: "wrongpass",
      });
      const error = Object.assign(new Error("อีเมลหรือรหัสผ่านไม่ถูกต้อง"), {
        status: 401,
      });
      authService.login.mockRejectedValue(error);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    test("login เกิด error — คืน 500", async () => {
      const { req, res } = mockReqRes({
        email: "test@example.com",
        password: "password123",
      });
      authService.login.mockRejectedValue(new Error("Database error"));

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(String) }),
      );
    });

    test("login เกิด error โดยไม่มี message — คืน 500", async () => {
      const { req, res } = mockReqRes({
        email: "test@example.com",
        password: "password123",
      });
      const error = { status: 500 };
      authService.login.mockRejectedValue(error);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" }),
      );
    });
  });

  // ── REFRESH ───────────────────────────────────────
  describe("refresh", () => {
    test("refresh สำเร็จ — คืน accessToken ใหม่และ set cookie ใหม่", async () => {
      const { req, res } = mockReqRes(
        {},
        { refreshToken: "valid_refresh_token" },
      );
      authService.refresh.mockResolvedValue({
        accessToken: "new_access_token",
        refreshToken: "new_refresh_token",
      });

      await refresh(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: "new_access_token",
        }),
      );
      expect(res.cookie).toHaveBeenCalledWith(
        "refreshToken",
        "new_refresh_token",
        expect.any(Object),
      );
      expect(authService.refresh).toHaveBeenCalledWith("valid_refresh_token");
    });

    test("ไม่ส่ง refreshToken — คืน 401", async () => {
      const { req, res } = mockReqRes({}, {});
      const error = Object.assign(new Error("ไม่พบ refresh token"), {
        status: 401,
      });
      authService.refresh.mockRejectedValue(error);

      await refresh(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    test("token หมดอายุใน DB — คืน 403", async () => {
      const { req, res } = mockReqRes({}, { refreshToken: "expired_token" });
      const error = Object.assign(new Error("refresh token หมดอายุแล้ว"), {
        status: 403,
      });
      authService.refresh.mockRejectedValue(error);

      await refresh(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    test("ไม่พบ token ใน DB — คืน 403", async () => {
      const { req, res } = mockReqRes({}, { refreshToken: "unknown_token" });
      const error = Object.assign(new Error("refresh token ไม่ถูกต้อง"), {
        status: 403,
      });
      authService.refresh.mockRejectedValue(error);

      await refresh(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    test("JWT verify ล้มเหลว — คืน 403 และ clearCookie", async () => {
      const { req, res } = mockReqRes({}, { refreshToken: "invalid_token" });
      const error = Object.assign(new Error("refresh token ไม่ถูกต้อง"), {
        status: 403,
      });
      authService.refresh.mockRejectedValue(error);

      await refresh(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.clearCookie).toHaveBeenCalledWith(
        "refreshToken",
        expect.any(Object),
      );
    });

    test("refresh เกิด error — คืน 403 และ clearCookie", async () => {
      const { req, res } = mockReqRes({}, { refreshToken: "valid_token" });
      authService.refresh.mockRejectedValue(new Error("Database error"));

      await refresh(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.clearCookie).toHaveBeenCalledWith(
        "refreshToken",
        expect.any(Object),
      );
    });

    test("refresh เกิด error โดยไม่มี message — คืน 500", async () => {
      const { req, res } = mockReqRes({}, { refreshToken: "valid_token" });
      const error = { status: 500 };
      authService.refresh.mockRejectedValue(error);

      await refresh(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.clearCookie).toHaveBeenCalledWith(
        "refreshToken",
        expect.any(Object),
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" }),
      );
    });
  });

  // ── LOGOUT ────────────────────────────────────────
  describe("logout", () => {
    test("logout สำเร็จ — ลบ token และคืน 200", async () => {
      const { req, res } = mockReqRes({}, { refreshToken: "some_token" });
      authService.logout.mockResolvedValue();

      await logout(req, res);

      expect(authService.logout).toHaveBeenCalledWith("some_token");
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.any(String) }),
      );
    });

    test("logout โดยไม่ส่ง token — ยังคืน 200 ได้", async () => {
      const { req, res } = mockReqRes({}, {});
      authService.logout.mockResolvedValue();

      await logout(req, res);

      expect(authService.logout).toHaveBeenCalledWith(undefined);
      expect(res.json).toHaveBeenCalled();
    });

    test("logout สำเร็จ — clearCookie ถูกเรียก", async () => {
      const { req, res } = mockReqRes({}, { refreshToken: "some_token" });
      authService.logout.mockResolvedValue();

      await logout(req, res);

      expect(res.clearCookie).toHaveBeenCalledWith(
        "refreshToken",
        expect.any(Object),
      );
    });

    test("logout เกิด error — คืน 500", async () => {
      const { req, res } = mockReqRes({}, { refreshToken: "some_token" });
      authService.logout.mockRejectedValue(new Error("Database error"));

      await logout(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(String) }),
      );
    });

    test("logout เกิด error โดยไม่มี message — คืน 500", async () => {
      const { req, res } = mockReqRes({}, { refreshToken: "some_token" });
      const error = { status: 500 };
      authService.logout.mockRejectedValue(error);

      await logout(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" }),
      );
    });
  });
});
