import { useState, useEffect } from "react";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
} from "./services/api";
import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";
import FilterBar from "./components/FilterBar";
import "./index.css";
import Toast from "./components/Toast";
import TaskSkeleton from "./components/TaskSkeleton";
import SummaryBar from "./components/SummaryBar";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");   
  const [reload, setReload] = useState(0);
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "error") => setToast({ message, type });
  const [priority, setPriority] = useState("all");
  const [category, setCategory] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getTasks({
          status: filter,
          search,
          sort,
          priority,
          category,
        });
        setTasks(res.data);
      } catch {
        setError("โหลดข้อมูลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filter, search, sort, priority, category, reload]);

  const summary = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    done: tasks.filter((t) => t.status === "done").length,
    overdue: tasks.filter((t) => {
      if (!t.deadline || t.status === "done") return false;
      const dt = new Date(`${t.deadline}T${t.deadlineTime || "23:59:59"}`);
      return dt < new Date();
    }).length,
  };

  const refresh = () => setReload((n) => n + 1);

  const handleCreate = async (data) => {
    try {
      await createTask(data);
      refresh();
      showToast("เพิ่ม task สำเร็จ", "success");
    } catch (err) {                                           
      showToast(err.response?.data?.error || "เพิ่ม task ไม่สำเร็จ");
    }
  };

  const handleToggle = async (task) => {
    try {
      await updateTask(task.id, {
        status: task.status === "done" ? "pending" : "done",
      });
      refresh();
      const msg =
        task.recurring && task.status === "pending"
          ? "บันทึกแล้ว — task จะ reset วันถัดไป"
          : "อัปเดต task สำเร็จ";
      showToast(msg, "success");
    } catch {                                                 
      showToast("อัปเดต task ไม่สำเร็จ");
    }
  };

  const handleEdit = async (id, data) => {
    try {
      await updateTask(id, data);
      refresh();
      showToast("แก้ไข task สำเร็จ", "success");
    } catch (err) {                                           
      showToast(err.response?.data?.error || "แก้ไข task ไม่สำเร็จ");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTask(id);
      refresh();
      showToast("ลบ task สำเร็จ", "success");
    } catch {                                                 
      showToast("ลบ task ไม่สำเร็จ");
    }
  };

  const handleAddSubtask = async (taskId, data) => {
    try {
      await addSubtask(taskId, data);
      refresh();
    } catch {                                                 
      showToast("เพิ่ม subtask ไม่สำเร็จ");
    }
  };

  const handleToggleSubtask = async (taskId, subId) => {
    try {
      await toggleSubtask(taskId, subId);
      refresh();
    } catch {                                                 
      showToast("อัปเดต subtask ไม่สำเร็จ");
    }
  };

  const handleDeleteSubtask = async (taskId, subId) => {
    try {
      await deleteSubtask(taskId, subId);
      refresh();
    } catch {                                                 
      showToast("ลบ subtask ไม่สำเร็จ");
    }
  };

  const handleReorder = (reordered) => {
    setTasks(reordered);
  };

  const categories = [...new Set(tasks.map((t) => t.category).filter(Boolean))];

  return (
    <div className="app">
      <h1>Task Manager</h1>

      {/* ✅ error state is now rendered — fixes line 25 */}
      {error && <p className="error-message">{error}</p>}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <SummaryBar summary={summary} />

      <TaskForm onSubmit={handleCreate} />

      <FilterBar
        filter={filter}
        search={search}
        sort={sort}
        priority={priority}
        category={category}
        onFilterChange={setFilter}
        onSearchChange={setSearch}
        onSortChange={setSort}
        onPriorityChange={setPriority}
        onCategoryChange={setCategory}
        categories={categories}
      />

      {loading ? (
        <TaskSkeleton />
      ) : (
        <TaskList
          tasks={tasks}
          onToggle={handleToggle}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAddSubtask={handleAddSubtask}
          onToggleSubtask={handleToggleSubtask}
          onDeleteSubtask={handleDeleteSubtask}
          onReorder={handleReorder}
        />
      )}
    </div>
  );
}