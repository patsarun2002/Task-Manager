import prisma from "../db.js";

function getNextDeadline(task) {
  // คำนวณจาก deadline เดิม (หรือ now ถ้าไม่มี deadline) ไม่ใช่วันนี้เสมอ
  // เพื่อไม่ให้ skip รอบเมื่อ task เลยกำหนดไปนานแล้ว
  const base = task.deadline ? new Date(task.deadline) : new Date();

  if (task.recurringType === "daily") {
    const next = new Date(base);
    next.setDate(next.getDate() + 1);
    // ถ้า next ยังอยู่ในอดีต (เลยกำหนดหลายวัน) ให้กระโดดมาถึงวันพรุ่งนี้
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return next > new Date() ? next : tomorrow;
  }

  if (task.recurringType === "weekly") {
    const days = JSON.parse(task.recurringDays || "[]").sort((a, b) => a - b);
    if (!days.length) return task.deadline;

    // หา occurrence ถัดไปนับจาก base date
    const baseDay = base.getDay();
    let nextDay = days.find((d) => d > baseDay);
    if (nextDay === undefined) nextDay = days[0];
    const diff = nextDay > baseDay ? nextDay - baseDay : 7 - baseDay + nextDay;
    const next = new Date(base);
    next.setDate(next.getDate() + diff);

    // ถ้า next ยังอยู่ในอดีต ให้วนหา occurrence ถัดไปจากวันนี้แทน
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

    // เมื่อ sort=date ใช้ deadline, ถ้าไม่ได้ sort ใช้ order ที่ผู้ใช้ drag ไว้
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
  } catch {
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

    // หา order สูงสุดของ user แล้ว +1 เพื่อให้ task ใหม่อยู่ด้านบน
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
        recurringDays: recurring?.days ? JSON.stringify(recurring.days) : null,
        order: nextOrder,
        userId,
      },
      include: { subtasks: true },
    });

    res.status(201).json(task);
  } catch {
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
      updateData.recurringDays = recurring?.days
        ? JSON.stringify(recurring.days)
        : null;
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
  } catch {
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

    await prisma.subtask.deleteMany({ where: { taskId: Number(id) } });

    await prisma.task.delete({ where: { id: Number(id) } });

    res.json({ message: "ลบ task สำเร็จ" });
  } catch {
    res.status(500).json({ error: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
};

const REORDER_LIMIT = 500;

// PATCH /api/tasks/reorder — รับ [{ id, order }, ...] แล้วอัปเดตทีเดียว
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

    // ตรวจสอบ input — id และ order ต้องเป็นตัวเลขบวก
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

    // ตรวจว่า task ทุกตัวเป็นของ user นี้จริง
    const ids = parsed.map((t) => t.id);
    const owned = await prisma.task.findMany({
      where: { id: { in: ids }, userId },
      select: { id: true },
    });
    if (owned.length !== ids.length) {
      return res.status(403).json({ error: "ไม่มีสิทธิ์แก้ไข task บางรายการ" });
    }

    // bulk UPDATE ด้วย CASE — 1 round-trip แทน N queries
    await prisma.$transaction(
      parsed.map(({ id, order }) =>
        prisma.task.update({
          where: { id },
          data: { order },
        }),
      ),
      { timeout: 10000 },
    );

    res.json({ message: "บันทึกลำดับสำเร็จ" });
  } catch {
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

    await prisma.subtask.create({
      data: { title: title.trim(), done: false, taskId: Number(id) },
    });

    const updated = await prisma.task.findUnique({
      where: { id: Number(id) },
      include: { subtasks: true },
    });
    res.status(201).json(updated);
  } catch {
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

    await prisma.subtask.update({
      where: { id: Number(subId) },
      data: { done: !sub.done },
    });

    const updated = await prisma.task.findUnique({
      where: { id: Number(id) },
      include: { subtasks: true },
    });
    res.json(updated);
  } catch {
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

    const updated = await prisma.task.findUnique({
      where: { id: Number(id) },
      include: { subtasks: true },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
};

export const getSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const [total, done, overdue] = await Promise.all([
      prisma.task.count({ where: { userId } }),
      prisma.task.count({ where: { userId, status: "done" } }),
      prisma.task.count({
        where: {
          userId,
          status: "pending",
          deadline: { lt: now },
        },
      }),
    ]);

    res.json({ total, done, pending: total - done, overdue });
  } catch {
    res.status(500).json({ error: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
};

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
  } catch {
    res.status(500).json({ error: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
};
