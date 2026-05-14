import express from "express";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
  toggleSubtask,
  addSubtask,
  deleteSubtask,
} from "../controllers/taskController.js";
import { validateTask } from "../middleware/validate.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.use(verifyToken);

router.get("/", getTasks);
router.post("/", validateTask, createTask);
router.put("/:id", validateTask, updateTask);
router.delete("/:id", deleteTask);

// reorder ต้องอยู่ก่อน /:id/subtasks เพื่อไม่ให้ชนกัน
router.patch("/reorder", reorderTasks);

router.post("/:id/subtasks", addSubtask);
router.patch("/:id/subtasks/:subId", toggleSubtask);
router.delete("/:id/subtasks/:subId", deleteSubtask);

export default router;
