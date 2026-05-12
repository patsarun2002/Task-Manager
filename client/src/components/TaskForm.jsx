import { useState } from "react";

export default function TaskForm({ onSubmit }) {
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [err, setErr] = useState("");
  const [priority, setPriority] = useState("medium"); // ← เพิ่ม
  const [category, setCategory] = useState(""); // ← เพิ่ม
  const [deadlineTime, setDeadlineTime] = useState("");
  const [recurring, setRecurring] = useState("none"); // 'none' | 'daily' | 'weekly'
  const [recurringDays, setRecurringDays] = useState([]); // [0-6]

  const toggleDay = (day) => {
    setRecurringDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!title.trim()) {
      setErr("กรุณากรอกชื่อ task");
      return;
    }

    const recurringData =
      recurring === "none"
        ? null
        : recurring === "daily"
          ? { type: "daily", days: [], lastCompleted: null }
          : { type: "weekly", days: recurringDays, lastCompleted: null };

    if (recurring === "weekly" && recurringDays.length === 0) {
      setErr("กรุณาเลือกอย่างน้อย 1 วัน");
      return;
    }

    await onSubmit({
      title,
      deadline,
      deadlineTime,
      priority,
      category,
      recurring: recurringData,
    });
    setDeadlineTime("");
    setTitle("");
    setDeadline("");
    setPriority("medium"); // ← เพิ่ม
    setCategory(""); // ← เพิ่ม
    setRecurring("none");
    setRecurringDays([]);
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <input
          type="text"
          placeholder="ชื่อ task..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
        />
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />
        <input
          type="time"
          value={deadlineTime}
          onChange={(e) => setDeadlineTime(e.target.value)}
          disabled={!deadline} // ← กำหนดเวลาได้เมื่อมีวันที่เท่านั้น
          className="time-input"
        />
        <button type="submit">+ เพิ่ม</button>
      </div>

      <div className="form-row-secondary">
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="low">🟢 Low</option>
          <option value="medium">🟡 Medium</option>
          <option value="high">🔴 High</option>
        </select>
        <input
          type="text"
          placeholder="Category เช่น งาน, เรียน..."
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          maxLength={50}
        />
      </div>

      <div className="form-row-secondary">
        <select
          value={recurring}
          onChange={(e) => {
            setRecurring(e.target.value);
            setRecurringDays([]);
          }}
        >
          <option value="none">🔁 ไม่ซ้ำ</option>
          <option value="daily">🔁 ทุกวัน</option>
          <option value="weekly">🔁 ทุกสัปดาห์</option>
        </select>

        {recurring === "weekly" && (
          <div className="day-picker">
            <span className="day-picker-label">เลือกวัน:</span>
            {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((label, i) => (
              <button
                key={i}
                type="button"
                className={`day-btn ${recurringDays.includes(i) ? "active" : ""}`}
                onClick={() => toggleDay(i)}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {err && <p className="form-error">{err}</p>}
    </form>
  );
}
