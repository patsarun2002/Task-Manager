// __tests__/tasks.test.js
import { jest } from "@jest/globals";

// ── Mock Prisma ──────────────────────────────────────
const prismaMock = {
  task: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  subtask: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  $transaction: jest.fn((ops) => Promise.all(ops)),
};

jest.unstable_mockModule("../db.js", () => ({ default: prismaMock }));

const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
} = await import("../controllers/taskController.js");

// ── Helper ────────────────────────────────────────────
function mockReqRes({ body = {}, params = {}, query = {}, userId = 1 } = {}) {
  const req = { body, params, query, user: { id: userId } };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return { req, res };
}

const sampleTask = {
  id: 1,
  title: "Test task",
  status: "pending",
  priority: "medium",
  category: "",
  note: "",
  deadline: null,
  deadlineTime: null,
  recurringType: null,
  recurringDays: null,
  order: 0,
  userId: 1,
  subtasks: [],
};

// ────────────────────────────────────────────────────
describe("Task Controller", () => {
  beforeEach(() => jest.clearAllMocks());

  // ── GET TASKS ─────────────────────────────────────
  describe("getTasks", () => {
    test("คืน task list พร้อม pagination", async () => {
      const { req, res } = mockReqRes({ query: { page: "1", limit: "10" } });
      prismaMock.task.findMany.mockResolvedValue([sampleTask]);
      prismaMock.task.count.mockResolvedValue(1);

      await getTasks(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          tasks: expect.any(Array),
          total: 1,
          page: 1,
          totalPages: 1,
        })
      );
    });

    test("filter ตาม status", async () => {
      const { req, res } = mockReqRes({ query: { status: "pending" } });
      prismaMock.task.findMany.mockResolvedValue([sampleTask]);
      prismaMock.task.count.mockResolvedValue(1);

      await getTasks(req, res);

      const callArg = prismaMock.task.findMany.mock.calls[0][0];
      expect(callArg.where.status).toBe("pending");
    });

    test("filter ตาม priority", async () => {
      const { req, res } = mockReqRes({ query: { priority: "high" } });
      prismaMock.task.findMany.mockResolvedValue([]);
      prismaMock.task.count.mockResolvedValue(0);

      await getTasks(req, res);

      const callArg = prismaMock.task.findMany.mock.calls[0][0];
      expect(callArg.where.priority).toBe("high");
    });

    test("sort=date ใช้ deadline ascending", async () => {
      const { req, res } = mockReqRes({ query: { sort: "date" } });
      prismaMock.task.findMany.mockResolvedValue([]);
      prismaMock.task.count.mockResolvedValue(0);

      await getTasks(req, res);

      const callArg = prismaMock.task.findMany.mock.calls[0][0];
      expect(callArg.orderBy).toEqual({ deadline: "asc" });
    });

    test("limit สูงสุดไม่เกิน 100", async () => {
      const { req, res } = mockReqRes({ query: { limit: "999" } });
      prismaMock.task.findMany.mockResolvedValue([]);
      prismaMock.task.count.mockResolvedValue(0);

      await getTasks(req, res);

      const callArg = prismaMock.task.findMany.mock.calls[0][0];
      expect(callArg.take).toBe(100);
    });

    test("DB error — คืน 500", async () => {
      const { req, res } = mockReqRes();
      prismaMock.task.findMany.mockRejectedValue(new Error("DB error"));
      prismaMock.task.count.mockRejectedValue(new Error("DB error"));

      await getTasks(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ── CREATE TASK ───────────────────────────────────
  describe("createTask", () => {
    test("สร้าง task สำเร็จ — คืน 201", async () => {
      const { req, res } = mockReqRes({ body: { title: "New task" } });
      prismaMock.task.aggregate.mockResolvedValue({ _max: { order: 0 } });
      prismaMock.task.create.mockResolvedValue({ ...sampleTask, title: "New task" });

      await createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ title: "New task" })
      );
    });

    test("ไม่ส่ง title — คืน 400", async () => {
      const { req, res } = mockReqRes({ body: { title: "" } });

      await createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("title มีแค่ space — คืน 400", async () => {
      const { req, res } = mockReqRes({ body: { title: "   " } });

      await createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("order ของ task ใหม่ = max + 1", async () => {
      const { req, res } = mockReqRes({ body: { title: "Task" } });
      prismaMock.task.aggregate.mockResolvedValue({ _max: { order: 5 } });
      prismaMock.task.create.mockResolvedValue({ ...sampleTask, order: 6 });

      await createTask(req, res);

      const createCall = prismaMock.task.create.mock.calls[0][0];
      expect(createCall.data.order).toBe(6);
    });

    test("สร้าง recurring task — บันทึก recurringType", async () => {
      const { req, res } = mockReqRes({
        body: {
          title: "Daily task",
          recurring: { type: "daily", days: [] },
        },
      });
      prismaMock.task.aggregate.mockResolvedValue({ _max: { order: 0 } });
      prismaMock.task.create.mockResolvedValue({
        ...sampleTask,
        recurringType: "daily",
      });

      await createTask(req, res);

      const createCall = prismaMock.task.create.mock.calls[0][0];
      expect(createCall.data.recurringType).toBe("daily");
    });
  });

  // ── UPDATE TASK ───────────────────────────────────
  describe("updateTask", () => {
    test("อัปเดต title สำเร็จ", async () => {
      const { req, res } = mockReqRes({
        params: { id: "1" },
        body: { title: "Updated title" },
      });
      prismaMock.task.findFirst.mockResolvedValue(sampleTask);
      prismaMock.task.update.mockResolvedValue({
        ...sampleTask,
        title: "Updated title",
      });

      await updateTask(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Updated title" })
      );
    });

    test("ไม่พบ task — คืน 404", async () => {
      const { req, res } = mockReqRes({
        params: { id: "999" },
        body: { title: "x" },
      });
      prismaMock.task.findFirst.mockResolvedValue(null);

      await updateTask(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("title เป็น empty string — คืน 400", async () => {
      const { req, res } = mockReqRes({
        params: { id: "1" },
        body: { title: "   " },
      });
      prismaMock.task.findFirst.mockResolvedValue(sampleTask);

      await updateTask(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("mark done บน recurring task — reset กลับเป็น pending", async () => {
      const recurringTask = {
        ...sampleTask,
        recurringType: "daily",
        recurringDays: null,
        deadline: new Date(),
      };
      const { req, res } = mockReqRes({
        params: { id: "1" },
        body: { status: "done" },
      });
      prismaMock.task.findFirst.mockResolvedValue(recurringTask);
      prismaMock.task.update.mockResolvedValue({
        ...recurringTask,
        status: "pending",
      });

      await updateTask(req, res);

      const updateCall = prismaMock.task.update.mock.calls[0][0];
      expect(updateCall.data.status).toBe("pending");
      expect(updateCall.data.recurringLastCompleted).toBeInstanceOf(Date);
    });

    test("ไม่สามารถอัปเดต task ของคนอื่น — คืน 404", async () => {
      const { req, res } = mockReqRes({
        params: { id: "1" },
        body: { title: "hacked" },
        userId: 2, // คนละ user
      });
      prismaMock.task.findFirst.mockResolvedValue(null); // findFirst กรอง userId

      await updateTask(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ── DELETE TASK ───────────────────────────────────
  describe("deleteTask", () => {
    test("ลบ task สำเร็จ", async () => {
      const { req, res } = mockReqRes({ params: { id: "1" } });
      prismaMock.task.findFirst.mockResolvedValue(sampleTask);
      prismaMock.subtask.deleteMany.mockResolvedValue({});
      prismaMock.task.delete.mockResolvedValue({});

      await deleteTask(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.any(String) })
      );
    });

    test("ลบ subtasks ก่อนลบ task", async () => {
      const { req, res } = mockReqRes({ params: { id: "1" } });
      prismaMock.task.findFirst.mockResolvedValue(sampleTask);
      prismaMock.subtask.deleteMany.mockResolvedValue({});
      prismaMock.task.delete.mockResolvedValue({});

      await deleteTask(req, res);

      expect(prismaMock.subtask.deleteMany).toHaveBeenCalledWith({
        where: { taskId: 1 },
      });
    });

    test("ไม่พบ task — คืน 404", async () => {
      const { req, res } = mockReqRes({ params: { id: "999" } });
      prismaMock.task.findFirst.mockResolvedValue(null);

      await deleteTask(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ── REORDER ───────────────────────────────────────
  describe("reorderTasks", () => {
    test("reorder สำเร็จ", async () => {
      const { req, res } = mockReqRes({
        body: {
          tasks: [
            { id: 1, order: 0 },
            { id: 2, order: 1 },
          ],
        },
      });
      prismaMock.task.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      prismaMock.task.update.mockResolvedValue({});

      await reorderTasks(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.any(String) })
      );
    });

    test("tasks ว่าง — คืน 400", async () => {
      const { req, res } = mockReqRes({ body: { tasks: [] } });

      await reorderTasks(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("tasks ไม่ใช่ array — คืน 400", async () => {
      const { req, res } = mockReqRes({ body: { tasks: "not-array" } });

      await reorderTasks(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("มี task ของคนอื่นปน — คืน 403", async () => {
      const { req, res } = mockReqRes({
        body: { tasks: [{ id: 1, order: 0 }, { id: 99, order: 1 }] },
      });
      // DB คืนมาแค่ 1 (ไม่ใช่ 2) = มีตัวที่ไม่ใช่ของ user
      prismaMock.task.findMany.mockResolvedValue([{ id: 1 }]);

      await reorderTasks(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  // ── SUBTASKS ──────────────────────────────────────
  describe("addSubtask", () => {
    test("เพิ่ม subtask สำเร็จ — คืน 201", async () => {
      const { req, res } = mockReqRes({
        params: { id: "1" },
        body: { title: "Sub task" },
      });
      prismaMock.task.findFirst.mockResolvedValue(sampleTask);
      prismaMock.subtask.create.mockResolvedValue({});
      prismaMock.task.findUnique.mockResolvedValue({
        ...sampleTask,
        subtasks: [{ id: 1, title: "Sub task", done: false }],
      });

      await addSubtask(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    test("ไม่ส่ง title subtask — คืน 400", async () => {
      const { req, res } = mockReqRes({
        params: { id: "1" },
        body: { title: "" },
      });
      prismaMock.task.findFirst.mockResolvedValue(sampleTask);

      await addSubtask(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("ไม่พบ parent task — คืน 404", async () => {
      const { req, res } = mockReqRes({
        params: { id: "999" },
        body: { title: "Sub" },
      });
      prismaMock.task.findFirst.mockResolvedValue(null);

      await addSubtask(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("toggleSubtask", () => {
    test("toggle subtask done → undone", async () => {
      const { req, res } = mockReqRes({ params: { id: "1", subId: "1" } });
      prismaMock.task.findFirst.mockResolvedValue(sampleTask);
      prismaMock.subtask.findFirst.mockResolvedValue({
        id: 1,
        taskId: 1,
        done: true,
      });
      prismaMock.subtask.update.mockResolvedValue({ id: 1, done: false });
      prismaMock.task.findUnique.mockResolvedValue(sampleTask);

      await toggleSubtask(req, res);

      const updateCall = prismaMock.subtask.update.mock.calls[0][0];
      expect(updateCall.data.done).toBe(false); // toggle จาก true → false
    });

    test("ไม่พบ subtask — คืน 404", async () => {
      const { req, res } = mockReqRes({ params: { id: "1", subId: "999" } });
      prismaMock.task.findFirst.mockResolvedValue(sampleTask);
      prismaMock.subtask.findFirst.mockResolvedValue(null);

      await toggleSubtask(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("deleteSubtask", () => {
    test("ลบ subtask สำเร็จ", async () => {
      const { req, res } = mockReqRes({ params: { id: "1", subId: "1" } });
      prismaMock.task.findFirst.mockResolvedValue(sampleTask);
      prismaMock.subtask.findFirst.mockResolvedValue({ id: 1, taskId: 1 });
      prismaMock.subtask.delete.mockResolvedValue({});
      prismaMock.task.findUnique.mockResolvedValue(sampleTask);

      await deleteSubtask(req, res);

      expect(prismaMock.subtask.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    test("ไม่พบ subtask — คืน 404", async () => {
      const { req, res } = mockReqRes({ params: { id: "1", subId: "999" } });
      prismaMock.task.findFirst.mockResolvedValue(sampleTask);
      prismaMock.subtask.findFirst.mockResolvedValue(null);

      await deleteSubtask(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});