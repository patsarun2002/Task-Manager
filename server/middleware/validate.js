export const validateTask = (req, res, next) => {
  const { title, status, deadline } = req.body;

  if (req.method === "POST" && (!title || title.trim() === "")) {
    return res.status(400).json({ error: "Title is required" });
  }

  // เช็ค title ไม่เกิน 100 ตัวอักษร
  if (title !== undefined) {
    if (title.trim().length > 100) {
      return res.status(400).json({ error: "Title must be under 100 characters" });
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

  next();
};