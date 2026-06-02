import { create } from "zustand";

const isBrowser = typeof window !== "undefined";

function applyTheme(dark) {
  if (!isBrowser) return;
  if (dark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

function readStorage(key, fallback = "") {
  if (!isBrowser) return fallback;
  return localStorage.getItem(key) ?? fallback;
}

// lazy init — อ่าน localStorage ใน initializer ไม่ใช่ top-level
// ป้องกัน crash ใน SSR และ unit test ที่ไม่มี window
export const useAuthStore = create((set) => {
  const savedDark = readStorage("theme") === "dark";
  applyTheme(savedDark);

  return {
    isLoggedIn: !!readStorage("accessToken"),
    email: readStorage("userEmail"),
    name: readStorage("userName"),
    isDark: savedDark,

    login: (email, name) => {
      if (isBrowser) {
        localStorage.setItem("userEmail", email);
        if (name) localStorage.setItem("userName", name);
      }
      set({ isLoggedIn: true, email, name: name || "" });
    },
    logout: () => {
      if (isBrowser) {
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userName");
      }
      set({ isLoggedIn: false, email: "", name: "" });
    },
    updateProfile: (name, email) => {
      if (isBrowser) {
        if (email) localStorage.setItem("userEmail", email);
        if (name) localStorage.setItem("userName", name);
      }
      set({ name, email });
    },

    toggleTheme: () =>
      set((state) => {
        const next = !state.isDark;
        applyTheme(next);
        if (isBrowser) localStorage.setItem("theme", next ? "dark" : "light");
        return { isDark: next };
      }),
  };
});
