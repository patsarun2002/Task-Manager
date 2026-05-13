import { create } from "zustand";

function applyTheme(dark) {
  if (dark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

const savedDark = localStorage.getItem("theme") === "dark";
applyTheme(savedDark);

export const useAuthStore = create((set) => ({
  isLoggedIn: !!localStorage.getItem("accessToken"),
  isDark: savedDark,

  login: () => set({ isLoggedIn: true }),
  logout: () => set({ isLoggedIn: false }),

  toggleTheme: () =>
    set((state) => {
      const next = !state.isDark;
      applyTheme(next);
      localStorage.setItem("theme", next ? "dark" : "light");
      return { isDark: next };
    }),
}));
