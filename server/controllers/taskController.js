import db from "../db.js";
import { v4 as uuidv4 } from "uuid";

// GET /api/tasks — ดึง tasks ทั้งหมด (กรองและเรียงได้)
export const getTasks = async (req, res) => {
  await db.read();
  let tasks = [...db.data.tasks];

  const { status, search, sort } = req.query;

  // filter by status
  if (status && status !== "all") {
    tasks = tasks.filter((t) => t.status === status);
  }

  // search by title
  if (search) {
    tasks = tasks.filter((t) =>
      t.title.toLowerCase().includes(search.toLowerCase()),
    );
  }

  // sort by deadline
  if (sort === "date") {
    tasks = [...tasks].sort(
      (a, b) => new Date(a.deadline) - new Date(b.deadline),
    );
  }

  res.json(tasks);
};

// POST /api/tasks — สร้าง task ใหม่
export const createTask = async (req, res) => {
  const { title, deadline } = req.body;

  if (!title || title.trim() === "") {
    return res.status(400).json({ error: "Title is required" });
  }

  const newTask = {
    id: uuidv4(),
    title: title.trim(),
    status: "pending",
    deadline: deadline || null,
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
  const { title, status, deadline } = req.body;

  await db.read();
  const task = db.data.tasks.find((t) => t.id === id);

  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  if (title !== undefined) task.title = title.trim();
  if (status !== undefined) task.status = status;
  if (deadline !== undefined) task.deadline = deadline;

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
