import axios from "axios";
import { useAuthStore } from "../store/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // ส่ง HttpOnly cookie ไปด้วยทุก request
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    // BUG #3 FIX: original.url อาจเป็น undefined ใน axios บางเวอร์ชัน
    // และต้องเช็ค baseURL ด้วยเพื่อป้องกัน infinite loop กรณี /auth/refresh ตอบ 401
    const isAuthRoute = original.url?.includes("/auth/") || original.baseURL?.includes("/auth/");

    if (err.response?.status === 401 && !original._retry && !isAuthRoute) {
      original._retry = true;
      try {
        // cookie ส่งอัตโนมัติ ไม่ต้องส่ง refreshToken ใน body
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        localStorage.setItem("accessToken", data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        // Update authStore with user data from refresh
        if (data.user) {
          const { updateProfile } = useAuthStore.getState();
          updateProfile(data.user.name, data.user.email);
        }
        return api(original);
      } catch {
        localStorage.removeItem("accessToken");
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
  // รับแค่ accessToken — refreshToken อยู่ใน HttpOnly cookie แล้ว
  localStorage.setItem("accessToken", res.data.accessToken);
  return res;
};
export const logout = async () => {
  // server จะเคลียร์ cookie ให้
  await api.post("/auth/logout").catch(() => {});
  localStorage.removeItem("accessToken");
};
export const forgotPassword = (data) => api.post("/auth/forgot-password", data);
export const resetPassword = (data) => api.post("/auth/reset-password", data);
export const updateProfile = (data) => api.patch("/auth/profile", data);
export const changePassword = (data) => api.patch("/auth/password", data);

// ── Tasks ─────────────────────────────────────────────
export const getTasks = (params) => api.get("/tasks", { params });
export const createTask = (data) => api.post("/tasks", data);
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data);
export const deleteTask = (id) => api.delete(`/tasks/${id}`);
export const reorderTasks = (tasks) => api.patch("/tasks/reorder", { tasks });

export const addSubtask = (taskId, data) => api.post(`/tasks/${taskId}/subtasks`, data);
export const toggleSubtask = (taskId, subId) => api.patch(`/tasks/${taskId}/subtasks/${subId}`);
export const deleteSubtask = (taskId, subId) => api.delete(`/tasks/${taskId}/subtasks/${subId}`);

export const getTaskSummary = () => api.get("/tasks/summary");
export const getTaskCategories = () => api.get("/tasks/categories");
