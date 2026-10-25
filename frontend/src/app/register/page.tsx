"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, User } from "lucide-react";
import toast from "react-hot-toast";
import AuthShell from "@/components/layout/AuthShell";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAuthStore } from "@/stores/authStore";
import { errorMessage } from "@/lib/utils";

const schema = z
  .object({
    name: z.string().min(2, "กรุณากรอกชื่อ-นามสกุล"),
    email: z.string().min(1, "กรุณากรอกอีเมล").email("รูปแบบอีเมลไม่ถูกต้อง"),
    password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
    confirmPassword: z.string(),
    role: z.enum(["STUDENT", "TEACHER"]),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "รหัสผ่านไม่ตรงกัน" });
type Form = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const registerUser = useAuthStore((s) => s.register);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { role: "STUDENT" },
  });

  const onSubmit = async (d: Form) => {
    try {
      await registerUser({ name: d.name, email: d.email, password: d.password, role: d.role });
      toast.success("ลงทะเบียนสำเร็จ");
      router.push("/dashboard");
    } catch (e) {
      toast.error(errorMessage(e, "ลงทะเบียนไม่สำเร็จ"));
    }
  };

  return (
    <AuthShell title="สร้างบัญชีใหม่" subtitle="เริ่มสร้างชีทสรุปพร้อมสอบได้ฟรี">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input id="name" label="ชื่อ-นามสกุล" icon={<User className="h-4 w-4" />} error={errors.name?.message} {...register("name")} />
        <Input id="email" label="อีเมล" type="email" icon={<Mail className="h-4 w-4" />} error={errors.email?.message} {...register("email")} />
        <Input id="password" label="รหัสผ่าน" type="password" icon={<Lock className="h-4 w-4" />} error={errors.password?.message} {...register("password")} />
        <Input id="confirmPassword" label="ยืนยันรหัสผ่าน" type="password" icon={<Lock className="h-4 w-4" />} error={errors.confirmPassword?.message} {...register("confirmPassword")} />
        <div>
          <p className="mb-1.5 text-sm font-medium">ฉันเป็น</p>
          <div className="grid grid-cols-2 gap-3">
            {([["STUDENT", "นักศึกษา"], ["TEACHER", "อาจารย์"]] as const).map(([v, l]) => (
              <label key={v} className="flex cursor-pointer items-center justify-center rounded-xl border border-border-custom py-2.5 text-sm has-checked:border-primary has-checked:bg-primary-light has-checked:text-primary">
                <input type="radio" value={v} className="sr-only" {...register("role")} />
                {l}
              </label>
            ))}
          </div>
        </div>
        <Button type="submit" loading={isSubmitting} className="w-full">ลงทะเบียน</Button>
      </form>
      <p className="mt-6 text-center text-sm text-text-secondary">
        มีบัญชีแล้ว? <Link href="/login" className="font-medium text-primary hover:underline">เข้าสู่ระบบ</Link>
      </p>
    </AuthShell>
  );
}
