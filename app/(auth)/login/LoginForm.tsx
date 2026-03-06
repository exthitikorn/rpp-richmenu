"use client";

import { useEffect, useState } from "react";
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
  const urlError = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!urlError) return;

    if (urlError === "AwaitingApproval") {
      setError(
        "บัญชีของคุณถูกสร้างแล้ว กรุณารอผู้ดูแลระบบอนุมัติก่อนจึงจะเข้าสู่ระบบได้",
      );
    } else if (urlError === "LineProfileMissing") {
      setError("ไม่สามารถดึงข้อมูลผู้ใช้จาก LINE ได้ กรุณาลองใหม่อีกครั้ง");
    } else if (urlError === "AccessDenied") {
      setError("ไม่สามารถเข้าสู่ระบบด้วย LINE ได้");
    }
  }, [urlError]);

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
    <div className="flex min-h-[80vh] w-full items-center justify-center px-4 py-6">
      <div className="w-full max-w-lg rounded-2xl border border-default-200 bg-white shadow-lg sm:max-w-xl md:max-w-xl">
        <div className="flex flex-col gap-1 px-4 pb-0 pt-6 sm:px-8 sm:pt-8 md:px-12 lg:px-16">
          <h1 className="text-xl font-semibold sm:text-2xl">เข้าสู่ระบบ</h1>
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
              isRequired
              autoComplete="current-password"
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
              เข้าสู่ระบบ
            </Button>
          </form>
          <div className="mt-4">
            <Button
              className="min-h-[44px] w-full"
              color="success"
              variant="flat"
              onPress={() => {
                void signIn("line", { callbackUrl });
              }}
            >
              เข้าสู่ระบบด้วย LINE
            </Button>
          </div>
          <p className="mt-4 text-center text-sm text-default-500">
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
