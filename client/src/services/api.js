import axios from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry && !original.url?.includes("/auth/")) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/auth/refresh`, {
          refreshToken,
        });
        localStorage.setItem("accessToken", data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/";
      }
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────
export const register = (data) => api.post("/auth/register", data);
export const login = async (data) => {
  const res = await api.post("/auth/login", data);
  localStorage.setItem("accessToken", res.data.accessToken);
  localStorage.setItem("refreshToken", res.data.refreshToken);
  return res;
};
export const logout = async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  await api.post("/auth/logout", { refreshToken }).catch(() => {});
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
};

// ── Tasks ─────────────────────────────────────────────
export const getTasks = (params) => api.get("/tasks", { params });
export const createTask = (data) => api.post("/tasks", data);
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data);
export const deleteTask = (id) => api.delete(`/tasks/${id}`);
// รับ [{ id, order }] — ส่ง batch update ลำดับทีเดียว
export const reorderTasks = (tasks) => api.patch("/tasks/reorder", { tasks });

export const addSubtask = (taskId, data) => api.post(`/tasks/${taskId}/subtasks`, data);
export const toggleSubtask = (taskId, subId) => api.patch(`/tasks/${taskId}/subtasks/${subId}`);
export const deleteSubtask = (taskId, subId) => api.delete(`/tasks/${taskId}/subtasks/${subId}`);

export const getTaskSummary = () => api.get("/tasks/summary");
export const getTaskCategories = () => api.get("/tasks/categories");
