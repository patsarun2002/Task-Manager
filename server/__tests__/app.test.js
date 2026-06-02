// __tests__/app.test.js
import { jest } from "@jest/globals";

jest.unstable_mockModule("../middleware/rateLimiter.js", () => ({
  authLimiter: (req, res, next) => next(),
  apiLimiter: (req, res, next) => next(),
}));

jest.unstable_mockModule("../middleware/sanitize.js", () => ({
  sanitizeBody: (req, res, next) => next(),
}));

jest.unstable_mockModule("../routes/auth.js", async () => {
  const { Router } = await import("express");
  return { default: Router() };
});

jest.unstable_mockModule("../routes/tasks.js", async () => {
  const { Router } = await import("express");
  return { default: Router() };
});

import request from "supertest";
const { default: app } = await import("../app.js");

describe("App", () => {
  describe("GET /health", () => {
    test("คืน 200 พร้อม status และ timestamp", async () => {
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe("GET /", () => {
    test("คืน 200 พร้อม message", async () => {
      const res = await request(app).get("/");
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Server running");
    });
  });

  describe("404 handler", () => {
    test("route ที่ไม่มี — คืน 404", async () => {
      const res = await request(app).get("/not-found");
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Route not found");
    });

    test("POST route ที่ไม่มี — คืน 404", async () => {
      const res = await request(app).post("/unknown/path");
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Route not found");
    });
  });

  describe("CORS", () => {
    test("ไม่มี origin — ผ่านได้", async () => {
      const res = await request(app).get("/");
      expect(res.status).toBe(200);
    });

    test("origin ที่อนุญาต — ผ่านได้", async () => {
      process.env.ALLOWED_ORIGIN = "http://localhost:5173";
      const res = await request(app)
        .get("/")
        .set("Origin", "http://localhost:5173");
      expect(res.status).toBe(200);
    });

    test("origin ที่ไม่อนุญาต — คืน 500 ผ่าน error handler", async () => {
      process.env.ALLOWED_ORIGIN = "http://allowed.com";
      const res = await request(app).get("/").set("Origin", "http://evil.com");
      expect(res.status).toBe(500);
      expect(res.body.error).toBe("Something went wrong");
    });

    test("มี ALLOWED_ORIGIN หลายค่า — split ถูกต้อง", async () => {
      process.env.ALLOWED_ORIGIN = "http://a.com, http://b.com";
      const res = await request(app).get("/").set("Origin", "http://a.com");
      expect(res.status).toBe(200);
    });

    test("ไม่มี ALLOWED_ORIGIN — ผ่านได้", async () => {
      delete process.env.ALLOWED_ORIGIN;
      const res = await request(app).get("/");
      expect(res.status).toBe(200);
    });
  });

  describe("Helmet", () => {
    test("มี X-Content-Type-Options header", async () => {
      const res = await request(app).get("/");
      expect(res.headers["x-content-type-options"]).toBe("nosniff");
    });

    test("มี X-Frame-Options header", async () => {
      const res = await request(app).get("/");
      expect(res.headers["x-frame-options"]).toBeDefined();
    });
  });

  describe("JSON middleware", () => {
    test("รับ JSON body ได้", async () => {
      const res = await request(app)
        .get("/")
        .set("Content-Type", "application/json")
        .send(JSON.stringify({ test: true }));
      expect(res.status).toBe(200);
    });
  });

  describe("Morgan logger", () => {
    test("NODE_ENV=production ใช้ combined format", async () => {
      process.env.NODE_ENV = "production";
      const res = await request(app).get("/");
      expect(res.status).toBe(200);
      delete process.env.NODE_ENV;
    });

    test("NODE_ENV อื่น ใช้ dev format", async () => {
      process.env.NODE_ENV = "development";
      const res = await request(app).get("/");
      expect(res.status).toBe(200);
    });
  });
});
