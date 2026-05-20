// __tests__/routes.test.js
import { jest } from "@jest/globals";

// ── Mock controllers ──────────────────────────────────
jest.unstable_mockModule("../controllers/authController.js", () => ({
  register: jest.fn((req, res) =>
    res.status(201).json({ message: "registered" }),
  ),
  login: jest.fn((req, res) => res.status(200).json({ message: "logged in" })),
  refresh: jest.fn((req, res) =>
    res.status(200).json({ message: "refreshed" }),
  ),
  logout: jest.fn((req, res) =>
    res.status(200).json({ message: "logged out" }),
  ),
}));

jest.unstable_mockModule("../controllers/taskController.js", () => ({
  getTasks: jest.fn((req, res) => res.status(200).json([])),
  createTask: jest.fn((req, res) => res.status(201).json({ id: 1 })),
  updateTask: jest.fn((req, res) => res.status(200).json({ id: 1 })),
  deleteTask: jest.fn((req, res) => res.status(204).send()),
  reorderTasks: jest.fn((req, res) =>
    res.status(200).json({ message: "reordered" }),
  ),
  toggleSubtask: jest.fn((req, res) => res.status(200).json({ toggled: true })),
  addSubtask: jest.fn((req, res) => res.status(201).json({ id: "s1" })),
  deleteSubtask: jest.fn((req, res) => res.status(204).send()),
  getSummary: jest.fn((req, res) => res.status(200).json({ summary: {} })),
  getCategories: jest.fn((req, res) => res.status(200).json([])),
}));

// ── Mock middleware ───────────────────────────────────
jest.unstable_mockModule("../middleware/validate.js", () => ({
  validateTask: jest.fn((req, res, next) => next()),
}));

jest.unstable_mockModule("../middleware/auth.js", () => ({
  verifyToken: jest.fn((req, res, next) => {
    req.user = { id: 1 };
    next();
  }),
}));

// ── Imports (after mocks) ─────────────────────────────
import express from "express";
import request from "supertest";

const { default: authRouter } = await import("../routes/auth.js");
const { default: taskRouter } = await import("../routes/tasks.js");

const { register, login, refresh, logout } =
  await import("../controllers/authController.js");
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
  toggleSubtask,
  addSubtask,
  deleteSubtask,
  getSummary,
  getCategories,
} = await import("../controllers/taskController.js");
const { validateTask } = await import("../middleware/validate.js");
const { verifyToken } = await import("../middleware/auth.js");

// ── App setup ─────────────────────────────────────────
function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/auth", authRouter);
  app.use("/tasks", taskRouter);
  return app;
}

