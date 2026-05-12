import { useState } from "react";
import SubtaskList from "./SubtaskList";

export default function TaskItem({
  task,
  onToggle,
  onEdit,
  onDelete,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDeadline, setEditDeadline] = useState(task.deadline || "");
  const [editDeadlineTime, setEditDeadlineTime] = useState(
    task.deadlineTime || "",
  );
  const [editPriority, setEditPriority] = useState(task.priority || "medium");
  const [editCategory, setEditCategory] = useState(task.category || "");
  const [editRecurring, setEditRecurring] = useState(
    task.recurring?.type || "none",
  );
  const [editRecurringDays, setEditRecurringDays] = useState(
    task.recurring?.days || [],
  );
  const [expanded, setExpanded] = useState(false);
  const [editNote, setEditNote] = useState(task.note || "");

  const toggleEditDay = (day) => {
    setEditRecurringDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const deadlineDateTime = task.deadline
    ? new Date(`${task.deadline}T${task.deadlineTime || "23:59:59"}`)
    : null;

  const isOverdue =
    deadlineDateTime && deadlineDateTime < new Date() && task.status !== "done";

  const handleSave = async () => {
    if (!editTitle.trim()) return;
    try {
      const recurringData =
        editRecurring === "none"
          ? null
          : editRecurring === "daily"
            ? {
                type: "daily",
                days: [],
                lastCompleted: task.recurring?.lastCompleted || null,
              }
            : {
                type: "weekly",
                days: editRecurringDays,
                lastCompleted: task.recurring?.lastCompleted || null,
              };

      await onEdit(task.id, {
        title: editTitle,
        deadline: editDeadline,
        deadlineTime: editDeadlineTime,
        priority: editPriority,
        category: editCategory,
        recurring: recurringData,
      });
      setEditing(false);
    } catch {}
  };

  const handleCancel = () => {
    setEditTitle(task.title);
    setEditDeadline(task.deadline || "");
    setEditDeadlineTime(task.deadlineTime || "");
    setEditPriority(task.priority || "medium");
    setEditCategory(task.category || "");
    setEditRecurring(task.recurring?.type || "none");
    setEditRecurringDays(task.recurring?.days || []);
    setEditing(false);
  };

  return (
    <div className={`task-item ${task.status} ${isOverdue ? "overdue" : ""}`}>
      <input
        type="checkbox"
        checked={task.status === "done"}
        onChange={() => onToggle(task)}
      />

      {editing ? (
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
            <button onClick={handleSave}>บันทึก</button>
            <button onClick={handleCancel}>ยกเลิก</button>
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
                {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((label, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`day-btn ${editRecurringDays.includes(i) ? "active" : ""}`}
                    onClick={() => toggleEditDay(i)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="task-info">
          <span className="task-title">{task.title}</span>
          {task.deadline && (
            <span
              className={`task-deadline ${isOverdue ? "overdue-text" : ""}`}
            >
              {isOverdue ? "⚠ " : ""}
              {new Date(task.deadline).toLocaleDateString("th-TH")}
              {task.deadlineTime && (
                <span className="deadline-time"> {task.deadlineTime} น.</span>
              )}
            </span>
          )}
          <div className="task-meta">
            <span className={`priority-badge priority-${task.priority}`}>
              {task.priority === "high"
                ? "🔴 High"
                : task.priority === "medium"
                  ? "🟡 Medium"
                  : "🟢 Low"}
            </span>
            {task.category && (
              <span className="category-badge">{task.category}</span>
            )}
            {task.recurring && (
              <span className="recurring-badge">
                🔁 {task.recurring.type === "daily" ? "ทุกวัน" : "ทุกสัปดาห์"}
              </span>
            )}
          </div>
        </div>
      )}

      {!editing && (
        <div className="task-actions">
          <button
            onClick={() => {
              setExpanded(!expanded);
              setEditing(false);
            }}
          >
            {expanded ? "▲" : "▼"}
          </button>
          <button
            onClick={() => {
              setEditing(true);
              setExpanded(false);
            }}
          >
            แก้ไข
          </button>{" "}
          <button
            className="delete-btn"
            onClick={() => {
              if (window.confirm(`ลบ "${task.title}" ใช่ไหม?`))
                onDelete(task.id);
            }}
          >
            ลบ
          </button>
        </div>
      )}

      {expanded && (
        <div className="task-expanded">
          <textarea
            className="task-note"
            placeholder="เพิ่ม note..."
            value={editNote}
            onChange={(e) => setEditNote(e.target.value)}
            onBlur={() => onEdit(task.id, { note: editNote })}
            rows={2}
          />
          <SubtaskList
            task={task}
            onAdd={onAddSubtask}
            onToggle={onToggleSubtask}
            onDelete={onDeleteSubtask}
          />
        </div>
      )}
    </div>
  );
}
