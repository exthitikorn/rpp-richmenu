"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import NextLink from "next/link";
import { Link } from "@heroui/link";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };

      if (!res.ok || !data.success) {
        setError(data.error ?? "สมัครไม่สำเร็จ");
        setLoading(false);

        return;
      }
      router.push("/login");
      router.refresh();
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] w-full items-center justify-center px-4 py-6">
      <div className="w-full max-w-lg rounded-2xl border border-default-200 bg-white shadow-lg sm:max-w-xl md:max-w-xl">
        <div className="flex flex-col gap-1 px-4 pb-0 pt-6 sm:px-8 sm:pt-8 md:px-12 lg:px-16">
          <h1 className="text-xl font-semibold sm:text-2xl">สมัครสมาชิก</h1>
          <p className="text-sm text-default-500">LINE OA Rich Menu Manager</p>
        </div>
        <div
          className="px-4 pt-6 sm:px-8 md:px-12 lg:px-16"
          style={{
            paddingBottom:
              "max(1.5rem, calc(1rem + env(safe-area-inset-bottom, 0px)))",
          }}
        >
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {error && (
              <p className="text-danger text-sm" role="alert">
                {error}
              </p>
            )}
            <Input
              isRequired
              autoComplete="email"
              label="อีเมล"
              placeholder="you@example.com"
              type="email"
              value={email}
              onValueChange={setEmail}
            />
            <Input
              autoComplete="name"
              label="ชื่อ"
              placeholder="ชื่อของคุณ"
              value={name}
              onValueChange={setName}
            />
            <Input
              isRequired
              autoComplete="new-password"
              label="รหัสผ่าน"
              placeholder="••••••••"
              type="password"
              value={password}
              onValueChange={setPassword}
            />
            <Button
              className="min-h-[44px] w-full"
              color="primary"
              isLoading={loading}
              type="submit"
            >
              สมัครสมาชิก
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-default-500">
            มีบัญชีอยู่แล้ว?{" "}
            <Link as={NextLink} className="text-primary" href="/login">
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
