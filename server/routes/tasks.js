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
  getSummary,
  getCategories,
} from "../controllers/taskController.js";
import { validateTask } from "../middleware/validate.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.use(verifyToken);

// ต้องอยู่ก่อน /:id ทุกตัว
router.get("/summary", getSummary);
router.get("/categories", getCategories);

router.get("/", getTasks);
router.post("/", validateTask, createTask);
router.put("/:id", validateTask, updateTask);
router.delete("/:id", deleteTask);

router.patch("/reorder", reorderTasks);

router.post("/:id/subtasks", addSubtask);
router.patch("/:id/subtasks/:subId", toggleSubtask);
router.delete("/:id/subtasks/:subId", deleteSubtask);

export default router;