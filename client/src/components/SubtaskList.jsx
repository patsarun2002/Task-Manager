import { useState } from "react";

export default function SubtaskList({ task, onAdd, onToggle, onDelete }) {
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!input.trim() || saving) return;
    setSaving(true);
    await onAdd(task.id, { title: input });
    setInput("");
    setSaving(false);
  };

  const done = task.subtasks.filter((s) => s.done).length;
  const total = task.subtasks.length;
  const pct = total > 0 ? (done / total) * 100 : 0;

  return (
    <div className="mt-3 flex flex-col gap-2">
      {/* Progress */}
      {total > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-zinc-400 tabular-nums">{done}/{total}</span>
        </div>
      )}

      {/* List */}
      <ul className="flex flex-col gap-1">
        {task.subtasks.map((sub) => (
          <li
            key={sub.id}
            className="flex items-center gap-2 group"
          >
            <input
              type="checkbox"
              checked={sub.done}
              onChange={() => onToggle(task.id, sub.id)}
              className="w-3.5 h-3.5 accent-emerald-500 cursor-pointer flex-shrink-0"
            />
            <span className={`flex-1 text-sm ${sub.done ? "line-through text-zinc-400" : "text-zinc-600 dark:text-zinc-300"}`}>
              {sub.title}
            </span>
            <button
              onClick={() => onDelete(task.id, sub.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-300 hover:text-red-400 text-xs px-1"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      {/* Add input */}
      <div className="flex gap-2 mt-1">
        <input
          type="text"
          placeholder="เพิ่ม subtask..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          maxLength={100}
          className="flex-1 px-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
        />
        <button
          onClick={handleAdd}
          disabled={saving}
          className="px-3 py-1.5 text-xs bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-600 dark:text-zinc-300 rounded-lg transition disabled:opacity-50"
        >
          + เพิ่ม
        </button>
      </div>
    </div>
  );
}
