import { useState, useEffect } from "react";
import { getTasks, createTask, updateTask, deleteTask } from "./services/api";
import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";
import FilterBar from "./components/FilterBar";
import "./index.css";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  // โหลด tasks ทุกครั้งที่ filter/search/sort เปลี่ยน
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getTasks({ status: filter, search, sort });
        setTasks(res.data);
      } catch {
        setError("โหลดข้อมูลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filter, search, sort, reload]);

  const refresh = () => setReload((n) => n + 1);

  const handleCreate = async (data) => {
    try {
      await createTask(data);
      refresh();
    } catch (err) {
      setError(err.response?.data?.error || "เพิ่ม task ไม่สำเร็จ");
    }
  };

  const handleToggle = async (task) => {
    try {
      await updateTask(task.id, {
        status: task.status === "done" ? "pending" : "done",
      });
      refresh();
    } catch (err) {
      setError("อัปเดต task ไม่สำเร็จ");
    }
  };

  const handleEdit = async (id, data) => {
    try {
      await updateTask(id, data);
      refresh();
    } catch (err) {
      setError(err.response?.data?.error || "แก้ไข task ไม่สำเร็จ");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTask(id);
      refresh();
    } catch (err) {
      setError("ลบ task ไม่สำเร็จ");
    }
  };

  return (
    <div className="app">
      <h1>Task Manager</h1>

      <TaskForm onSubmit={handleCreate} />

      {error && <p className="error">{error}</p>}

      <FilterBar
        filter={filter}
        search={search}
        sort={sort}
        onFilterChange={setFilter}
        onSearchChange={setSearch}
        onSortChange={setSort}
      />

      {loading ? (
        <p className="loading">กำลังโหลด...</p>
      ) : (
        <TaskList
          tasks={tasks}
          onToggle={handleToggle}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
