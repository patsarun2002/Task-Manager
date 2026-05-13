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
  const toggleDay = (day) => {
    setEditRecurringDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const inputCls =
    "px-2.5 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500";
  const selectCls = `${inputCls} cursor-pointer text-zinc-600 dark:text-zinc-300`;

  return (
    <div className="flex flex-col gap-2 flex-1">
      {/* Row 1: title + date + time + actions */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          maxLength={100}
          className={`${inputCls} flex-1 min-w-[140px] font-medium`}
        />
        <input
          type="date"
          value={editDeadline}
          onChange={(e) => setEditDeadline(e.target.value)}
          className={inputCls}
        />
        <input
          type="time"
          value={editDeadlineTime}
          onChange={(e) => setEditDeadlineTime(e.target.value)}
          disabled={!editDeadline}
          className={`${inputCls} disabled:opacity-40 disabled:cursor-not-allowed`}
        />
        <button
          onClick={onSave}
          className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
        >
          บันทึก
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-600 dark:text-zinc-300 rounded-lg transition"
        >
          ยกเลิก
        </button>
      </div>

      {/* Row 2: priority + category */}
      <div className="flex flex-wrap gap-2">
        <select
          value={editPriority}
          onChange={(e) => setEditPriority(e.target.value)}
          className={selectCls}
        >
          <option value="low">🟢 Low</option>
          <option value="medium">🟡 Medium</option>
          <option value="high">🔴 High</option>
        </select>
        <input
          type="text"
          placeholder="Category..."
          value={editCategory}
          onChange={(e) => setEditCategory(e.target.value)}
          maxLength={50}
          className={`${inputCls} flex-1 min-w-[120px]`}
        />
      </div>

      {/* Row 3: recurring */}
      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={editRecurring}
          onChange={(e) => {
            setEditRecurring(e.target.value);
            setEditRecurringDays([]);
          }}
          className={selectCls}
        >
          <option value="none">🔁 ไม่ซ้ำ</option>
          <option value="daily">🔁 ทุกวัน</option>
          <option value="weekly">🔁 ทุกสัปดาห์</option>
        </select>
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
