import { useState } from "react";
import { login, register } from "../services/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage({ onLogin, modal = false }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) return setError("กรุณากรอกข้อมูลให้ครบ");
    setLoading(true);
    setError("");
    try {
      if (mode === "login") {
        await login({ email, password });
        onLogin();
      } else {
        await register({ email, password });
        setMode("login");
        setError("สมัครสมาชิกสำเร็จ — กรุณาเข้าสู่ระบบ");
      }
    } catch (err) {
      setError(err.response?.data?.error || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  const card = (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-6">
      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-700 rounded-xl p-1 mb-5">
        {[
          { value: "login", label: "เข้าสู่ระบบ" },
          { value: "register", label: "สมัครสมาชิก" },
        ].map((t) => (
          <button
            key={t.value}
            onClick={() => {
              setMode(t.value);
              setError("");
            }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
              mode === t.value
                ? "bg-white dark:bg-zinc-600 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div
          className={`text-sm px-3 py-2 rounded-lg mb-4 ${
            error.includes("สำเร็จ")
              ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900"
              : "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900"
          }`}
        >
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? "กำลังโหลด..." : mode === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
        </Button>
      </div>
    </div>
  );

  if (modal) return <>{card}</>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-200">
            <span className="text-white text-xl">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Task Manager
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">จัดการงานของคุณได้ทุกที่</p>
        </div>
        {card}
      </div>
    </div>
  );
}
