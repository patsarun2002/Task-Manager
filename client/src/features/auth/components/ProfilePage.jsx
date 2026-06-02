import { useState } from "react";
import { useAuthStore } from "../../../store/authStore";
import { updateProfile, changePassword, logout } from "../../../services/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ProfilePage({ onBack }) {
  const {
    email,
    name: storedName,
    updateProfile: updateProfileStore,
    logout: storeLogout,
  } = useAuthStore();
  const [name, setName] = useState(storedName || "");
  const [profileEmail, setProfileEmail] = useState(email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleUpdateProfile = async () => {
    if (!name && !profileEmail) {
      return toast.error("กรุณาระบุข้อมูลที่ต้องการแก้ไข");
    }
    setLoading(true);
    try {
      const updateData = {};
      if (name) updateData.name = name;
      if (profileEmail) updateData.email = profileEmail;
      const res = await updateProfile(updateData);
      toast.success("อัปเดตข้อมูลสำเร็จ");
      if (res.data.user.name) {
        setName(res.data.user.name);
        updateProfileStore(res.data.user.name, res.data.user.email);
      }
      if (res.data.user.email) {
        setProfileEmail(res.data.user.email);
        updateProfileStore(res.data.user.name, res.data.user.email);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return toast.error("กรุณากรอกข้อมูลให้ครบ");
    }
    if (newPassword.length < 8) {
      return toast.error("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
    }
    if (newPassword !== confirmNewPassword) {
      return toast.error("รหัสผ่านไม่ตรงกัน");
    }
    setPasswordLoading(true);
    try {
      await changePassword({ currentPassword, newPassword });
      toast.success("เปลี่ยนรหัสผ่านสำเร็จ กรุณา login ใหม่");
      await logout();
      storeLogout();
      onBack();
    } catch (err) {
      toast.error(err.response?.data?.error || "เกิดข้อผิดพลาด");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-6 w-full max-w-md">
      <h1 className="text-xl font-semibold mb-6 text-zinc-900 dark:text-zinc-100">ข้อมูลส่วนตัว</h1>

      {/* Current Info */}
      <div className="mb-8 p-5 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
            <span className="text-white text-lg font-semibold">
              {storedName?.[0]?.toUpperCase() || email?.[0]?.toUpperCase() || "?"}
            </span>
          </div>
          <div>
            <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {storedName || "ไม่ระบุชื่อ"}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{email}</p>
          </div>
        </div>
      </div>

      {/* Update Profile Form */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold mb-4 text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
          อัปเดตข้อมูล
        </h2>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1.5 block">ชื่อ</label>
            <Input
              placeholder="ชื่อ (ถ้ามี)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1.5 block">Email</label>
            <Input
              type="email"
              placeholder="Email ใหม่"
              value={profileEmail}
              onChange={(e) => setProfileEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button onClick={handleUpdateProfile} disabled={loading} className="w-full mt-2">
            {loading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
          </Button>
        </div>
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-700 my-8" />

      {/* Change Password Form */}
      <div>
        <h2 className="text-sm font-semibold mb-4 text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <span className="w-1 h-4 bg-red-500 rounded-full"></span>
          เปลี่ยนรหัสผ่าน
        </h2>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1.5 block">
              รหัสผ่านปัจจุบัน
            </label>
            <Input
              type="password"
              placeholder="รหัสผ่านปัจจุบัน"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={passwordLoading}
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1.5 block">
              รหัสผ่านใหม่
            </label>
            <Input
              type="password"
              placeholder="รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={passwordLoading}
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1.5 block">
              ยืนยันรหัสผ่านใหม่
            </label>
            <Input
              type="password"
              placeholder="ยืนยันรหัสผ่านใหม่"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              disabled={passwordLoading}
            />
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={passwordLoading}
            variant="destructive"
            className="w-full mt-2"
          >
            {passwordLoading ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}
          </Button>
        </div>
      </div>
    </div>
  );
}
