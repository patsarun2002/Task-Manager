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
    isDark: savedDark,

    login: (email) => {
      if (isBrowser) localStorage.setItem("userEmail", email);
      set({ isLoggedIn: true, email });
    },
    logout: () => {
      if (isBrowser) localStorage.removeItem("userEmail");
      set({ isLoggedIn: false, email: "" });
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
