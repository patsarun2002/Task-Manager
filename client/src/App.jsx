import { useState } from "react";
import { Toaster, toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuthStore } from "./store/authStore";
import { useTasks, useDebounce } from "./hooks/useTasks";
import { logout, getTaskSummary, getTaskCategories } from "./services/api";
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
  const { isDark, toggleTheme, isLoggedIn, email } = useAuthStore();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("");
  const [priority, setPriority] = useState("all");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

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

  const { data: summary = { total: 0, pending: 0, done: 0, overdue: 0 } } = useQuery({
    queryKey: ["summary"],
    queryFn: () => getTaskSummary().then((r) => r.data),
    enabled: isLoggedIn,
  });

  const handleLogout = async () => {
    await logout();
    queryClient.clear();
    onLogout();
  };

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

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getTaskCategories().then((r) => r.data),
    enabled: isLoggedIn,
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <Toaster position="bottom-right" richColors closeButton />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur border-b border-zinc-200 dark:border-zinc-700">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              width="24"
              height="24"
              viewBox="0 0 26 26"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="26" height="26" rx="13" fill="#7c3aed" />
              <rect x="8" y="9" width="3" height="3" rx="1" fill="white" />
              <rect x="8" y="14" width="3" height="3" rx="1" fill="white" opacity="0.5" />
              <rect x="13" y="9.6" width="6" height="1.8" rx="0.9" fill="white" />
              <rect x="13" y="14.6" width="4" height="1.8" rx="0.9" fill="white" opacity="0.5" />
            </svg>
            <span className="font-semibold tracking-tight bg-gradient-to-r from-violet-600 to-blue-500 bg-clip-text text-transparent">
              Task Manager
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              title={isDark ? "Light mode" : "Dark mode"}
              className="text-zinc-500 dark:text-zinc-400"
            >
              {isDark ? "☀️" : "🌙"}
            </Button>
            {isLoggedIn ? (
              <div className="relative" onMouseLeave={() => setShowMenu(false)}>
                <button
                  onMouseEnter={() => setShowMenu(true)}
                  onClick={() => setShowMenu((v) => !v)}
                  className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">
                      {email?.[0]?.toUpperCase() ?? "?"}
                    </span>
                  </div>
                  <span className="font-medium">{email.split("@")[0]}</span>
                  <span className="text-zinc-400 text-xs">▾</span>
                </button>

                {showMenu && (
                  <>
                    {/* backdrop กดนอก dropdown ให้ปิด */}
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-10 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg py-1 w-fit z-50">
                      <button
                        onClick={() => {
                          handleLogout();
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors whitespace-nowrap"
                      >
                        ออกจากระบบ
                      </button>
                    </div>
                  </>
                )}
              </div>
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
                (t) => updateTask(t.id, { status: t.status === "done" ? "pending" : "done" }),
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
              onLogin={(email) => {
                onLogin(email);
                setShowLoginModal(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
