import prisma from "../db.js";

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

export const taskService = {
  async getMany(userId, query) {
    const {
      status,
      search,
      sort,
      priority,
      category,
      page = 1,
      limit = 20,
    } = query;

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

    return {
      tasks,
      total,
      page: safePage,
      totalPages: Math.ceil(total / safeLimit),
    };
  },

  async create(userId, body) {
    const {
      title,
      deadline,
      deadlineTime,
      priority,
      category,
      note,
      recurring,
    } = body;

    if (!title?.trim()) {
      throw Object.assign(new Error("กรุณากรอกชื่อ task"), { status: 400 });
    }

    const maxOrder = await prisma.task.aggregate({
      where: { userId },
      _max: { order: true },
    });

    return prisma.task.create({
      data: {
        title: title.trim(),
        status: "pending",
        priority: priority || "medium",
        category: category?.trim() || "",
        note: note?.trim() || "",
        deadline: deadline ? new Date(deadline) : null,
        deadlineTime: deadlineTime || null,
        recurringType: recurring?.type || null,
        recurringDays: recurring?.days ?? [],
        order: (maxOrder._max.order ?? -1) + 1,
        userId,
      },
      include: { subtasks: true },
    });
  },

  async update(id, userId, body) {
    const existing = await prisma.task.findFirst({
      where: { id: Number(id), userId },
    });
    if (!existing)
      throw Object.assign(new Error("ไม่พบ task"), { status: 404 });

    const {
      title,
      status,
      deadline,
      deadlineTime,
      priority,
      category,
      note,
      recurring,
    } = body;
    const updateData = {};

    if (title !== undefined) {
      const trimmed = title.trim();
      if (!trimmed)
        throw Object.assign(new Error("ชื่อ task ต้องไม่ว่าง"), {
          status: 400,
        });
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

    return prisma.task.update({
      where: { id: Number(id) },
      data: updateData,
      include: { subtasks: true },
    });
  },

  async remove(id, userId) {
    const existing = await prisma.task.findFirst({
      where: { id: Number(id), userId },
    });
    if (!existing)
      throw Object.assign(new Error("ไม่พบ task"), { status: 404 });

    await prisma.$transaction([
      prisma.subtask.deleteMany({ where: { taskId: Number(id) } }),
      prisma.task.delete({ where: { id: Number(id) } }),
    ]);
  },

  async reorder(userId, tasks) {
    const REORDER_LIMIT = 500;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      throw Object.assign(new Error("tasks ต้องเป็น array ที่ไม่ว่าง"), {
        status: 400,
      });
    }
    if (tasks.length > REORDER_LIMIT) {
      throw Object.assign(
        new Error(`ส่งได้สูงสุด ${REORDER_LIMIT} รายการต่อครั้ง`),
        { status: 400 },
      );
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
      throw Object.assign(new Error("id และ order ต้องเป็นตัวเลขที่ถูกต้อง"), {
        status: 400,
      });
    }

    const ids = parsed.map((t) => t.id);
    const owned = await prisma.task.findMany({
      where: { id: { in: ids }, userId },
      select: { id: true },
    });
    if (owned.length !== ids.length) {
      throw Object.assign(new Error("ไม่มีสิทธิ์แก้ไข task บางรายการ"), {
        status: 403,
      });
    }

    await prisma.$transaction(
      parsed.map(({ id, order }) =>
        prisma.task.update({ where: { id }, data: { order } }),
      ),
      { timeout: 10000 },
    );
  },

  async addSubtask(taskId, userId, title) {
    if (!title?.trim())
      throw Object.assign(new Error("กรุณากรอกชื่อ subtask"), { status: 400 });

    const task = await prisma.task.findFirst({
      where: { id: Number(taskId), userId },
    });
    if (!task) throw Object.assign(new Error("ไม่พบ task"), { status: 404 });

    return prisma.subtask.create({
      data: { title: title.trim(), done: false, taskId: Number(taskId) },
    });
  },

  async toggleSubtask(taskId, subId, userId) {
    const task = await prisma.task.findFirst({
      where: { id: Number(taskId), userId },
    });
    if (!task) throw Object.assign(new Error("ไม่พบ task"), { status: 404 });

    const sub = await prisma.subtask.findFirst({
      where: { id: Number(subId), taskId: Number(taskId) },
    });
    if (!sub) throw Object.assign(new Error("ไม่พบ subtask"), { status: 404 });

    return prisma.subtask.update({
      where: { id: Number(subId) },
      data: { done: !sub.done },
    });
  },

  async removeSubtask(taskId, subId, userId) {
    const task = await prisma.task.findFirst({
      where: { id: Number(taskId), userId },
    });
    if (!task) throw Object.assign(new Error("ไม่พบ task"), { status: 404 });

    const sub = await prisma.subtask.findFirst({
      where: { id: Number(subId), taskId: Number(taskId) },
    });
    if (!sub) throw Object.assign(new Error("ไม่พบ subtask"), { status: 404 });

    await prisma.subtask.delete({ where: { id: Number(subId) } });
    return Number(subId);
  },

  async getSummary(userId) {
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

    return { total, done, pending: total - done, overdue };
  },

  async getCategories(userId) {
    const tasks = await prisma.task.findMany({
      where: { userId, category: { not: "" } },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    });
    return tasks.map((t) => t.category);
  },
};
