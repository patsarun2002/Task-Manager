// __tests__/middleware.test.js
import { jest } from "@jest/globals";

// ── Mock jsonwebtoken ────────────────────────────────
jest.unstable_mockModule("jsonwebtoken", () => ({
  default: {
    verify: jest.fn(),
  },
}));

const { default: jwt } = await import("jsonwebtoken");
const { verifyToken } = await import("../middleware/auth.js");
const { validateTask } = await import("../middleware/validate.js");
const { sanitizeBody } = await import("../middleware/sanitize.js");

// ── Helper ────────────────────────────────────────────
function mockMiddleware({ headers = {}, body = {}, method = "POST" } = {}) {
  const req = { headers, body, method };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
}

// ────────────────────────────────────────────────────
describe("Middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "test_secret";
  });

  // ── verifyToken ───────────────────────────────────
  describe("verifyToken", () => {
    test("token ถูกต้อง — เรียก next() และ set req.user", () => {
      const { req, res, next } = mockMiddleware({
        headers: { authorization: "Bearer valid_token" },
      });
      jwt.verify.mockReturnValue({ userId: 42 });

      verifyToken(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual({ id: 42 });
    });

    test("ไม่มี Authorization header — คืน 401", () => {
      const { req, res, next } = mockMiddleware();

      verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test("header มีแค่ Bearer ไม่มี token — คืน 401", () => {
      const { req, res, next } = mockMiddleware({
        headers: { authorization: "Bearer " },
      });

      verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    test("token หมดอายุ/ไม่ถูกต้อง — คืน 403", () => {
      const { req, res, next } = mockMiddleware({
        headers: { authorization: "Bearer bad_token" },
      });
      jwt.verify.mockImplementation(() => {
        throw new Error("invalid token");
      });

      verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  // ── validateTask ──────────────────────────────────
  describe("validateTask", () => {
    test("POST ที่ถูกต้อง — เรียก next()", () => {
      const { req, res, next } = mockMiddleware({
        method: "POST",
        body: { title: "Valid task", priority: "high", status: "pending" },
      });

      validateTask(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test("POST ไม่มี title — คืน 400", () => {
      const { req, res, next } = mockMiddleware({
        method: "POST",
        body: { title: "" },
      });

      validateTask(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    test("title เกิน 100 ตัวอักษร — คืน 400", () => {
      const { req, res, next } = mockMiddleware({
        method: "PUT",
        body: { title: "a".repeat(101) },
      });

      validateTask(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("priority ไม่ถูกต้อง — คืน 400", () => {
      const { req, res, next } = mockMiddleware({
        method: "PUT",
        body: { priority: "urgent" }, // ไม่ใช่ low/medium/high
      });

      validateTask(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("status ไม่ถูกต้อง — คืน 400", () => {
      const { req, res, next } = mockMiddleware({
        method: "PUT",
        body: { status: "in-progress" }, // ไม่ใช่ pending/done
      });

      validateTask(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("deadline รูปแบบผิด — คืน 400", () => {
      const { req, res, next } = mockMiddleware({
        method: "PUT",
        body: { deadline: "not-a-date" },
      });

      validateTask(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("deadlineTime รูปแบบผิด — คืน 400", () => {
      const { req, res, next } = mockMiddleware({
        method: "PUT",
        body: { deadlineTime: "25:99" },
      });

      validateTask(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("deadlineTime HH:MM ถูกต้อง — เรียก next()", () => {
      const { req, res, next } = mockMiddleware({
        method: "PUT",
        body: { deadlineTime: "09:30" },
      });

      validateTask(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test("recurring daily — เรียก next()", () => {
      const { req, res, next } = mockMiddleware({
        method: "POST",
        body: {
          title: "Daily",
          recurring: { type: "daily", days: [] },
        },
      });

      validateTask(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test("recurring weekly ไม่มี days — คืน 400", () => {
      const { req, res, next } = mockMiddleware({
        method: "POST",
        body: {
          title: "Weekly",
          recurring: { type: "weekly", days: [] },
        },
      });

      validateTask(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("recurring weekly days มีค่าผิด (> 6) — คืน 400", () => {
      const { req, res, next } = mockMiddleware({
        method: "POST",
        body: {
          title: "Weekly",
          recurring: { type: "weekly", days: [1, 7] },
        },
      });

      validateTask(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("note เกิน 500 ตัวอักษร — คืน 400", () => {
      const { req, res, next } = mockMiddleware({
        method: "PUT",
        body: { note: "x".repeat(501) },
      });

      validateTask(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("category เกิน 50 ตัวอักษร — คืน 400", () => {
      const { req, res, next } = mockMiddleware({
        method: "PUT",
        body: { category: "x".repeat(51) },
      });

      validateTask(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ── sanitizeBody ──────────────────────────────────
  describe("sanitizeBody", () => {
    test("ล้าง XSS script tag ออก", () => {
      const { req, res, next } = mockMiddleware({
        body: { title: '<script>alert("xss")</script>Hello' },
      });

      sanitizeBody(req, res, next);

      expect(req.body.title).not.toContain("<script>");
      expect(req.body.title).toContain("Hello");
      expect(next).toHaveBeenCalled();
    });

    test("ค่าปกติไม่เปลี่ยนแปลง", () => {
      const { req, res, next } = mockMiddleware({
        body: { title: "Clean task title", priority: "high" },
      });

      sanitizeBody(req, res, next);

      expect(req.body.title).toBe("Clean task title");
      expect(req.body.priority).toBe("high");
      expect(next).toHaveBeenCalled();
    });

    test("sanitize nested object", () => {
      const { req, res, next } = mockMiddleware({
        body: { recurring: { type: "<img onerror=alert(1)>daily" } },
      });

      sanitizeBody(req, res, next);

      expect(req.body.recurring.type).not.toContain("onerror");
      expect(next).toHaveBeenCalled();
    });

    test("sanitize array of strings", () => {
      const { req, res, next } = mockMiddleware({
        body: { tags: ["clean", '<script>bad</script>'] },
      });

      sanitizeBody(req, res, next);

      expect(req.body.tags[1]).not.toContain("<script>");
      expect(next).toHaveBeenCalled();
    });

    test("body ที่ไม่ใช่ object — ผ่านไปได้เลย", () => {
      const req = { body: null };
      const res = {};
      const next = jest.fn();

      sanitizeBody(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test("ตัวเลขและ boolean ไม่โดน sanitize", () => {
      const { req, res, next } = mockMiddleware({
        body: { count: 5, active: true },
      });

      sanitizeBody(req, res, next);

      expect(req.body.count).toBe(5);
      expect(req.body.active).toBe(true);
      expect(next).toHaveBeenCalled();
    });
  });
});