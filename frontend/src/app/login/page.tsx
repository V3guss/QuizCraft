"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock } from "lucide-react";
import toast from "react-hot-toast";
import AuthShell from "@/components/layout/AuthShell";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAuthStore } from "@/stores/authStore";
import { errorMessage } from "@/lib/utils";

const schema = z.object({
  email: z.string().min(1, "กรุณากรอกอีเมล").email("รูปแบบอีเมลไม่ถูกต้อง"),
  password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
});
type Form = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (d: Form) => {
    try {
      await login(d.email, d.password);
      toast.success("เข้าสู่ระบบสำเร็จ");
      router.push("/dashboard");
    } catch (e) {
      toast.error(errorMessage(e, "อีเมลหรือรหัสผ่านไม่ถูกต้อง"));
    }
  };

  return (
    <AuthShell title="เข้าสู่ระบบ" subtitle="ยินดีต้อนรับกลับ เข้าสู่ระบบเพื่อดูชีทสรุปของคุณ">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input id="email" label="อีเมล" type="email" placeholder="you@example.com" icon={<Mail className="h-4 w-4" />} error={errors.email?.message} {...register("email")} />
        <Input id="password" label="รหัสผ่าน" type="password" placeholder="••••••••" icon={<Lock className="h-4 w-4" />} error={errors.password?.message} {...register("password")} />
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-text-secondary"><input type="checkbox" className="accent-primary" /> จดจำการเข้าสู่ระบบ</label>
          <Link href="/forgot-password" className="text-primary hover:underline">ลืมรหัสผ่าน?</Link>
        </div>
        <Button type="submit" loading={isSubmitting} className="w-full">เข้าสู่ระบบ</Button>
      </form>
      <p className="mt-6 text-center text-sm text-text-secondary">
        ยังไม่มีบัญชี? <Link href="/register" className="font-medium text-primary hover:underline">ลงทะเบียน</Link>
      </p>
    </AuthShell>
  );
}
