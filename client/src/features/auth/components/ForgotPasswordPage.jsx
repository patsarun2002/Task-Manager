import { useState } from "react";
import { forgotPassword } from "../../../services/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage({ onBack }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleSubmit = async () => {
    if (!email) return toast.error("กรุณากรอกอีเมล");
    setLoading(true);
    try {
      await forgotPassword({ email });
      toast.success("ส่ง link ไปที่ email แล้ว กรุณาตรวจสอบกล่องจดหมาย");
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      toast.error(err.response?.data?.error || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-6 w-full max-w-sm">
      <h1 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-zinc-100">ลืมรหัสผ่าน</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
        กรอกอีเมลของคุณ เราจะส่งลิงก์สำหรับรีเซ็ตรหัสผ่านให้
      </p>

      <div className="flex flex-col gap-4">
        <div>
          <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1.5 block">Email</label>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            disabled={loading || countdown > 0}
          />
        </div>
        <Button onClick={handleSubmit} disabled={loading || countdown > 0} className="w-full">
          {loading
            ? "กำลังส่ง..."
            : countdown > 0
              ? `ส่งอีกครั้ง (${countdown}s)`
              : "ส่งลิงก์รีเซ็ต"}
        </Button>
        <Button variant="ghost" onClick={onBack} className="w-full">
          กลับหน้าเข้าสู่ระบบ
        </Button>
      </div>
    </div>
  );
}
