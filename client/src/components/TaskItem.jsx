import { useState, useEffect, useMemo, memo } from "react";
import SubtaskList from "./SubtaskList";
import TaskEditForm from "./TaskEditForm";

const TaskItem = memo(function TaskItem({
  task,
  onToggle,
  onEdit,
  onDelete,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  dragListeners,
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
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setEditTitle(task.title);
    setEditDeadline(task.deadline || "");
    setEditDeadlineTime(task.deadlineTime || "");
    setEditPriority(task.priority || "medium");
    setEditCategory(task.category || "");
    setEditRecurring(task.recurring?.type || "none");
    setEditRecurringDays(task.recurring?.days || []);
    setEditNote(task.note || "");
  }, [task]);

  const toggleEditDay = (day) => {
    setEditRecurringDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const isOverdue = useMemo(() => {
    if (!task.deadline || task.status === "done") return false;
    const dt = new Date(`${task.deadline}T${task.deadlineTime || "23:59:59"}`);
    return dt < new Date();
  }, [task.deadline, task.deadlineTime, task.status]);

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
    } catch (e) {
      console.error("save failed:", e);
    }
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
      <span className="drag-handle" {...dragListeners}>
        ⠿
      </span>
      <input
        type="checkbox"
        checked={task.status === "done"}
        onChange={() => onToggle(task)}
      />

      {editing ? (
        <TaskEditForm
          editTitle={editTitle}
          setEditTitle={setEditTitle}
          editDeadline={editDeadline}
          setEditDeadline={setEditDeadline}
          editDeadlineTime={editDeadlineTime}
          setEditDeadlineTime={setEditDeadlineTime}
          editPriority={editPriority}
          setEditPriority={setEditPriority}
          editCategory={editCategory}
          setEditCategory={setEditCategory}
          editRecurring={editRecurring}
          setEditRecurring={setEditRecurring}
          editRecurringDays={editRecurringDays}
          setEditRecurringDays={setEditRecurringDays}
          onSave={handleSave}
          onCancel={handleCancel}
          toggleEditDay={toggleEditDay}
        />
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
            title="แสดง subtask"
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
          {confirmDelete ? (
            <>
              <span className="confirm-label">ยืนยัน?</span>
              <button
                className="delete-btn confirm-yes"
                onClick={() => onDelete(task.id)}
              >
                ใช่
              </button>
              <button
                className="confirm-no"
                onClick={() => setConfirmDelete(false)}
              >
                ไม่
              </button>
            </>
          ) : (
            <button
              className="delete-btn"
              onClick={() => setConfirmDelete(true)}
            >
              ลบ
            </button>
          )}
        </div>
      )}

      {expanded && (
        <div className="task-expanded">
          <textarea
            className="task-note"
            placeholder="เพิ่ม note..."
            value={editNote}
            onChange={(e) => setEditNote(e.target.value)}
            onBlur={() => {
              if (editNote !== task.note) onEdit(task.id, { note: editNote });
            }}
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
});

export default TaskItem;
