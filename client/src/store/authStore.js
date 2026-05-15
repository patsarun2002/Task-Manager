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
  email: localStorage.getItem("userEmail") || "",
  isDark: savedDark,

  login: (email) => {
    localStorage.setItem("userEmail", email);
    set({ isLoggedIn: true, email });
  },
  logout: () => {
    localStorage.removeItem("userEmail");
    set({ isLoggedIn: false, email: "" });
  },

  toggleTheme: () =>
    set((state) => {
      const next = !state.isDark;
      applyTheme(next);
      localStorage.setItem("theme", next ? "dark" : "light");
      return { isDark: next };
    }),
}));
