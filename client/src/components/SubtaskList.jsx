import { useState } from "react";

export default function SubtaskList({ task, onAdd, onToggle, onDelete }) {
  const [input, setInput] = useState("");

  const handleAdd = async () => {
    if (!input.trim()) return;
    await onAdd(task.id, { title: input });
    setInput("");
  };

  const done = task.subtasks.filter((s) => s.done).length;
  const total = task.subtasks.length;

  return (
    <div className="subtask-section">
      {total > 0 && (
        <div className="subtask-progress">
          <div className="subtask-progress-bar">
            <div
              className="subtask-progress-fill"
              style={{ width: `${(done / total) * 100}%` }}
            />
          </div>
          <span className="subtask-count">
            {done}/{total}
          </span>
        </div>
      )}

      <ul className="subtask-list">
        {task.subtasks.map((sub) => (
          <li key={sub.id} className={`subtask-item ${sub.done ? "done" : ""}`}>
            <input
              type="checkbox"
              checked={sub.done}
              onChange={() => onToggle(task.id, sub.id)}
            />
            <span>{sub.title}</span>
            <button
              className="subtask-delete"
              onClick={() => onDelete(task.id, sub.id)}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <div className="subtask-input-row">
        <input
          type="text"
          placeholder="เพิ่ม subtask..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          maxLength={100}
        />
        <button onClick={handleAdd}>+ เพิ่ม</button>
      </div>
    </div>
  );
}
