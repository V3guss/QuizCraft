"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Trash2, Users, FolderOpen, FileText, Layers, HelpCircle, BookOpen } from "lucide-react";
import toast from "react-hot-toast";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Modal from "@/components/ui/Modal";
import adminService, { AdminStats, AdminUser } from "@/services/admin.service";
import { useAuthStore } from "@/stores/authStore";
import type { Role } from "@/lib/types";
import { errorMessage, formatDate } from "@/lib/utils";

const roleLabel: Record<Role, string> = { STUDENT: "นักศึกษา", TEACHER: "อาจารย์", ADMIN: "ผู้ดูแลระบบ" };

export default function AdminPage() {
  const router = useRouter();
  const me = useAuthStore((s) => s.user);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);

  useEffect(() => {
    if (me && me.role !== "ADMIN") router.replace("/dashboard");
  }, [me, router]);

  const load = useCallback(() => {
    Promise.all([adminService.getUsers(), adminService.getStats()])
      .then(([u, s]) => { setUsers(u); setStats(s); })
      .catch((e) => toast.error(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { if (me?.role === "ADMIN") load(); }, [me, load]);

  const changeRole = async (u: AdminUser, role: Role) => {
    try {
      await adminService.updateUser(u.id, { role });
      toast.success("อัปเดตบทบาทแล้ว");
      load();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const remove = async () => {
    if (!deleting) return;
    try {
      await adminService.deleteUser(deleting.id);
      toast.success("ลบผู้ใช้แล้ว");
      setDeleting(null);
      load();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  if (loading) return <LoadingSpinner />;

  const cards = [
    { l: "ผู้ใช้", v: stats?.users, I: Users },
    { l: "วิชา", v: stats?.subjects, I: BookOpen },
    { l: "เอกสาร", v: stats?.documents, I: FolderOpen },
    { l: "สรุป", v: stats?.summaries, I: FileText },
    { l: "Flashcards", v: stats?.flashcards, I: Layers },
    { l: "ทำแบบทดสอบ", v: stats?.quizAttempts, I: HelpCircle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-heading">จัดการระบบ</h1>
        <p className="text-sm text-text-secondary">บัญชีผู้ใช้และข้อมูลภาพรวมของระบบ</p>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        {cards.map(({ l, v, I }) => (
          <Card key={l} className="p-4">
            <I className="mb-2 h-5 w-5 text-primary" />
            <p className="text-xl font-bold text-heading">{v ?? 0}</p>
            <p className="text-xs text-text-secondary">{l}</p>
          </Card>
        ))}
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-primary-light text-left text-xs text-heading">
            <tr>{["ชื่อ", "อีเมล", "บทบาท", "เอกสาร / สรุป", "สมัครเมื่อ", ""].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border-custom">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-text-secondary">{u.email}</td>
                <td className="px-4 py-3">
                  {u.id === me?.id ? <Badge tone="navy">{roleLabel[u.role]}</Badge> : (
                    <select value={u.role} onChange={(e) => changeRole(u, e.target.value as Role)} className="rounded-lg border border-border-custom bg-surface px-2 py-1 text-xs">
                      {(Object.keys(roleLabel) as Role[]).map((r) => <option key={r} value={r}>{roleLabel[r]}</option>)}
                    </select>
                  )}
                </td>
                <td className="px-4 py-3 text-text-secondary">{u._count.documents} / {u._count.summaries}</td>
                <td className="px-4 py-3 text-text-secondary">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  {u.id !== me?.id && (
                    <button onClick={() => setDeleting(u)} className="cursor-pointer rounded-lg p-1.5 text-text-secondary hover:bg-red-500/10 hover:text-error" aria-label="ลบ"><Trash2 className="h-4 w-4" /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="ลบผู้ใช้">
        <p className="text-sm text-text-secondary">ต้องการลบ “{deleting?.name}” และข้อมูลทั้งหมดของผู้ใช้นี้ใช่หรือไม่?</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleting(null)}>ยกเลิก</Button>
          <Button variant="danger" onClick={remove}>ลบผู้ใช้</Button>
        </div>
      </Modal>
    </div>
  );
}
