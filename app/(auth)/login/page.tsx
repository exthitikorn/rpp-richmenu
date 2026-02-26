"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card, CardBody, CardHeader } from "@heroui/card";
import NextLink from "next/link";
import { Link } from "@heroui/link";

function LoginForm() {
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
    <div className="min-h-[80vh] flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col gap-1 px-8 pt-8 pb-0">
          <h1 className="text-2xl font-semibold">เข้าสู่ระบบ</h1>
          <p className="text-default-500 text-sm">LINE OA Rich Menu Manager</p>
        </CardHeader>
        <CardBody className="px-8 pb-8 pt-6">
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
          <p className="text-center text-default-500 text-sm mt-4">
            ยังไม่มีบัญชี?{" "}
            <Link as={NextLink} className="text-primary" href="/register">
              สมัครสมาชิก
            </Link>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <p className="text-default-500">กำลังโหลด...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
