import express from "express";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  toggleSubtask,
  addSubtask,
  deleteSubtask,
} from "../controllers/taskController.js";
import { validateTask } from "../middleware/validate.js";

const router = express.Router();

router.get("/", getTasks);
router.post("/", validateTask, createTask); // ← เพิ่ม validateTask
router.put("/:id", validateTask, updateTask); // ← เพิ่ม validateTask
router.delete("/:id", deleteTask);

router.post("/:id/subtasks", addSubtask);
router.patch("/:id/subtasks/:subId", toggleSubtask);
router.delete("/:id/subtasks/:subId", deleteSubtask);

export default router;
