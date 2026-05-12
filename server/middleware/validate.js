export const validateTask = (req, res, next) => {
const { title, status, deadline, deadlineTime, priority, category, recurring } = req.body
  if (req.method === "POST" && (!title || title.trim() === "")) {
    return res.status(400).json({ error: "Title is required" });
  }

  // เช็ค title ไม่เกิน 100 ตัวอักษร
  if (title !== undefined) {
    if (title.trim().length > 100) {
      return res
        .status(400)
        .json({ error: "Title must be under 100 characters" });
    }
  }

  // เช็ค status ต้องเป็นแค่ pending หรือ done
  if (status !== undefined) {
    if (!["pending", "done"].includes(status)) {
      return res.status(400).json({ error: "Status must be pending or done" });
    }
  }

  // เช็ค deadline เป็น date format ถูกต้อง
  if (deadline !== undefined && deadline !== null && deadline !== "") {
    const date = new Date(deadline);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ error: "Invalid deadline date" });
    }
  }

  if (priority !== undefined) {
    if (!["low", "medium", "high"].includes(priority)) {
      return res
        .status(400)
        .json({ error: "Priority must be low, medium, or high" });
    }
  }

  if (category !== undefined && category !== null && category !== "") {
    if (typeof category !== "string" || category.trim().length > 50) {
      return res
        .status(400)
        .json({ error: "Category must be under 50 characters" });
    }
  }

  if (
    deadlineTime !== undefined &&
    deadlineTime !== null &&
    deadlineTime !== ""
  ) {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(deadlineTime)) {
      return res.status(400).json({ error: "Invalid time format (HH:MM)" });
    }
  }

  if (recurring !== undefined && recurring !== null) {
  if (!['daily', 'weekly'].includes(recurring.type)) {
    return res.status(400).json({ error: 'Recurring type must be daily or weekly' })
  }
  if (recurring.type === 'weekly') {
    if (!Array.isArray(recurring.days) || recurring.days.length === 0) {
      return res.status(400).json({ error: 'Weekly recurring requires at least one day' })
    }
    if (recurring.days.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) {
      return res.status(400).json({ error: 'Days must be integers 0-6' })
    }
  }
}

  next();
};
