"use client";

import { useEffect, useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";

import { AuthCard } from "@/components/layouts/AuthCard";
import { AuthInfoPanel } from "@/components/layouts/AuthInfoPanel";
import { siteConfig } from "@/config/site";
import { sanitizeCallbackUrl } from "@/lib/auth-redirect";

const FALLBACK_ERROR =
  "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง หรือไม่สามารถเชื่อมต่อ LDAP ได้";

interface LoginFormProps {
  lineLoginEnabled?: boolean;
}

export function LoginForm({ lineLoginEnabled = false }: LoginFormProps) {
  const searchParams = useSearchParams();
  const callbackUrl = sanitizeCallbackUrl(searchParams.get("callbackUrl"));
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

        return;
      }

      const session = await getSession();
      const destination = session?.user?.isApproved
        ? callbackUrl
        : "/pending-approval";

      window.location.assign(destination);
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      aside={<AuthInfoPanel />}
      header={
        <>
          <h2 className="text-xl font-semibold sm:text-2xl">เข้าสู่ระบบ</h2>
          <p className="text-sm text-default-400">
            กรุณาใช้บัญชีของโรงพยาบาลในการเข้าสู่ระบบ
          </p>
        </>
      }
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
              <span className="bg-content1 px-2 text-default-400">หรือ</span>
            </div>
          </div>
          <Button
            className="min-h-[44px] w-full text-white"
            isDisabled={loading}
            isLoading={lineLoading}
            style={{ backgroundColor: siteConfig.colors.line }}
            type="button"
            onPress={handleLineLogin}
          >
            เข้าสู่ระบบด้วย LINE
          </Button>
          <p className="text-center text-xs text-default-400 mt-2">
            สำหรับบัญชีที่เชื่อมต่อ LINE กับระบบแล้ว
          </p>
        </>
      )}
    </AuthCard>
  );
}
