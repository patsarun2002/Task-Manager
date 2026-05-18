import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DAY_LABELS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

export default function TaskForm({ onSubmit, isSubmitting = false, isLoggedIn, onLoginRequired }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("");
  const [recurring, setRecurring] = useState("none");
  const [recurringDays, setRecurringDays] = useState([]);
  const [err, setErr] = useState("");

  const toggleDay = (day) =>
    setRecurringDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );

  const handleOpen = () => {
    if (!isLoggedIn) {
      onLoginRequired();
      return;
    }
    setIsOpen(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    setErr("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="w-full text-left text-sm text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-500 rounded-lg px-3 py-2 mb-4 transition-all bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-750"
      >
        + เพิ่ม task ใหม่...
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4 flex flex-col gap-3 mb-4 shadow-sm"
    >
      {/* Row 1: title + date + time + submit */}
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          type="text"
          placeholder="ชื่อ task..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          autoFocus
          className="flex-1 min-w-[180px] font-medium placeholder:font-normal"
        />
        <Input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="w-auto"
        />
        <Input
          type="time"
          value={deadlineTime}
          onChange={(e) => setDeadlineTime(e.target.value)}
          disabled={!deadline}
          className="w-auto disabled:opacity-40 disabled:cursor-not-allowed"
        />
        <Button type="submit" disabled={isSubmitting} className="whitespace-nowrap">
          {isSubmitting ? "กำลังเพิ่ม..." : "+ เพิ่ม"}
        </Button>
        <button
          type="button"
          onClick={handleCancel}
          className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
        >
          ยกเลิก
        </button>
      </div>

      {/* Row 2: priority + category */}
      <div className="flex flex-wrap gap-2">
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">🟢 Low</SelectItem>
            <SelectItem value="medium">🟡 Medium</SelectItem>
            <SelectItem value="high">🔴 High</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="text"
          placeholder="Category เช่น งาน, เรียน..."
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          maxLength={50}
          className="flex-1 min-w-[160px]"
        />
      </div>

      {/* Row 3: recurring */}
      <div className="flex flex-wrap gap-2 items-center">
        <Select
          value={recurring}
          onValueChange={(v) => {
            setRecurring(v);
            setRecurringDays([]);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">🔁 ไม่ซ้ำ</SelectItem>
            <SelectItem value="daily">🔁 ทุกวัน</SelectItem>
            <SelectItem value="weekly">🔁 ทุกสัปดาห์</SelectItem>
          </SelectContent>
        </Select>

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
