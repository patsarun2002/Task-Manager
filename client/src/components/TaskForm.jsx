import { useState } from "react";

const DAY_LABELS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

export default function TaskForm({ onSubmit, isLoggedIn, onLoginRequired }) {
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("");
  const [recurring, setRecurring] = useState("none");
  const [recurringDays, setRecurringDays] = useState([]);
  const [err, setErr] = useState("");

  const toggleDay = (day) => {
    setRecurringDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      onLoginRequired();
      return;
    }
    setErr("");
    if (!title.trim()) return setErr("กรุณากรอกชื่อ task");
    if (recurring === "weekly" && recurringDays.length === 0)
      return setErr("กรุณาเลือกอย่างน้อย 1 วัน");

    const recurringData =
      recurring === "none"
        ? null
        : recurring === "daily"
          ? { type: "daily", days: [], lastCompleted: null }
          : { type: "weekly", days: recurringDays, lastCompleted: null };

    await onSubmit({
      title,
      deadline,
      deadlineTime,
      priority,
      category,
      recurring: recurringData,
    });
    setTitle("");
    setDeadline("");
    setDeadlineTime("");
    setPriority("medium");
    setCategory("");
    setRecurring("none");
    setRecurringDays([]);
  };

  const inputCls =
    "px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500";
  const selectCls = `${inputCls} cursor-pointer text-zinc-600 dark:text-zinc-300`;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4 flex flex-col gap-3 mb-4 shadow-sm"
    >
      {/* Row 1: title + date + time + submit */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="text"
          placeholder="ชื่อ task..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          className={`${inputCls} flex-1 min-w-[180px] font-medium placeholder:font-normal`}
        />
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className={inputCls}
        />
        <input
          type="time"
          value={deadlineTime}
          onChange={(e) => setDeadlineTime(e.target.value)}
          disabled={!deadline}
          className={`${inputCls} disabled:opacity-40 disabled:cursor-not-allowed`}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition shadow-sm shadow-blue-200 whitespace-nowrap"
        >
          + เพิ่ม
        </button>
      </div>

      {/* Row 2: priority + category */}
      <div className="flex flex-wrap gap-2">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className={selectCls}
        >
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
          className={`${inputCls} flex-1 min-w-[160px]`}
        />
      </div>

      {/* Row 3: recurring */}
      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={recurring}
          onChange={(e) => {
            setRecurring(e.target.value);
            setRecurringDays([]);
          }}
          className={selectCls}
        >
          <option value="none">🔁 ไม่ซ้ำ</option>
          <option value="daily">🔁 ทุกวัน</option>
          <option value="weekly">🔁 ทุกสัปดาห์</option>
        </select>
        {recurring === "weekly" && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-zinc-400">วัน:</span>
            {DAY_LABELS.map((label, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleDay(i)}
                className={`w-7 h-7 text-xs rounded-full font-medium transition-all ${
                  recurringDays.includes(i)
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {err && <p className="text-xs text-red-500">{err}</p>}
    </form>
  );
}
