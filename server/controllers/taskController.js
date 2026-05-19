import prisma from "../db.js";

// [P2] recurringDays เป็น Int[] แล้ว ไม่ต้อง JSON.parse/stringify อีกต่อไป
function getNextDeadline(task) {
  const base = task.deadline ? new Date(task.deadline) : new Date();

  if (task.recurringType === "daily") {
    const next = new Date(base);
    next.setDate(next.getDate() + 1);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return next > new Date() ? next : tomorrow;
  }

  if (task.recurringType === "weekly") {
    // [P2] recurringDays เป็น Int[] แล้ว ไม่ต้อง parse
    const days = [...(task.recurringDays ?? [])].sort((a, b) => a - b);
    if (!days.length) return task.deadline;

    const baseDay = base.getDay();
    let nextDay = days.find((d) => d > baseDay);
    if (nextDay === undefined) nextDay = days[0];
    const diff = nextDay > baseDay ? nextDay - baseDay : 7 - baseDay + nextDay;
    const next = new Date(base);
    next.setDate(next.getDate() + diff);

    if (next <= new Date()) {
      const now = new Date();
      const todayDay = now.getDay();
      let futureDay = days.find((d) => d > todayDay);
      if (futureDay === undefined) futureDay = days[0];
      const futureDiff =
        futureDay > todayDay ? futureDay - todayDay : 7 - todayDay + futureDay;
      const future = new Date(now);
      future.setDate(future.getDate() + futureDiff);
      return future;
    }

    return next;
  }

  return task.deadline;
}

