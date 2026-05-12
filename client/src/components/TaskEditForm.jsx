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

  return (
    <div className="edit-rows">
      <div className="edit-row">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          maxLength={100}
        />
        <input
          type="date"
          value={editDeadline}
          onChange={(e) => setEditDeadline(e.target.value)}
        />
        <input
          type="time"
          value={editDeadlineTime}
          onChange={(e) => setEditDeadlineTime(e.target.value)}
          disabled={!editDeadline}
          className="time-input"
        />
        <button onClick={onSave}>บันทึก</button>
        <button onClick={onCancel}>ยกเลิก</button>
      </div>
      <div className="edit-row-secondary">
        <select
          value={editPriority}
          onChange={(e) => setEditPriority(e.target.value)}
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
        />
      </div>
      <div className="edit-row-secondary">
        <select
          value={editRecurring}
          onChange={(e) => {
            setEditRecurring(e.target.value);
            setEditRecurringDays([]);
          }}
        >
          <option value="none">🔁 ไม่ซ้ำ</option>
          <option value="daily">🔁 ทุกวัน</option>
          <option value="weekly">🔁 ทุกสัปดาห์</option>
        </select>
        {editRecurring === "weekly" && (
          <div className="day-picker">
            <span className="day-picker-label">เลือกวัน:</span>
            {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((label, i) => (
              <button
                key={i}
                type="button"
                className={`day-btn ${editRecurringDays.includes(i) ? "active" : ""}`}
                onClick={() => toggleDay(i)}
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
