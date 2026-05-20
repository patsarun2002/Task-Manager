// __tests__/tasks.test.js
import { jest } from "@jest/globals";

// ── Mock taskService ─────────────────────────────────
const taskServiceMock = {
  getMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  reorder: jest.fn(),
  addSubtask: jest.fn(),
  toggleSubtask: jest.fn(),
  removeSubtask: jest.fn(),
  getSummary: jest.fn(),
  getCategories: jest.fn(),
};

jest.unstable_mockModule("../services/taskService.js", () => ({
  taskService: taskServiceMock,
}));

const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
  getSummary,
  getCategories,
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
      taskServiceMock.getMany.mockResolvedValue({
        tasks: [sampleTask],
        total: 1,
        page: 1,
        totalPages: 1,
      });

      await getTasks(req, res);

      expect(taskServiceMock.getMany).toHaveBeenCalledWith(1, {
        page: "1",
        limit: "10",
      });
      expect(res.json).toHaveBeenCalledWith({
        tasks: [sampleTask],
        total: 1,
        page: 1,
        totalPages: 1,
      });
    });

    test("service error — คืน 500", async () => {
      const { req, res } = mockReqRes();
      const error = Object.assign(new Error("Service error"), { status: 500 });
      taskServiceMock.getMany.mockRejectedValue(error);

      await getTasks(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Service error" });
    });

    test("service error with custom status — คืน custom status", async () => {
      const { req, res } = mockReqRes();
      const error = Object.assign(new Error("Not found"), { status: 404 });
      taskServiceMock.getMany.mockRejectedValue(error);

      await getTasks(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("service error without status — คืน 500 fallback", async () => {
      const { req, res } = mockReqRes();
      const error = new Error("Internal error"); // No status property
      taskServiceMock.getMany.mockRejectedValue(error);

      await getTasks(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Internal error" });
    });

    test("service error without message — คืน default error message", async () => {
      const { req, res } = mockReqRes();
      const error = Object.assign(new Error(), { status: 500 }); // No message
      taskServiceMock.getMany.mockRejectedValue(error);

      await getTasks(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์",
      });
    });
  });

  // ── CREATE TASK ───────────────────────────────────
  describe("createTask", () => {
    test("สร้าง task สำเร็จ — คืน 201", async () => {
      const { req, res } = mockReqRes({ body: { title: "New task" } });
      taskServiceMock.create.mockResolvedValue({
        ...sampleTask,
        title: "New task",
      });

      await createTask(req, res);

      expect(taskServiceMock.create).toHaveBeenCalledWith(1, {
        title: "New task",
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ title: "New task" }),
      );
    });

    test("service error — คืน error status", async () => {
      const { req, res } = mockReqRes({ body: { title: "" } });
      const error = Object.assign(new Error("กรุณากรอกชื่อ task"), {
        status: 400,
      });
      taskServiceMock.create.mockRejectedValue(error);

      await createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "กรุณากรอกชื่อ task" });
    });
  });

  // ── UPDATE TASK ───────────────────────────────────
  describe("updateTask", () => {
    test("อัปเดต title สำเร็จ", async () => {
      const { req, res } = mockReqRes({
        params: { id: "1" },
        body: { title: "Updated title" },
      });
      taskServiceMock.update.mockResolvedValue({
        ...sampleTask,
        title: "Updated title",
      });

      await updateTask(req, res);

      expect(taskServiceMock.update).toHaveBeenCalledWith("1", 1, {
        title: "Updated title",
      });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Updated title" }),
      );
    });

    test("service error — คืน error status", async () => {
      const { req, res } = mockReqRes({
        params: { id: "999" },
        body: { title: "x" },
      });
      const error = Object.assign(new Error("ไม่พบ task"), { status: 404 });
      taskServiceMock.update.mockRejectedValue(error);

      await updateTask(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ── DELETE TASK ───────────────────────────────────
  describe("deleteTask", () => {
    test("ลบ task สำเร็จ", async () => {
      const { req, res } = mockReqRes({ params: { id: "1" } });
      taskServiceMock.remove.mockResolvedValue(undefined);

      await deleteTask(req, res);

      expect(taskServiceMock.remove).toHaveBeenCalledWith("1", 1);
      expect(res.json).toHaveBeenCalledWith({ message: "ลบ task สำเร็จ" });
    });

    test("service error — คืน error status", async () => {
      const { req, res } = mockReqRes({ params: { id: "999" } });
      const error = Object.assign(new Error("ไม่พบ task"), { status: 404 });
      taskServiceMock.remove.mockRejectedValue(error);

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
      taskServiceMock.reorder.mockResolvedValue(undefined);

      await reorderTasks(req, res);

      expect(taskServiceMock.reorder).toHaveBeenCalledWith(1, [
        { id: 1, order: 0 },
        { id: 2, order: 1 },
      ]);
      expect(res.json).toHaveBeenCalledWith({ message: "บันทึกลำดับสำเร็จ" });
    });

    test("service error — คืน error status", async () => {
      const { req, res } = mockReqRes({
        body: { tasks: [{ id: 1, order: 0 }] },
      });
      const error = Object.assign(
        new Error("tasks ต้องเป็น array ที่ไม่ว่าง"),
        { status: 400 },
      );
      taskServiceMock.reorder.mockRejectedValue(error);

      await reorderTasks(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ── SUBTASKS ──────────────────────────────────────
  describe("addSubtask", () => {
    test("เพิ่ม subtask สำเร็จ — คืน 201", async () => {
      const { req, res } = mockReqRes({
        params: { id: "1" },
        body: { title: "Sub task" },
      });
      taskServiceMock.addSubtask.mockResolvedValue({
        id: 1,
        title: "Sub task",
        done: false,
      });

      await addSubtask(req, res);

      expect(taskServiceMock.addSubtask).toHaveBeenCalledWith(
        "1",
        1,
        "Sub task",
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test("service error — คืน error status", async () => {
      const { req, res } = mockReqRes({
        params: { id: "1" },
        body: { title: "" },
      });
      const error = Object.assign(new Error("กรุณากรอกชื่อ subtask"), {
        status: 400,
      });
      taskServiceMock.addSubtask.mockRejectedValue(error);

      await addSubtask(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("toggleSubtask", () => {
    test("toggle subtask สำเร็จ", async () => {
      const { req, res } = mockReqRes({ params: { id: "1", subId: "1" } });
      taskServiceMock.toggleSubtask.mockResolvedValue({ id: 1, done: false });

      await toggleSubtask(req, res);

      expect(taskServiceMock.toggleSubtask).toHaveBeenCalledWith("1", "1", 1);
      expect(res.json).toHaveBeenCalledWith({ id: 1, done: false });
    });

    test("service error — คืน error status", async () => {
      const { req, res } = mockReqRes({ params: { id: "1", subId: "999" } });
      const error = Object.assign(new Error("ไม่พบ subtask"), { status: 404 });
      taskServiceMock.toggleSubtask.mockRejectedValue(error);

      await toggleSubtask(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("deleteSubtask", () => {
    test("ลบ subtask สำเร็จ", async () => {
      const { req, res } = mockReqRes({ params: { id: "1", subId: "1" } });
      taskServiceMock.removeSubtask.mockResolvedValue(1);

      await deleteSubtask(req, res);

      expect(taskServiceMock.removeSubtask).toHaveBeenCalledWith("1", "1", 1);
      expect(res.json).toHaveBeenCalledWith({ id: 1 });
    });

    test("service error — คืน error status", async () => {
      const { req, res } = mockReqRes({ params: { id: "1", subId: "999" } });
      const error = Object.assign(new Error("ไม่พบ subtask"), { status: 404 });
      taskServiceMock.removeSubtask.mockRejectedValue(error);

      await deleteSubtask(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ── GET SUMMARY ───────────────────────────────────
  describe("getSummary", () => {
    test("คืน summary สำเร็จ", async () => {
      const { req, res } = mockReqRes();
      taskServiceMock.getSummary.mockResolvedValue({
        total: 10,
        done: 3,
        pending: 7,
        overdue: 0,
      });

      await getSummary(req, res);

      expect(taskServiceMock.getSummary).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({
        total: 10,
        done: 3,
        pending: 7,
        overdue: 0,
      });
    });

    test("service error — คืน error status", async () => {
      const { req, res } = mockReqRes();
      const error = Object.assign(new Error("DB error"), { status: 500 });
      taskServiceMock.getSummary.mockRejectedValue(error);

      await getSummary(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ── GET CATEGORIES ────────────────────────────────
  describe("getCategories", () => {
    test("คืน categories สำเร็จ", async () => {
      const { req, res } = mockReqRes();
      taskServiceMock.getCategories.mockResolvedValue(["work", "personal"]);

      await getCategories(req, res);

      expect(taskServiceMock.getCategories).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith(["work", "personal"]);
    });

    test("service error — คืน error status", async () => {
      const { req, res } = mockReqRes();
      const error = Object.assign(new Error("DB error"), { status: 500 });
      taskServiceMock.getCategories.mockRejectedValue(error);

      await getCategories(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
