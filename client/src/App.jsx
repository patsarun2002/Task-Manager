import { useState } from "react";
import { Toaster, toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "./store/authStore";
import { useTasks, useDebounce } from "./hooks/useTasks";
import { logout } from "./services/api";
import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";
import FilterBar from "./components/FilterBar";
import TaskSkeleton from "./components/TaskSkeleton";
import SummaryBar from "./components/SummaryBar";
import LoginPage from "./components/LoginPage";
import Pagination from "./components/Pagination";
import { Button } from "@/components/ui/button";
import "./index.css";

const LIMIT = 20;

export default function App() {
  const { login, logout: storeLogout } = useAuthStore();
  return <TaskApp onLogout={storeLogout} onLogin={login} />;
}

function TaskApp({ onLogout, onLogin }) {
  const { isDark, toggleTheme, isLoggedIn } = useAuthStore();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("");
  const [priority, setPriority] = useState("all");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  // reset page เมื่อ filter เปลี่ยน
  const handleFilterChange = (v) => {
    setFilter(v);
    setPage(1);
  };
  const handleSearchChange = (v) => {
    setSearch(v);
    setPage(1);
  };
  const handleSortChange = (v) => {
    setSort(v);
    setPage(1);
  };
  const handlePriorityChange = (v) => {
    setPriority(v);
    setPage(1);
  };
  const handleCategoryChange = (v) => {
    setCategory(v);
    setPage(1);
  };

  const {
    tasks,
    totalPages,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
    reorderTasks,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
  } = useTasks({
    status: filter,
    search: debouncedSearch,
    sort,
    priority,
    category,
    page,
    limit: LIMIT,
    enabled: isLoggedIn,
  });

  const summary = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    done: tasks.filter((t) => t.status === "done").length,
    overdue: tasks.filter((t) => {
      if (!t.deadline || t.status === "done") return false;
      return new Date(`${t.deadline}T${t.deadlineTime || "23:59:59"}`) < new Date();
    }).length,
  };

  const handleLogout = async () => {
    await logout();
    queryClient.clear();
    onLogout();
  };

  // wrap async fn พร้อม toast
  const wrap =
    (fn, successMsg) =>
    async (...args) => {
      try {
        await fn(...args);
        if (successMsg) toast.success(successMsg);
      } catch (err) {
        toast.error(err.response?.data?.error || "เกิดข้อผิดพลาด");
      }
    };

  const categories = [...new Set(tasks.map((t) => t.category).filter(Boolean))];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Sonner toast container */}
      <Toaster position="bottom-right" richColors closeButton />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur border-b border-zinc-200 dark:border-zinc-700">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm shadow-blue-200">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
            <span className="font-semibold text-zinc-800 dark:text-zinc-100 tracking-tight">
              Task Manager
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title={isDark ? "Light mode" : "Dark mode"}
              className="text-zinc-500 dark:text-zinc-400"
            >
              {isDark ? "☀️" : "🌙"}
            </Button>
            {isLoggedIn ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-zinc-500 dark:text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
              >
                ออกจากระบบ
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLoginModal(true)}
                className="text-zinc-500 dark:text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950"
              >
                เข้าสู่ระบบ
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-3xl mx-auto px-4 py-6 pb-20">
        <SummaryBar summary={summary} />
        <TaskForm
          onSubmit={wrap(createTask, "เพิ่ม task สำเร็จ")}
          isLoggedIn={isLoggedIn}
          onLoginRequired={() => setShowLoginModal(true)}
        />
        <FilterBar
          filter={filter}
          search={search}
          sort={sort}
          priority={priority}
          category={category}
          onFilterChange={handleFilterChange}
          onSearchChange={handleSearchChange}
          onSortChange={handleSortChange}
          onPriorityChange={handlePriorityChange}
          onCategoryChange={handleCategoryChange}
          categories={categories}
        />

        {isLoading ? (
          <TaskSkeleton />
        ) : (
          <>
            <TaskList
              tasks={tasks}
              onToggle={wrap(
                (t) =>
                  updateTask(t.id, {
                    status: t.status === "done" ? "pending" : "done",
                  }),
                "อัปเดต task สำเร็จ"
              )}
              onEdit={wrap((id, data) => updateTask(id, data), "แก้ไข task สำเร็จ")}
              onDelete={wrap(deleteTask, "ลบ task สำเร็จ")}
              onAddSubtask={wrap((taskId, data) => addSubtask(taskId, data))}
              onToggleSubtask={wrap((taskId, subId) => toggleSubtask(taskId, subId))}
              onDeleteSubtask={wrap((taskId, subId) => deleteSubtask(taskId, subId))}
              onReorder={wrap(reorderTasks)}
            />
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </main>

      {/* Login Modal */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={(e) => e.target === e.currentTarget && setShowLoginModal(false)}
        >
          <div className="relative w-full max-w-sm">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute -top-9 right-0 w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-200 transition text-sm"
            >
              ✕
            </button>
            <LoginPage
              modal
              onLogin={() => {
                onLogin();
                setShowLoginModal(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
