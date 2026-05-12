import express from 'express'
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask
} from '../controllers/taskController.js'
import { validateTask } from '../middleware/validate.js'

const router = express.Router()

router.get('/', getTasks)
router.post('/', validateTask, createTask)      // ← เพิ่ม validateTask
router.put('/:id', validateTask, updateTask)   // ← เพิ่ม validateTask
router.delete('/:id', deleteTask)

export default router