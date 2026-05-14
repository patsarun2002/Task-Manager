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
  },
}));

// ── Dynamic imports (ต้องทำหลัง mock) ──────────────
const { default: bcrypt } = await import("bcrypt");
const { default: jwt } = await import("jsonwebtoken");
const { default: prisma } = await import("../db.js");
const { register, login, refresh, logout } =
  await import("../controllers/authController.js");

// ── Helper: สร้าง mock req/res ───────────────────────
function mockReqRes(body = {}) {
  const req = { body };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
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
    test("login สำเร็จ — คืน accessToken + refreshToken", async () => {
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

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        }),
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
    test("refresh สำเร็จ — คืน token ใหม่", async () => {
      const { req, res } = mockReqRes({ refreshToken: "valid_refresh_token" });
      prisma.refreshToken.findUnique.mockResolvedValue({
        token: "valid_refresh_token",
        expiresAt: new Date(Date.now() + 86400000),
      });
      jwt.verify.mockReturnValue({ userId: 1 });
      prisma.refreshToken.delete.mockResolvedValue({});
      prisma.refreshToken.create.mockResolvedValue({});

      await refresh(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        }),
      );
    });

    test("ไม่ส่ง refreshToken — คืน 401", async () => {
      const { req, res } = mockReqRes({});

      await refresh(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    test("token หมดอายุใน DB — คืน 403", async () => {
      const { req, res } = mockReqRes({ refreshToken: "expired_token" });
      prisma.refreshToken.findUnique.mockResolvedValue({
        token: "expired_token",
        expiresAt: new Date(Date.now() - 1000), // อดีต
      });

      await refresh(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    test("ไม่พบ token ใน DB — คืน 403", async () => {
      const { req, res } = mockReqRes({ refreshToken: "unknown_token" });
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      await refresh(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    test("refresh สำเร็จ — ลบ token เก่าและสร้างใหม่", async () => {
      const { req, res } = mockReqRes({ refreshToken: "old_token" });
      prisma.refreshToken.findUnique.mockResolvedValue({
        token: "old_token",
        expiresAt: new Date(Date.now() + 86400000),
      });
      jwt.verify.mockReturnValue({ userId: 1 });
      prisma.refreshToken.delete.mockResolvedValue({});
      prisma.refreshToken.create.mockResolvedValue({});

      await refresh(req, res);

      expect(prisma.refreshToken.delete).toHaveBeenCalledWith({
        where: { token: "old_token" },
      });
      expect(prisma.refreshToken.create).toHaveBeenCalled();
    });
  });

  // ── LOGOUT ────────────────────────────────────────
  describe("logout", () => {
    test("logout สำเร็จ — ลบ token และคืน 200", async () => {
      const { req, res } = mockReqRes({ refreshToken: "some_token" });
      prisma.refreshToken.deleteMany.mockResolvedValue({});

      await logout(req, res);

      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { token: "some_token" },
      });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.any(String) }),
      );
    });

    test("logout โดยไม่ส่ง token — ยังคืน 200 ได้", async () => {
      const { req, res } = mockReqRes({});

      await logout(req, res);

      expect(prisma.refreshToken.deleteMany).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });
  });
});