// GET /api/tasks
export const getTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      status,
      search,
      sort,
      priority,
      category,
      page = 1,
      limit = 20,
    } = req.query;

    const where = { userId };
    if (status && status !== "all") where.status = status;
    if (priority && priority !== "all") where.priority = priority;
    if (category && category !== "all") where.category = category;
    if (search) where.title = { contains: search, mode: "insensitive" };

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (safePage - 1) * safeLimit;

    const orderBy =
      sort === "date"
        ? { deadline: "asc" }
        : [{ order: "asc" }, { createdAt: "desc" }];

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: { subtasks: true },
        orderBy,
        skip,
        take: safeLimit,
      }),
      prisma.task.count({ where }),
    ]);

    res.json({
      tasks,
      total,
      page: safePage,
      totalPages: Math.ceil(total / safeLimit),
    });
  } catch (err) {
    console.error("[getTasks]", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
};

// POST /api/tasks
export const createTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      title,
      deadline,
      deadlineTime,
      priority,
      category,
      note,
      recurring,
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ error: "กรุณากรอกชื่อ task" });
    }

    const maxOrder = await prisma.task.aggregate({
      where: { userId },
      _max: { order: true },
    });
    const nextOrder = (maxOrder._max.order ?? -1) + 1;

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        status: "pending",
        priority: priority || "medium",
        category: category?.trim() || "",
        note: note?.trim() || "",
        deadline: deadline ? new Date(deadline) : null,
        deadlineTime: deadlineTime || null,
        recurringType: recurring?.type || null,
        // [P2] เก็บเป็น Int[] โดยตรง ไม่ต้อง JSON.stringify
        recurringDays: recurring?.days ?? [],
        order: nextOrder,
        userId,
      },
      include: { subtasks: true },
    });

    res.status(201).json(task);
  } catch (err) {
    console.error("[createTask]", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
};

// PUT /api/tasks/:id
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await prisma.task.findFirst({
      where: { id: Number(id), userId },
    });
    if (!existing) return res.status(404).json({ error: "ไม่พบ task" });

    const {
      title,
      status,
      deadline,
      deadlineTime,
      priority,
      category,
      note,
      recurring,
    } = req.body;
    const updateData = {};

    if (title !== undefined) {
      const trimmed = title.trim();
      if (!trimmed)
        return res.status(400).json({ error: "ชื่อ task ต้องไม่ว่าง" });
      updateData.title = trimmed;
    }
    if (deadline !== undefined)
      updateData.deadline = deadline ? new Date(deadline) : null;
    if (deadlineTime !== undefined) updateData.deadlineTime = deadlineTime;
    if (priority !== undefined) updateData.priority = priority;
    if (category !== undefined) updateData.category = category;
    if (note !== undefined) updateData.note = note.trim();
    if (recurring !== undefined) {
      updateData.recurringType = recurring?.type || null;
      // [P2] Int[] โดยตรง
      updateData.recurringDays = recurring?.days ?? [];
    }
    if (status !== undefined) {
      if (status === "done" && existing.recurringType) {
        updateData.recurringLastCompleted = new Date();
        updateData.deadline = getNextDeadline(existing);
        updateData.status = "pending";
      } else {
        updateData.status = status;
      }
    }

    const task = await prisma.task.update({
      where: { id: Number(id) },
      data: updateData,
      include: { subtasks: true },
    });

    res.json(task);
  } catch (err) {
    console.error("[updateTask]", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
};

// DELETE /api/tasks/:id
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await prisma.task.findFirst({
      where: { id: Number(id), userId },
    });
    if (!existing) return res.status(404).json({ error: "ไม่พบ task" });

    // [FIX] ลบ subtasks ก่อนลบ task เพื่อให้ test ผ่าน
    await prisma.$transaction([
      prisma.subtask.deleteMany({ where: { taskId: Number(id) } }),
      prisma.task.delete({ where: { id: Number(id) } }),
    ]);

    res.json({ message: "ลบ task สำเร็จ" });
  } catch (err) {
    console.error("[deleteTask]", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
};

const REORDER_LIMIT = 500;

// PATCH /api/tasks/reorder
export const reorderTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tasks } = req.body;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ error: "tasks ต้องเป็น array ที่ไม่ว่าง" });
    }
    if (tasks.length > REORDER_LIMIT) {
      return res
        .status(400)
        .json({ error: `ส่งได้สูงสุด ${REORDER_LIMIT} รายการต่อครั้ง` });
    }

    const parsed = tasks.map((t) => ({
      id: Number(t.id),
      order: Number(t.order),
    }));
    if (
      parsed.some(
        (t) =>
          !Number.isInteger(t.id) ||
          t.id <= 0 ||
          !Number.isInteger(t.order) ||
          t.order < 0,
      )
    ) {
      return res
        .status(400)
        .json({ error: "id และ order ต้องเป็นตัวเลขที่ถูกต้อง" });
    }

    const ids = parsed.map((t) => t.id);
    const owned = await prisma.task.findMany({
      where: { id: { in: ids }, userId },
      select: { id: true },
    });
    if (owned.length !== ids.length) {
      return res.status(403).json({ error: "ไม่มีสิทธิ์แก้ไข task บางรายการ" });
    }

    await prisma.$transaction(
      parsed.map(({ id, order }) =>
        prisma.task.update({ where: { id }, data: { order } }),
      ),
      { timeout: 10000 },
    );

    res.json({ message: "บันทึกลำดับสำเร็จ" });
  } catch (err) {
    console.error("[reorderTasks]", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
};

// POST /api/tasks/:id/subtasks
export const addSubtask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title } = req.body;

    if (!title?.trim())
      return res.status(400).json({ error: "กรุณากรอกชื่อ subtask" });

    const task = await prisma.task.findFirst({
      where: { id: Number(id), userId },
    });
    if (!task) return res.status(404).json({ error: "ไม่พบ task" });

    // [P3] return เฉพาะ subtask ที่สร้างใหม่ ไม่ return task ทั้งก้อน
    const subtask = await prisma.subtask.create({
      data: { title: title.trim(), done: false, taskId: Number(id) },
    });

    res.status(201).json(subtask);
  } catch (err) {
    console.error("[addSubtask]", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
};

// PATCH /api/tasks/:id/subtasks/:subId
export const toggleSubtask = async (req, res) => {
  try {
    const { id, subId } = req.params;
    const userId = req.user.id;

    const task = await prisma.task.findFirst({
      where: { id: Number(id), userId },
    });
    if (!task) return res.status(404).json({ error: "ไม่พบ task" });

    const sub = await prisma.subtask.findFirst({
      where: { id: Number(subId), taskId: Number(id) },
    });
    if (!sub) return res.status(404).json({ error: "ไม่พบ subtask" });

    // [P3] return เฉพาะ subtask ที่เปลี่ยน
    const updated = await prisma.subtask.update({
      where: { id: Number(subId) },
      data: { done: !sub.done },
    });

    res.json(updated);
  } catch (err) {
    console.error("[toggleSubtask]", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
};

// DELETE /api/tasks/:id/subtasks/:subId
export const deleteSubtask = async (req, res) => {
  try {
    const { id, subId } = req.params;
    const userId = req.user.id;

    const task = await prisma.task.findFirst({
      where: { id: Number(id), userId },
    });
    if (!task) return res.status(404).json({ error: "ไม่พบ task" });

    const sub = await prisma.subtask.findFirst({
      where: { id: Number(subId), taskId: Number(id) },
    });
    if (!sub) return res.status(404).json({ error: "ไม่พบ subtask" });

    await prisma.subtask.delete({ where: { id: Number(subId) } });

    // [P3] return แค่ id ที่ลบไป
    res.json({ id: Number(subId) });
  } catch (err) {
    console.error("[deleteSubtask]", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
};

// GET /api/tasks/summary
export const getSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const [total, done, overdueRaw] = await Promise.all([
      prisma.task.count({ where: { userId } }),
      prisma.task.count({ where: { userId, status: "done" } }),
      prisma.task.findMany({
        where: { userId, status: "pending", deadline: { lte: now } },
        select: { deadline: true, deadlineTime: true },
      }),
    ]);

    const overdue = overdueRaw.filter((t) => {
      const dt = new Date(
        `${t.deadline.toISOString().slice(0, 10)}T${t.deadlineTime || "23:59:59"}`,
      );
      return dt < now;
    }).length;

    res.json({ total, done, pending: total - done, overdue });
  } catch (err) {
    console.error("[getSummary]", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
};

// GET /api/tasks/categories
export const getCategories = async (req, res) => {
  try {
    const userId = req.user.id;
    const tasks = await prisma.task.findMany({
      where: { userId, category: { not: "" } },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    });
    res.json(tasks.map((t) => t.category));
  } catch (err) {
    console.error("[getCategories]", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
};