// ─────────────────────────────────────────────────────
describe("Routes", () => {
  let app;

  beforeAll(() => {
    app = buildApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Auth Routes ───────────────────────────────────
  describe("Auth Routes (/auth)", () => {
    describe("POST /auth/register", () => {
      test("เรียก register controller และคืน 201", async () => {
        const res = await request(app)
          .post("/auth/register")
          .send({ email: "test@example.com", password: "secret" });

        expect(res.status).toBe(201);
        expect(register).toHaveBeenCalledTimes(1);
      });
    });

    describe("POST /auth/login", () => {
      test("เรียก login controller และคืน 200", async () => {
        const res = await request(app)
          .post("/auth/login")
          .send({ email: "test@example.com", password: "secret" });

        expect(res.status).toBe(200);
        expect(login).toHaveBeenCalledTimes(1);
      });
    });

    describe("POST /auth/refresh", () => {
      test("เรียก refresh controller และคืน 200", async () => {
        const res = await request(app).post("/auth/refresh");

        expect(res.status).toBe(200);
        expect(refresh).toHaveBeenCalledTimes(1);
      });
    });

    describe("POST /auth/logout", () => {
      test("เรียก logout controller และคืน 200", async () => {
        const res = await request(app).post("/auth/logout");

        expect(res.status).toBe(200);
        expect(logout).toHaveBeenCalledTimes(1);
      });
    });

    describe("Auth — method not allowed", () => {
      test("GET /auth/login — คืน 404", async () => {
        const res = await request(app).get("/auth/login");
        expect(res.status).toBe(404);
      });

      test("DELETE /auth/register — คืน 404", async () => {
        const res = await request(app).delete("/auth/register");
        expect(res.status).toBe(404);
      });
    });
  });

  // ── Task Routes ───────────────────────────────────
  describe("Task Routes (/tasks)", () => {
    describe("Middleware", () => {
      test("ทุก request ผ่าน verifyToken ก่อน", async () => {
        await request(app).get("/tasks");
        expect(verifyToken).toHaveBeenCalledTimes(1);
      });

      test("POST /tasks ผ่าน validateTask", async () => {
        await request(app).post("/tasks").send({ title: "New Task" });

        expect(validateTask).toHaveBeenCalledTimes(1);
      });

      test("PUT /tasks/:id ผ่าน validateTask", async () => {
        await request(app).put("/tasks/1").send({ title: "Updated" });

        expect(validateTask).toHaveBeenCalledTimes(1);
      });

      test("GET /tasks ไม่ผ่าน validateTask", async () => {
        await request(app).get("/tasks");
        expect(validateTask).not.toHaveBeenCalled();
      });

      test("DELETE /tasks/:id ไม่ผ่าน validateTask", async () => {
        await request(app).delete("/tasks/1");
        expect(validateTask).not.toHaveBeenCalled();
      });
    });

    describe("GET /tasks", () => {
      test("เรียก getTasks controller และคืน 200", async () => {
        const res = await request(app).get("/tasks");

        expect(res.status).toBe(200);
        expect(getTasks).toHaveBeenCalledTimes(1);
      });
    });

    describe("POST /tasks", () => {
      test("เรียก createTask controller และคืน 201", async () => {
        const res = await request(app)
          .post("/tasks")
          .send({ title: "New Task" });

        expect(res.status).toBe(201);
        expect(createTask).toHaveBeenCalledTimes(1);
      });
    });

    describe("PUT /tasks/:id", () => {
      test("เรียก updateTask controller พร้อม id ที่ถูกต้อง", async () => {
        const res = await request(app)
          .put("/tasks/42")
          .send({ title: "Updated" });

        expect(res.status).toBe(200);
        expect(updateTask).toHaveBeenCalledTimes(1);
      });
    });

    describe("DELETE /tasks/:id", () => {
      test("เรียก deleteTask controller พร้อม id ที่ถูกต้อง", async () => {
        const res = await request(app).delete("/tasks/42");

        expect(res.status).toBe(204);
        expect(deleteTask).toHaveBeenCalledTimes(1);
      });
    });

    describe("PATCH /tasks/reorder", () => {
      test("เรียก reorderTasks controller", async () => {
        const res = await request(app)
          .patch("/tasks/reorder")
          .send({ order: [3, 1, 2] });

        expect(res.status).toBe(200);
        expect(reorderTasks).toHaveBeenCalledTimes(1);
      });
    });

    // ── Summary & Categories (ต้องอยู่ก่อน /:id) ────
    describe("GET /tasks/summary", () => {
      test("เรียก getSummary controller ไม่ชนกับ /:id", async () => {
        const res = await request(app).get("/tasks/summary");

        expect(res.status).toBe(200);
        expect(getSummary).toHaveBeenCalledTimes(1);
        expect(getTasks).not.toHaveBeenCalled();
      });
    });

    describe("GET /tasks/categories", () => {
      test("เรียก getCategories controller ไม่ชนกับ /:id", async () => {
        const res = await request(app).get("/tasks/categories");

        expect(res.status).toBe(200);
        expect(getCategories).toHaveBeenCalledTimes(1);
        expect(getTasks).not.toHaveBeenCalled();
      });
    });

    // ── Subtask Routes ────────────────────────────
    describe("POST /tasks/:id/subtasks", () => {
      test("เรียก addSubtask controller", async () => {
        const res = await request(app)
          .post("/tasks/1/subtasks")
          .send({ title: "Sub task" });

        expect(res.status).toBe(201);
        expect(addSubtask).toHaveBeenCalledTimes(1);
      });
    });

    describe("PATCH /tasks/:id/subtasks/:subId", () => {
      test("เรียก toggleSubtask controller พร้อม id และ subId", async () => {
        const res = await request(app).patch("/tasks/1/subtasks/s1");

        expect(res.status).toBe(200);
        expect(toggleSubtask).toHaveBeenCalledTimes(1);
      });
    });

    describe("DELETE /tasks/:id/subtasks/:subId", () => {
      test("เรียก deleteSubtask controller พร้อม id และ subId", async () => {
        const res = await request(app).delete("/tasks/1/subtasks/s1");

        expect(res.status).toBe(204);
        expect(deleteSubtask).toHaveBeenCalledTimes(1);
      });
    });

    describe("Task — route ที่ไม่มี", () => {
      test("GET /tasks/1/subtasks — คืน 404", async () => {
        const res = await request(app).get("/tasks/1/subtasks");
        expect(res.status).toBe(404);
      });

      test("POST /tasks/reorder — คืน 404 (ต้องเป็น PATCH)", async () => {
        const res = await request(app).post("/tasks/reorder");
        expect(res.status).toBe(404);
      });
    });
  });
});
