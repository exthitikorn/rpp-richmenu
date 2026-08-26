"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@heroui/button";

type PreviewMenu = {
  id: string;
  name: string;
  chatBarText: string;
  imageUrl: string;
  width: number;
  height: number;
  isDefault: boolean;
  lineRichMenuId: string | null;
};

type ListResponse = {
  previewMenus: PreviewMenu[];
  defaultPreviewMenuId: string | null;
  error?: string;
};

function IconCellular({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="currentColor"
      viewBox="0 0 18 12"
    >
      <rect height="3" rx="0.5" width="2.5" x="0" y="9" />
      <rect height="5" rx="0.5" width="2.5" x="4" y="7" />
      <rect height="7" rx="0.5" width="2.5" x="8" y="5" />
      <rect height="9" rx="0.5" width="2.5" x="12" y="3" />
      <rect height="11" rx="0.5" width="2.5" x="16" y="1" />
    </svg>
  );
}

function IconWifi({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      viewBox="0 0 16 12"
    >
      <path d="M1 4.5c4.5-3.5 9.5-3.5 14 0" />
      <path d="M3.5 7.5c3-2.3 6.5-2.3 9.5 0" />
      <path d="M6 10.2c1.5-1.1 3.5-1.1 5 0" />
      <circle cx="8.5" cy="11.5" fill="currentColor" r="0.75" stroke="none" />
    </svg>
  );
}

function IconBattery({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.25"
      viewBox="0 0 26 12"
    >
      <rect height="10" rx="2" width="22" x="0.5" y="1" />
      <path d="M23.5 4.5v3c1.2 0 2.2-1 2.2-1.5s-1-1.5-2.2-1.5z" />
      <rect
        fill="currentColor"
        height="6"
        rx="0.75"
        stroke="none"
        width="16"
        x="2.5"
        y="3"
      />
    </svg>
  );
}

