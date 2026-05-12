import { useState } from "react";

export default function TaskItem({ task, onToggle, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDeadline, setEditDeadline] = useState(task.deadline || "");

  const isOverdue =
    task.deadline &&
    new Date(task.deadline + "T23:59:59") < new Date() &&
    task.status !== "done";

  const handleSave = async () => {
    if (!editTitle.trim()) return;
    try {
      await onEdit(task.id, { title: editTitle, deadline: editDeadline });
      setEditing(false);
    } catch {}
  };

  const handleCancel = () => {
    setEditTitle(task.title);
    setEditDeadline(task.deadline || "");
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
          <button onClick={handleSave}>บันทึก</button>
          <button onClick={handleCancel}>ยกเลิก</button>
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
            </span>
          )}
        </div>
      )}

      {!editing && (
        <div className="task-actions">
          <button onClick={() => setEditing(true)}>แก้ไข</button>
          <button className="delete-btn" onClick={() => onDelete(task.id)}>
            ลบ
          </button>
        </div>
      )}
    </div>
  );
}
