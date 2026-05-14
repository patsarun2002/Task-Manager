import { useState, useEffect, useMemo, memo } from "react";
import SubtaskList from "./SubtaskList";
import TaskEditForm from "./TaskEditForm";

const PRIORITY_CONFIG = {
  high: {
    label: "High",
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-600 border-red-200",
  },
  medium: {
    label: "Medium",
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-600 border-amber-200",
  },
  low: {
    label: "Low",
    dot: "bg-emerald-400",
    badge: "bg-emerald-50 text-emerald-600 border-emerald-200",
  },
};

const TaskItem = memo(function TaskItem({
  task,
  onToggle,
  onEdit,
  onDelete,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  dragListeners,
  onHeightChange,
}) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDeadline, setEditDeadline] = useState(task.deadline || "");
  const [editDeadlineTime, setEditDeadlineTime] = useState(task.deadlineTime || "");
  const [editPriority, setEditPriority] = useState(task.priority || "medium");
  const [editCategory, setEditCategory] = useState(task.category || "");
  const [editRecurring, setEditRecurring] = useState(task.recurringType || "none");
  const [editRecurringDays, setEditRecurringDays] = useState(
    task.recurringDays ? JSON.parse(task.recurringDays) : []
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
    setEditRecurring(task.recurringType || "none");
    setEditRecurringDays(task.recurringDays ? JSON.parse(task.recurringDays) : []);
    setEditNote(task.note || "");
  }, [task]);

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
            ? { type: "daily", days: [] }
            : { type: "weekly", days: editRecurringDays };

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
    setEditing(false);
  };

  const handleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    setEditing(false);
    onHeightChange?.(task.id, next);
  };

  const pCfg = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium;
  const isDone = task.status === "done";

  return (
    <div
      className={`group bg-white dark:bg-zinc-800 border rounded-xl px-4 py-3 mb-2 transition-all duration-150 ${
        isDone
          ? "border-zinc-100 dark:border-zinc-700 opacity-60"
          : isOverdue
            ? "border-red-200 bg-red-50/30 dark:bg-red-950/20"
            : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Drag handle */}
        <span
          {...dragListeners}
          className="mt-0.5 text-zinc-300 hover:text-zinc-400 cursor-grab active:cursor-grabbing select-none text-base flex-shrink-0"
        >
          ⠿
        </span>

        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isDone}
          onChange={() => onToggle(task)}
          className="mt-1 w-4 h-4 accent-blue-600 cursor-pointer flex-shrink-0"
        />

        {/* Content */}
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
          />
        ) : (
          <div className="flex-1 min-w-0">
            <span
              className={`block text-sm font-medium leading-snug ${isDone ? "line-through text-zinc-400" : "text-zinc-800 dark:text-zinc-100"}`}
            >
              {task.title}
            </span>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {/* Priority dot + label */}
              <span
                className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${pCfg.badge}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${pCfg.dot}`} />
                {pCfg.label}
              </span>

              {task.category && (
                <span className="text-xs px-2 py-0.5 bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 rounded-full border border-zinc-200 dark:border-zinc-600">
                  {" "}
                  {task.category}
                </span>
              )}

              {task.deadline && (
                <span
                  className={`text-xs ${isOverdue ? "text-red-500 font-medium" : "text-zinc-400"}`}
                >
                  {isOverdue ? "⚠ " : "📅 "}
                  {new Date(task.deadline).toLocaleDateString("th-TH")}
                  {task.deadlineTime && ` ${task.deadlineTime} น.`}
                </span>
              )}

              {task.recurringType && (
                <span className="text-xs text-zinc-400">
                  🔁 {task.recurringType === "daily" ? "ทุกวัน" : "ทุกสัปดาห์"}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        {!editing && (
          <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleExpand}
              title="subtask / note"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-600 dark:hover:text-zinc-300 transition text-xs"
            >
              {expanded ? "▲" : "▼"}
            </button>
            <button
              onClick={() => {
                setEditing(true);
                setExpanded(false);
              }}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-600 dark:hover:text-zinc-300 transition text-xs"
            >
              ✏
            </button>
            {confirmDelete ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onDelete(task.id)}
                  className="px-2 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  ลบ
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-2 py-1 text-xs bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-600 transition"
                >
                  ยกเลิก
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-600 dark:hover:text-zinc-300 transition text-xs"
              >
                🗑
              </button>
            )}
          </div>
        )}
      </div>

      {/* Expanded: note + subtasks */}
      {expanded && (
        <div className="mt-3 pl-10 border-t border-zinc-100 dark:border-zinc-700 pt-3">
          <textarea
            placeholder="เพิ่ม note..."
            value={editNote}
            onChange={(e) => setEditNote(e.target.value)}
            onBlur={() => {
              if (editNote !== task.note) onEdit(task.id, { note: editNote });
            }}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition mb-2 text-zinc-600 dark:text-zinc-300 placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
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
