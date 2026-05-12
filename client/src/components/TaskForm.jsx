import { useState } from "react";

export default function TaskForm({ onSubmit }) {
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [err, setErr] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!title.trim()) {
      setErr("กรุณากรอกชื่อ task");
      return;
    }

    await onSubmit({ title, deadline });
    setTitle("");
    setDeadline("");
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <input
          type="text"
          placeholder="ชื่อ task..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
        />
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />
        <button type="submit">+ เพิ่ม</button>
      </div>
      {err && <p className="form-error">{err}</p>}
    </form>
  );
}
