// __tests__/auth.test.js
import { jest } from "@jest/globals";

// ── Mock external modules ────────────────────────────
jest.unstable_mockModule("bcrypt", () => ({
  default: {
    hash: jest.fn().mockResolvedValue("hashed_password"),
    compare: jest.fn(),
  },
}));

jest.unstable_mockModule("jsonwebtoken", () => ({
  default: {
    sign: jest.fn().mockReturnValue("mock_token"),
    verify: jest.fn(),
  },
}));

jest.unstable_mockModule("../db.js", () => ({
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((ops) => Promise.all(ops)),
  },
}));

// ── Dynamic imports (ต้องทำหลัง mock) ──────────────
const { default: bcrypt } = await import("bcrypt");
const { default: jwt } = await import("jsonwebtoken");
const { default: prisma } = await import("../db.js");
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
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 1,
        email: "test@example.com",
      });

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 1 }),
      );
    });

    test("อีเมลรูปแบบผิด — คืน 400", async () => {
      const { req, res } = mockReqRes({
        email: "not-an-email",
        password: "password123",
      });

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
      prisma.user.findUnique.mockResolvedValue({ id: 1 });

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    test("hash password ก่อน save", async () => {
      const { req, res } = mockReqRes({
        email: "test@example.com",
        password: "password123",
      });
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 1,
        email: "test@example.com",
      });

      await register(req, res);

      expect(bcrypt.hash).toHaveBeenCalledWith(
        "password123",
        expect.any(Number),
      );
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ password: "hashed_password" }),
        }),
      );
    });
  });

  // ── LOGIN ─────────────────────────────────────────
  describe("login", () => {
    // [FIX] controller คืนแค่ { accessToken } ใน body, refreshToken ส่งผ่าน cookie
    test("login สำเร็จ — คืน accessToken และ set refreshToken cookie", async () => {
      const { req, res } = mockReqRes({
        email: "test@example.com",
        password: "password123",
      });
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: "test@example.com",
        password: "hashed_password",
      });
      bcrypt.compare.mockResolvedValue(true);
      prisma.refreshToken.create.mockResolvedValue({});

      await login(req, res);

      // accessToken อยู่ใน response body
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: expect.any(String),
        }),
      );
      // refreshToken ส่งผ่าน cookie
      expect(res.cookie).toHaveBeenCalledWith(
        "refreshToken",
        expect.any(String),
        expect.any(Object),
      );
    });

    test("ไม่ส่ง email/password — คืน 400", async () => {
      const { req, res } = mockReqRes({ email: "", password: "" });

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("ไม่พบ user — คืน 401", async () => {
      const { req, res } = mockReqRes({
        email: "nobody@example.com",
        password: "password123",
      });
      prisma.user.findUnique.mockResolvedValue(null);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    test("รหัสผ่านผิด — คืน 401", async () => {
      const { req, res } = mockReqRes({
        email: "test@example.com",
        password: "wrongpass",
      });
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        password: "hashed_password",
      });
      bcrypt.compare.mockResolvedValue(false);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    test("login สำเร็จ — บันทึก refreshToken ใน DB", async () => {
      const { req, res } = mockReqRes({
        email: "test@example.com",
        password: "password123",
      });
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: "test@example.com",
        password: "hashed_password",
      });
      bcrypt.compare.mockResolvedValue(true);
      prisma.refreshToken.create.mockResolvedValue({});

      await login(req, res);

      // [FIX] controller เก็บ tokenHash ไม่ใช่ token โดยตรง
      expect(prisma.refreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 1,
            expiresAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  // ── REFRESH ───────────────────────────────────────
  describe("refresh", () => {
    // [FIX] refresh token ส่งผ่าน req.cookies ไม่ใช่ req.body
    test("refresh สำเร็จ — คืน accessToken ใหม่และ set cookie ใหม่", async () => {
      const { req, res } = mockReqRes(
        {},
        { refreshToken: "valid_refresh_token" },
      );
      jwt.verify.mockReturnValue({ userId: 1 });
      prisma.refreshToken.findUnique.mockResolvedValue({
        tokenHash: "some_hash",
        expiresAt: new Date(Date.now() + 86400000),
      });
      prisma.refreshToken.delete.mockResolvedValue({});
      prisma.refreshToken.create.mockResolvedValue({});

      await refresh(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: expect.any(String),
        }),
      );
      expect(res.cookie).toHaveBeenCalledWith(
        "refreshToken",
        expect.any(String),
        expect.any(Object),
      );
    });

    // [FIX] ไม่มี cookie เลย → 401
    test("ไม่ส่ง refreshToken — คืน 401", async () => {
      const { req, res } = mockReqRes({}, {});

      await refresh(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    // [FIX] token หมดอายุ → 403 (controller ตรวจ expiresAt แล้ว return 403)
    test("token หมดอายุใน DB — คืน 403", async () => {
      const { req, res } = mockReqRes({}, { refreshToken: "expired_token" });
      jwt.verify.mockReturnValue({ userId: 1 });
      prisma.refreshToken.findUnique.mockResolvedValue({
        tokenHash: "some_hash",
        expiresAt: new Date(Date.now() - 1000), // อดีต
      });

      await refresh(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    // [FIX] ไม่พบใน DB → 403
    test("ไม่พบ token ใน DB — คืน 403", async () => {
      const { req, res } = mockReqRes({}, { refreshToken: "unknown_token" });
      jwt.verify.mockReturnValue({ userId: 1 });
      prisma.refreshToken.findUnique.mockResolvedValue(null);
      prisma.refreshToken.deleteMany.mockResolvedValue({});

      await refresh(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    // [FIX] ตรวจแค่ว่า delete และ create ถูกเรียก (ไม่เช็ค token โดยตรงเพราะ controller hash ก่อน)
    test("refresh สำเร็จ — ลบ token เก่าและสร้างใหม่", async () => {
      const { req, res } = mockReqRes({}, { refreshToken: "old_token" });
      jwt.verify.mockReturnValue({ userId: 1 });
      prisma.refreshToken.findUnique.mockResolvedValue({
        tokenHash: "some_hash",
        expiresAt: new Date(Date.now() + 86400000),
      });
      prisma.refreshToken.delete.mockResolvedValue({});
      prisma.refreshToken.create.mockResolvedValue({});

      await refresh(req, res);

      expect(prisma.refreshToken.delete).toHaveBeenCalled();
      expect(prisma.refreshToken.create).toHaveBeenCalled();
    });
  });

  // ── LOGOUT ────────────────────────────────────────
  describe("logout", () => {
    // [FIX] token มาจาก req.cookies และ controller ลบด้วย tokenHash
    test("logout สำเร็จ — ลบ token และคืน 200", async () => {
      const { req, res } = mockReqRes({}, { refreshToken: "some_token" });
      prisma.refreshToken.deleteMany.mockResolvedValue({});

      await logout(req, res);

      // controller hash token ก่อน deleteMany → เช็คแค่ว่าถูกเรียก
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.any(String) }),
      );
    });

    test("logout โดยไม่ส่ง token — ยังคืน 200 ได้", async () => {
      const { req, res } = mockReqRes({}, {});

      await logout(req, res);

      expect(prisma.refreshToken.deleteMany).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });
  });
});
