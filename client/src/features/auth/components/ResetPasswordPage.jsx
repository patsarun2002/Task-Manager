import { useState } from "react";
import { resetPassword } from "../../../services/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage({ token, onBack, onSuccess }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(!token ? "ไม่พบ token กรุณาขอรีเซ็ตรหัสผ่านใหม่" : "");

  const handleSubmit = async () => {
    if (!token) {
      return onBack();
    }

    if (!newPassword || newPassword.length < 8) {
      return toast.error("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
    }

    if (newPassword !== confirmPassword) {
      return toast.error("รหัสผ่านไม่ตรงกัน");
    }

    setLoading(true);
    setError("");
    try {
      await resetPassword({ token, newPassword });
      toast.success("รีเซ็ตรหัสผ่านสำเร็จ");
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || "เกิดข้อผิดพลาด");
      toast.error(err.response?.data?.error || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-6 w-full max-w-sm">
      <h1 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-zinc-100">
        รีเซ็ตรหัสผ่าน
      </h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">กรอกรหัสผ่านใหม่ของคุณ</p>

      {error && (
        <div className="text-sm px-3 py-2 rounded-lg mb-6 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div>
          <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1.5 block">
            รหัสผ่านใหม่
          </label>
          <Input
            type="password"
            placeholder="รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            disabled={loading || !token}
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1.5 block">
            ยืนยันรหัสผ่านใหม่
          </label>
          <Input
            type="password"
            placeholder="ยืนยันรหัสผ่านใหม่"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            disabled={loading || !token}
          />
        </div>
        <Button onClick={handleSubmit} disabled={loading || !token} className="w-full">
          {loading ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
        </Button>
        <Button variant="ghost" onClick={onBack} className="w-full">
          ขอรีเซ็ตรหัสผ่านใหม่
        </Button>
      </div>
    </div>
  );
}
