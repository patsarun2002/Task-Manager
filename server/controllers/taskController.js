import prisma from "../db.js";

function getNextDeadline(task) {
  const now = new Date();

  if (task.recurringType === "daily") {
    const next = new Date(now);
    next.setDate(next.getDate() + 1);
    return next;
  }

  if (task.recurringType === "weekly") {
    const days = JSON.parse(task.recurringDays || "[]").sort((a, b) => a - b);
    if (!days.length) return task.deadline;
    const todayDay = now.getDay();
    let nextDay = days.find((d) => d > todayDay);
    if (nextDay === undefined) nextDay = days[0];

    const diff =
      nextDay > todayDay ? nextDay - todayDay : 7 - todayDay + nextDay;

    const next = new Date(now);
    next.setDate(next.getDate() + diff);
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

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: { subtasks: true },
        orderBy: sort === "date" ? { deadline: "asc" } : { createdAt: "desc" },
        skip,
        take: Number(limit),
      }),
      prisma.task.count({ where }),
    ]);

    res.json({
      tasks,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
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

    if (!existing) {
      return res.status(404).json({ error: "ไม่พบ task" });
    }

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
    if (deadline !== undefined) {
      updateData.deadline = deadline ? new Date(deadline) : null;
    }
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

    if (!existing) {
      return res.status(404).json({ error: "ไม่พบ task" });
    }

    await prisma.subtask.deleteMany({ where: { taskId: Number(id) } });
    await prisma.task.delete({ where: { id: Number(id) } });

    res.json({ message: "ลบ task สำเร็จ" });
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

    if (!title?.trim()) {
      return res.status(400).json({ error: "กรุณากรอกชื่อ subtask" });
    }

    const task = await prisma.task.findFirst({
      where: { id: Number(id), userId },
    });

    if (!task) {
      return res.status(404).json({ error: "ไม่พบ task" });
    }

    await prisma.subtask.create({
      data: {
        title: title.trim(),
        done: false,
        taskId: Number(id),
      },
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

    if (!task) {
      return res.status(404).json({ error: "ไม่พบ task" });
    }

    const sub = await prisma.subtask.findFirst({
      where: { id: Number(subId), taskId: Number(id) },
    });

    if (!sub) {
      return res.status(404).json({ error: "ไม่พบ subtask" });
    }

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

    if (!task) {
      return res.status(404).json({ error: "ไม่พบ task" });
    }

    const sub = await prisma.subtask.findFirst({
      where: { id: Number(subId), taskId: Number(id) },
    });

    if (!sub) {
      return res.status(404).json({ error: "ไม่พบ subtask" });
    }

    await prisma.subtask.delete({
      where: { id: Number(subId) },
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