function IconBack({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function IconSearch({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
      viewBox="0 0 24 24"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" />
    </svg>
  );
}

function IconNote({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
      viewBox="0 0 24 24"
    >
      <rect height="16" rx="1.5" width="14" x="5" y="4" />
      <path d="M9 9h6M9 12h6M9 15h4" />
    </svg>
  );
}

function IconMenu({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.75"
      viewBox="0 0 24 24"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function IconPlus({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.75"
      viewBox="0 0 24 24"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconCamera({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
      viewBox="0 0 24 24"
    >
      <path d="M4 8h3l1.5-2h7L17 8h3v11H4V8z" />
      <circle cx="12" cy="13.5" r="3.25" />
    </svg>
  );
}

function IconGallery({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
      viewBox="0 0 24 24"
    >
      <rect height="14" rx="2" width="18" x="3" y="5" />
      <circle cx="8.5" cy="10" r="1.25" />
      <path d="M21 16l-5-4-4 3-3-2-4 4" />
    </svg>
  );
}

function IconSmile({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.75"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 10h.01M15.5 10h.01M8.5 14.5c1 1.4 2.5 2 3.5 2s2.5-.6 3.5-2" />
    </svg>
  );
}

function IconMic({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
      viewBox="0 0 24 24"
    >
      <rect height="11" rx="3.5" width="7" x="8.5" y="3" />
      <path d="M5 11a7 7 0 0014 0M12 18v3" />
    </svg>
  );
}

function IconKeyboard({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <rect height="3" rx="0.5" width="3" x="4" y="5" />
      <rect height="3" rx="0.5" width="3" x="8.5" y="5" />
      <rect height="3" rx="0.5" width="3" x="13" y="5" />
      <rect height="3" rx="0.5" width="3" x="17" y="5" />
      <rect height="3" rx="0.5" width="3" x="4" y="10" />
      <rect height="3" rx="0.5" width="3" x="8.5" y="10" />
      <rect height="3" rx="0.5" width="3" x="13" y="10" />
      <rect height="3" rx="0.5" width="3" x="17" y="10" />
      <rect height="3" rx="0.5" width="8" x="4" y="15" />
      <rect height="3" rx="0.5" width="3" x="13.5" y="15" />
      <rect height="3" rx="0.5" width="3" x="17" y="15" />
    </svg>
  );
}

function RichMenuChatBar({ label }: { label: string }) {
  return (
    <div className="flex shrink-0 items-center border-t border-default-200 bg-white py-1.5 pl-4 pr-2">
      <span
        aria-hidden
        className="flex h-8 w-8 shrink-0 items-center justify-center"
      >
        <IconKeyboard className="h-5 w-5 text-[#8e8e93]" />
      </span>
      <div className="flex min-w-0 flex-1 items-center justify-center gap-1 pr-7 text-[#1c1c1e]">
        <span className="truncate text-[13px] font-medium">{label}</span>
        <span aria-hidden className="text-[10px] leading-none text-[#8e8e93]">
          ▾
        </span>
      </div>
    </div>
  );
}

function StandardChatComposer() {
  return (
    <>
      <div className="flex shrink-0 items-center gap-1.5 bg-white px-2 pb-1 pt-2">
        <IconPlus className="h-5 w-5 shrink-0 text-[#8e8e93]" />
        <IconCamera className="h-5 w-5 shrink-0 text-[#8e8e93]" />
        <IconGallery className="h-5 w-5 shrink-0 text-[#8e8e93]" />
        <div className="flex h-8 min-w-0 flex-1 items-center rounded-full bg-[#f2f2f7] px-3">
          <span className="flex-1 text-[13px] text-[#aeaeb2]">Aa</span>
          <IconSmile className="h-5 w-5 shrink-0 text-[#8e8e93]" />
        </div>
        <IconMic className="h-5 w-5 shrink-0 text-[#8e8e93]" />
      </div>
      <div
        aria-hidden
        className="flex shrink-0 justify-center bg-white pb-2 pt-1"
      >
        <span className="h-[3px] w-24 rounded-full bg-black" />
      </div>
    </>
  );
}

/** iPhone-class canvas used by LINE design refs (e.g. Sinch docs). */
const MOCK_W = 1170;
const MOCK_H = 2532;

export function DefaultRichMenuChatPreview({
  lineAccountId,
  accountName,
}: {
  lineAccountId: string;
  accountName: string;
}) {
  const [previewMenus, setPreviewMenus] = useState<PreviewMenu[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/line-accounts/${lineAccountId}/line-rich-menus`,
      );
      const data = (await res.json()) as ListResponse;

      if (!res.ok) {
        throw new Error(data.error || "โหลดไม่สำเร็จ");
      }

      setPreviewMenus(data.previewMenus ?? []);
      setActiveMenuId(
        data.defaultPreviewMenuId ?? data.previewMenus[0]?.id ?? null,
      );
    } catch (e) {
      setPreviewMenus([]);
      setActiveMenuId(null);
      setError(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [lineAccountId]);

  useEffect(() => {
    void load();
  }, [load]);

  const menu =
    previewMenus.find((m) => m.id === activeMenuId) ?? previewMenus[0] ?? null;

  const iconBtn = "h-[18px] w-[18px] shrink-0 text-[#1c1c1e]";
  const hasMenuImage = Boolean(!loading && !error && menu?.imageUrl);
  const showTabs = !loading && !error && previewMenus.length > 1;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-default-700">
          จำลองแชท (Default)
        </h2>
        <Button
          isDisabled={loading}
          size="sm"
          variant="light"
          onPress={() => void load()}
        >
          รีเฟรช
        </Button>
      </div>

      <div
        aria-label={`จำลองแชท LINE ของ ${accountName}`}
        className="mx-auto flex w-full max-w-[320px] flex-col overflow-hidden rounded-[2rem] border border-default-300 bg-black shadow-sm"
        style={{ aspectRatio: `${MOCK_W} / ${MOCK_H}` }}
      >
        <div className="relative flex min-h-0 flex-1 flex-col bg-[#849bb4]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 opacity-70"
            style={{
              background:
                "radial-gradient(ellipse 80% 50% at 20% 80%, rgba(255,255,255,0.35), transparent 55%), radial-gradient(ellipse 70% 45% at 75% 90%, rgba(255,255,255,0.28), transparent 50%), radial-gradient(ellipse 60% 40% at 50% 100%, rgba(255,255,255,0.22), transparent 45%)",
            }}
          />

          <div className="relative z-[1] flex items-center justify-between px-5 pt-2.5 text-[10px] font-semibold text-black">
            <span>11:48</span>
            <div className="flex items-center gap-[5px] text-black">
              <IconCellular className="h-[10px] w-[14px]" />
              <IconWifi className="h-[10px] w-[14px]" />
              <IconBattery className="h-[11px] w-[22px]" />
            </div>
          </div>

          <div className="relative z-[1] flex items-center gap-1 bg-white/35 px-1.5 py-1.5 backdrop-blur-[2px]">
            <IconBack className="h-6 w-6 shrink-0 text-black" />
            <span
              aria-hidden
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#c7c7cc] text-[9px] font-semibold text-white"
            >
              OA
            </span>
            <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-black">
              {accountName}
            </p>
            <div className="flex items-center gap-2.5 pr-1.5">
              <IconSearch className={iconBtn} />
              <IconNote className={iconBtn} />
              <IconMenu className={iconBtn} />
            </div>
          </div>

          <div className="relative z-[1] flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden px-2.5 pb-2 pt-2">
            <div className="flex justify-center">
              <span className="rounded-full bg-[#6b7f94]/85 px-2.5 py-0.5 text-[10px] font-medium text-white">
                Today
              </span>
            </div>

            {!loading && !error ? (
              <div className="flex items-end gap-1.5">
                <span
                  aria-hidden
                  className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ffcc00] text-[8px] font-bold text-[#1c1c1e]"
                >
                  OA
                </span>
                <div className="rounded-2xl rounded-bl-md bg-white px-3 py-2 text-[12px] leading-snug text-black shadow-sm">
                  สวัสดีค่ะ มีอะไรให้ช่วยไหม?
                </div>
                <span className="mb-0.5 text-[10px] text-[#e8eef3]">11:48</span>
              </div>
            ) : null}

            {loading ? (
              <p className="py-6 text-center text-xs text-white/80">
                กำลังโหลด…
              </p>
            ) : null}

            {!loading && error ? (
              <p className="py-6 text-center text-xs text-red-100" role="alert">
                {error}
              </p>
            ) : null}

            {!loading && !error && previewMenus.length === 0 ? (
              <p className="mt-auto py-3 text-center text-xs text-white/85">
                ยังไม่มี Rich Menu ที่ deploy แล้ว
              </p>
            ) : null}

            {!loading && !error && menu && !menu.imageUrl ? (
              <div className="mt-auto space-y-1 py-3 text-center">
                <p className="text-xs font-medium text-white">{menu.name}</p>
                <p className="text-[11px] text-white/80">
                  เมนูนี้อยู่บน LINE แต่ยังไม่มีรูปในระบบ
                </p>
              </div>
            ) : null}

            <div className="mt-auto" />
          </div>
        </div>

        {hasMenuImage && menu ? (
          <div className="relative z-[1] max-h-[42%] w-full shrink-0 overflow-hidden bg-white">
            <div
              className="relative h-full min-h-[80px] w-full"
              style={{
                aspectRatio: `${menu.width} / ${menu.height}`,
              }}
            >
              <Image
                fill
                alt={menu.name}
                className="object-cover object-top"
                sizes="320px"
                src={menu.imageUrl!}
              />
            </div>
          </div>
        ) : null}

        {menu ? (
          <RichMenuChatBar label={menu.chatBarText?.trim() || "เมนู"} />
        ) : (
          <StandardChatComposer />
        )}
      </div>

      {showTabs ? (
        <div
          aria-label="สลับหน้า Rich Menu"
          className="mx-auto flex max-w-[320px] flex-wrap justify-center gap-1.5"
          role="tablist"
        >
          {previewMenus.map((m, index) => {
            const active = m.id === menu?.id;

            return (
              <button
                key={m.id}
                aria-selected={active}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-default-100 text-default-600 hover:bg-default-200"
                }`}
                role="tab"
                title={m.name}
                type="button"
                onClick={() => setActiveMenuId(m.id)}
              >
                หน้า {index + 1}
              </button>
            );
          })}
        </div>
      ) : null}

      {menu ? (
        <p className="text-center text-[11px] text-default-400">
          {menu.name}
          {menu.isDefault ? " · Default" : ""}
        </p>
      ) : null}
    </div>
  );
}
