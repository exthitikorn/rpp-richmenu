"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";

import { siteConfig } from "@/config/site";

const FALLBACK_ERROR =
  "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง หรือไม่สามารถเชื่อมต่อ LDAP ได้";

interface LoginFormProps {
  lineLoginEnabled?: boolean;
}

export function LoginForm({ lineLoginEnabled = false }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/organizations";
  const urlError = searchParams.get("error");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lineLoading, setLineLoading] = useState(false);

  useEffect(() => {
    if (!urlError) return;

    if (urlError === "LineNotLinked") {
      setError(
        "บัญชี LINE นี้ยังไม่ได้เชื่อมต่อกับระบบ กรุณาเข้าสู่ระบบด้วยบัญชีโรงพยาบาลแล้วเชื่อมต่อ LINE ที่หน้าโปรไฟล์",
      );
    } else if (urlError === "AccessDenied") {
      setError("ไม่สามารถเข้าสู่ระบบได้");
    } else if (urlError === "OAuthCallback") {
      setError("เข้าสู่ระบบด้วย LINE ไม่สำเร็จ กรุณาลองใหม่");
    }
  }, [urlError]);

  function handleLineLogin() {
    setError("");
    setLineLoading(true);
    void signIn("line", { callbackUrl });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("ldap", {
        username: username.trim(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(typeof res.error === "string" ? res.error : FALLBACK_ERROR);
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
          <p className="text-sm text-default-500">{siteConfig.name}</p>
          <p className="text-sm text-default-400">
            กรุณาใช้บัญชีของโรงพยาบาลในการเข้าสู่ระบบ
          </p>
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
              autoComplete="username"
              label="ชื่อผู้ใช้"
              placeholder="กรอกชื่อผู้ใช้ของคุณ"
              type="text"
              value={username}
              onValueChange={setUsername}
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
              isDisabled={lineLoading}
              isLoading={loading}
              type="submit"
            >
              เข้าสู่ระบบ
            </Button>
          </form>
          {lineLoginEnabled && (
            <>
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-default-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-default-400">หรือ</span>
                </div>
              </div>
              <Button
                className="min-h-[44px] w-full bg-[#06C755] text-white"
                isDisabled={loading}
                isLoading={lineLoading}
                type="button"
                onPress={handleLineLogin}
              >
                เข้าสู่ระบบด้วย LINE
              </Button>
              <p className="text-center text-xs text-default-400">
                สำหรับบัญชีที่เชื่อมต่อ LINE กับระบบแล้ว
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
