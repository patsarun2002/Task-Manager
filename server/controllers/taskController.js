import { taskService } from "../services/taskService.js";

const handle = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    console.error(`[${fn.name}]`, err);
    res
      .status(err.status || 500)
      .json({ error: err.message || "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
};

export const getTasks = handle(async (req, res) => {
  const result = await taskService.getMany(req.user.id, req.query);
  res.json(result);
});

export const createTask = handle(async (req, res) => {
  const task = await taskService.create(req.user.id, req.body);
  res.status(201).json(task);
});

export const updateTask = handle(async (req, res) => {
  const task = await taskService.update(req.params.id, req.user.id, req.body);
  res.json(task);
});

export const deleteTask = handle(async (req, res) => {
  await taskService.remove(req.params.id, req.user.id);
  res.json({ message: "ลบ task สำเร็จ" });
});

export const reorderTasks = handle(async (req, res) => {
  await taskService.reorder(req.user.id, req.body.tasks);
  res.json({ message: "บันทึกลำดับสำเร็จ" });
});

export const addSubtask = handle(async (req, res) => {
  const subtask = await taskService.addSubtask(
    req.params.id,
    req.user.id,
    req.body.title,
  );
  res.status(201).json(subtask);
});

export const toggleSubtask = handle(async (req, res) => {
  const updated = await taskService.toggleSubtask(
    req.params.id,
    req.params.subId,
    req.user.id,
  );
  res.json(updated);
});

export const deleteSubtask = handle(async (req, res) => {
  const id = await taskService.removeSubtask(
    req.params.id,
    req.params.subId,
    req.user.id,
  );
  res.json({ id });
});

export const getSummary = handle(async (req, res) => {
  const summary = await taskService.getSummary(req.user.id);
  res.json(summary);
});

export const getCategories = handle(async (req, res) => {
  const categories = await taskService.getCategories(req.user.id);
  res.json(categories);
});
