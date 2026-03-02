"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import NextLink from "next/link";
import { Link } from "@heroui/link";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
        setLoading(false);

        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div
        className="rounded-2xl bg-white shadow-lg border border-default-200"
        style={{ width: "520px", maxWidth: "100%" }}
      >
        <div className="flex flex-col gap-1 px-8 pt-8 pb-0">
          <h1 className="text-2xl font-semibold">เข้าสู่ระบบ</h1>
          <p className="text-default-500 text-sm">LINE OA Rich Menu Manager</p>
        </div>
        <div className="px-8 pb-8 pt-6">
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
              isRequired
              autoComplete="current-password"
              label="รหัสผ่าน"
              placeholder="••••••••"
              type="password"
              value={password}
              onValueChange={setPassword}
            />
            <Button
              className="w-full"
              color="primary"
              isLoading={loading}
              type="submit"
            >
              เข้าสู่ระบบ
            </Button>
          </form>
          <div className="mt-4">
            <Button
              className="w-full"
              color="success"
              variant="flat"
              onPress={() => {
                void signIn("line", { callbackUrl });
              }}
            >
              เข้าสู่ระบบด้วย LINE
            </Button>
          </div>
          <p className="text-center text-default-500 text-sm mt-4">
            ยังไม่มีบัญชี?{" "}
            <Link as={NextLink} className="text-primary" href="/register">
              สมัครสมาชิก
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
