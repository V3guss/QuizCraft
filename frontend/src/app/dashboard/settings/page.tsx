"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import authService from "@/services/auth.service";
import { useAuthStore } from "@/stores/authStore";
import { errorMessage } from "@/lib/utils";

const schema = z
  .object({
    currentPassword: z.string().min(1, "กรุณากรอกรหัสผ่านปัจจุบัน"),
    newPassword: z.string().min(6, "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร"),
    confirm: z.string(),
  })
  .refine((d) => d.newPassword === d.confirm, { path: ["confirm"], message: "รหัสผ่านไม่ตรงกัน" });
type Form = z.infer<typeof schema>;

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (d: Form) => {
    try {
      await authService.changePassword({ currentPassword: d.currentPassword, newPassword: d.newPassword });
      toast.success("เปลี่ยนรหัสผ่านแล้ว");
      reset();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-heading">ตั้งค่า</h1>
      <Card className="space-y-4 p-6">
        <h2 className="font-semibold text-heading">โปรไฟล์</h2>
        <Input label="ชื่อ" value={user?.name || ""} readOnly />
        <Input label="อีเมล" value={user?.email || ""} readOnly />
        <Input label="บทบาท" value={user?.role || ""} readOnly />
      </Card>
      <Card className="p-6">
        <h2 className="mb-4 font-semibold text-heading">เปลี่ยนรหัสผ่าน</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="รหัสผ่านปัจจุบัน" type="password" error={errors.currentPassword?.message} {...register("currentPassword")} />
          <Input label="รหัสผ่านใหม่" type="password" error={errors.newPassword?.message} {...register("newPassword")} />
          <Input label="ยืนยันรหัสผ่านใหม่" type="password" error={errors.confirm?.message} {...register("confirm")} />
          <Button type="submit" loading={isSubmitting}>บันทึกรหัสผ่านใหม่</Button>
        </form>
      </Card>
    </div>
  );
}
