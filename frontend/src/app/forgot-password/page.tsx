"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import AuthShell from "@/components/layout/AuthShell";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import authService from "@/services/auth.service";
import { errorMessage } from "@/lib/utils";

const schema = z.object({ email: z.string().min(1, "กรุณากรอกอีเมล").email("รูปแบบอีเมลไม่ถูกต้อง") });
type Form = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (d: Form) => {
    try {
      await authService.forgotPassword(d.email);
      setSent(true);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <AuthShell title="ลืมรหัสผ่าน" subtitle="กรอกอีเมลของคุณ เราจะส่งลิงก์รีเซ็ตรหัสผ่านให้">
      {sent ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <CheckCircle2 className="h-12 w-12 text-success" />
          <p className="text-sm text-text-secondary">หากอีเมลนี้มีอยู่ในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านให้แล้ว</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input id="email" label="อีเมล" type="email" icon={<Mail className="h-4 w-4" />} error={errors.email?.message} {...register("email")} />
          <Button type="submit" loading={isSubmitting} className="w-full">ส่งลิงก์รีเซ็ต</Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm"><Link href="/login" className="font-medium text-primary hover:underline">← กลับไปหน้าเข้าสู่ระบบ</Link></p>
    </AuthShell>
  );
}
