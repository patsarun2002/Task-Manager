import db from "../db.js";
import { v4 as uuidv4 } from "uuid";

function getNextDeadline(task) {
  const now = new Date();

  if (task.recurring.type === "daily") {
    const next = new Date(now);
    next.setDate(next.getDate() + 1);
    return next.toISOString().split("T")[0]; // "YYYY-MM-DD"
  }

  if (task.recurring.type === "weekly") {
    const days = task.recurring.days.sort((a, b) => a - b);
    const todayDay = now.getDay();

    // หาวันถัดไปใน days[]
    let nextDay = days.find((d) => d > todayDay);

    // ถ้าไม่มีในสัปดาห์นี้ → วนไปสัปดาห์หน้า
    if (nextDay === undefined) nextDay = days[0];

    const diff =
      nextDay > todayDay ? nextDay - todayDay : 7 - todayDay + nextDay;

    const next = new Date(now);
    next.setDate(next.getDate() + diff);
    return next.toISOString().split("T")[0];
  }

  return task.deadline;
}

// GET /api/tasks — ดึง tasks ทั้งหมด (กรองและเรียงได้)
export const getTasks = async (req, res) => {
  await db.read();
  let tasks = [...db.data.tasks];

  const { status, search, sort, priority, category } = req.query;

  // filter by status
  if (status && status !== "all") {
    tasks = tasks.filter((t) => t.status === status);
  }

  if (priority && priority !== "all") {
    tasks = tasks.filter((t) => t.priority === priority);
  }

  if (category && category !== "all") {
    tasks = tasks.filter((t) => t.category === category);
  }

  // search by title
  if (search) {
    tasks = tasks.filter((t) =>
      t.title.toLowerCase().includes(search.toLowerCase()),
    );
  }

  // sort by deadline
  if (sort === "date") {
    tasks = [...tasks].sort((a, b) => {
      const aStr = a.deadline
        ? `${a.deadline}T${a.deadlineTime || "23:59"}`
        : "9999";
      const bStr = b.deadline
        ? `${b.deadline}T${b.deadlineTime || "23:59"}`
        : "9999";
      return new Date(aStr) - new Date(bStr);
    });
  }

  res.json(tasks);
};

// POST /api/tasks — สร้าง task ใหม่
export const createTask = async (req, res) => {
  const { title, deadline, deadlineTime, priority, category, note, recurring } =
    req.body;
  if (!title || title.trim() === "") {
    return res.status(400).json({ error: "Title is required" });
  }

  const newTask = {
    id: uuidv4(),
    title: title.trim(),
    status: "pending",
    priority: priority || "medium", // ← เพิ่ม
    category: category?.trim() || "", // ← เพิ่ม
    note: note?.trim() || "", // ← เพิ่ม
    subtasks: [], // ← เพิ่ม array ว่าง
    deadline: deadline || null,
    deadlineTime: deadlineTime || null, // ← เพิ่ม
    recurring: recurring || null,
    createdAt: new Date().toISOString(),
  };

  await db.read();
  db.data.tasks.push(newTask);
  await db.write();

  res.status(201).json(newTask);
};

// PUT /api/tasks/:id — แก้ไข task
export const updateTask = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    status,
    deadline,
    deadlineTime,
    priority,
    category,
    note,
    subtasks,
    recurring,
  } = req.body;
  await db.read();
  const task = db.data.tasks.find((t) => t.id === id);

  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  if (title !== undefined) task.title = title.trim();
  if (status !== undefined) {
    if (status === "done" && task.recurring) {
      // บันทึกวันที่ทำเสร็จ
      task.recurring.lastCompleted = new Date().toISOString();

      // คำนวณ deadline ถัดไป
      task.deadline = getNextDeadline(task);

      // reset กลับ pending อัตโนมัติ
      task.status = "pending";
    } else {
      task.status = status;
    }
  }
  if (deadline !== undefined) task.deadline = deadline;
  if (deadlineTime !== undefined) task.deadlineTime = deadlineTime;
  if (priority !== undefined) task.priority = priority; // ← เพิ่ม
  if (category !== undefined) task.category = category; // ← เพิ่ม
  if (note !== undefined) task.note = note.trim(); // ← เพิ่ม
  if (subtasks !== undefined) task.subtasks = subtasks; // ← เพิ่ม
  if (recurring !== undefined) task.recurring = recurring;

  await db.write();
  res.json(task);
};

// DELETE /api/tasks/:id — ลบ task
export const deleteTask = async (req, res) => {
  const { id } = req.params;

  await db.read();
  const index = db.data.tasks.findIndex((t) => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Task not found" });
  }

  db.data.tasks.splice(index, 1);
  await db.write();

  res.json({ message: "Deleted" });
};

// PATCH /api/tasks/:id/subtasks/:subId — toggle subtask
export const toggleSubtask = async (req, res) => {
  const { id, subId } = req.params;

  await db.read();
  const task = db.data.tasks.find((t) => t.id === id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const sub = task.subtasks.find((s) => s.id === subId);
  if (!sub) return res.status(404).json({ error: "Subtask not found" });

  sub.done = !sub.done;
  await db.write();
  res.json(task);
};

// POST /api/tasks/:id/subtasks — เพิ่ม subtask
export const addSubtask = async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;

  if (!title?.trim()) {
    return res.status(400).json({ error: "Subtask title is required" });
  }

  await db.read();
  const task = db.data.tasks.find((t) => t.id === id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const newSub = {
    id: uuidv4(),
    title: title.trim(),
    done: false,
  };

  task.subtasks.push(newSub);
  await db.write();
  res.status(201).json(task);
};

// DELETE /api/tasks/:id/subtasks/:subId — ลบ subtask
export const deleteSubtask = async (req, res) => {
  const { id, subId } = req.params;

  await db.read();
  const task = db.data.tasks.find((t) => t.id === id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const index = task.subtasks.findIndex((s) => s.id === subId);
  if (index === -1) return res.status(404).json({ error: "Subtask not found" });

  task.subtasks.splice(index, 1);
  await db.write();
  res.json(task);
};
