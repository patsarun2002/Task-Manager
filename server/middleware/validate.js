export const validateTask = (req, res, next) => {
  const {
    title,
    status,
    deadline,
    deadlineTime,
    priority,
    category,
    recurring,
    note,
  } = req.body;

  if (req.method === "POST" && (!title || title.trim() === "")) {
    return res.status(400).json({ error: "กรุณากรอกชื่อ task" });
  }

  if (title !== undefined) {
    if (title.trim().length > 100) {
      return res
        .status(400)
        .json({ error: "ชื่อ task ต้องไม่เกิน 100 ตัวอักษร" });
    }
  }

  if (status !== undefined) {
    if (!["pending", "done"].includes(status)) {
      return res
        .status(400)
        .json({ error: "สถานะต้องเป็น pending หรือ done เท่านั้น" });
    }
  }

  if (deadline !== undefined && deadline !== null && deadline !== "") {
    const date = new Date(deadline);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ error: "รูปแบบวันที่ไม่ถูกต้อง" });
    }
  }

  if (priority !== undefined) {
    if (!["low", "medium", "high"].includes(priority)) {
      return res
        .status(400)
        .json({ error: "ความสำคัญต้องเป็น low, medium หรือ high เท่านั้น" });
    }
  }

  if (category !== undefined && category !== null && category !== "") {
    if (typeof category !== "string" || category.trim().length > 50) {
      return res.status(400).json({ error: "หมวดหมู่ต้องไม่เกิน 50 ตัวอักษร" });
    }
  }

  if (
    deadlineTime !== undefined &&
    deadlineTime !== null &&
    deadlineTime !== ""
  ) {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(deadlineTime)) {
      return res
        .status(400)
        .json({ error: "รูปแบบเวลาไม่ถูกต้อง (ต้องเป็น HH:MM)" });
    }
  }

  if (recurring !== undefined && recurring !== null) {
    if (!["daily", "weekly"].includes(recurring.type)) {
      return res
        .status(400)
        .json({ error: "ประเภทการทำซ้ำต้องเป็น daily หรือ weekly เท่านั้น" });
    }
    if (recurring.type === "weekly") {
      if (!Array.isArray(recurring.days) || recurring.days.length === 0) {
        return res
          .status(400)
          .json({ error: "กรุณาเลือกอย่างน้อย 1 วันสำหรับการทำซ้ำรายสัปดาห์" });
      }
      if (recurring.days.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) {
        return res
          .status(400)
          .json({ error: "วันต้องเป็นตัวเลข 0-6 เท่านั้น" });
      }
    }
  }

  if (note !== undefined && note !== null) {
    if (typeof note !== "string" || note.trim().length > 500) {
      return res
        .status(400)
        .json({ error: "หมายเหตุต้องไม่เกิน 500 ตัวอักษร" });
    }
  }

  next();
};
