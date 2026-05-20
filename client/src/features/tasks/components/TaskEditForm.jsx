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

export default function TaskEditForm({
  editTitle,
  setEditTitle,
  editDeadline,
  setEditDeadline,
  editDeadlineTime,
  setEditDeadlineTime,
  editPriority,
  setEditPriority,
  editCategory,
  setEditCategory,
  editRecurring,
  setEditRecurring,
  editRecurringDays,
  setEditRecurringDays,
  onSave,
  onCancel,
}) {
  const toggleDay = (day) =>
    setEditRecurringDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );

  return (
    <div className="flex flex-col gap-2 flex-1">
      {/* Row 1: title + date + time + actions */}
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          maxLength={100}
          className="flex-1 min-w-[140px] font-medium"
        />
        <Input
          type="date"
          value={editDeadline}
          onChange={(e) => setEditDeadline(e.target.value)}
          className="w-auto"
        />
        <Input
          type="time"
          value={editDeadlineTime}
          onChange={(e) => setEditDeadlineTime(e.target.value)}
          disabled={!editDeadline}
          className="w-auto disabled:opacity-40 disabled:cursor-not-allowed"
        />
        <Button onClick={onSave} size="sm">
          บันทึก
        </Button>
        <Button onClick={onCancel} size="sm" variant="outline">
          ยกเลิก
        </Button>
      </div>

      {/* Row 2: priority + category */}
      <div className="flex flex-wrap gap-2">
        <Select value={editPriority} onValueChange={setEditPriority}>
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
          placeholder="Category..."
          value={editCategory}
          onChange={(e) => setEditCategory(e.target.value)}
          maxLength={50}
          className="flex-1 min-w-[120px]"
        />
      </div>

      {/* Row 3: recurring */}
      <div className="flex flex-wrap gap-2 items-center">
        <Select
          value={editRecurring}
          onValueChange={(v) => {
            setEditRecurring(v);
            setEditRecurringDays([]);
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

        {editRecurring === "weekly" && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-zinc-400">วัน:</span>
            {DAY_LABELS.map((label, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleDay(i)}
                className={`w-7 h-7 text-xs rounded-full font-medium transition-all ${
                  editRecurringDays.includes(i)
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
    </div>
  );
}
