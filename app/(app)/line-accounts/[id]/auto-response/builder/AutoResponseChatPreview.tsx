"use client";

import { FlexMessagePreview } from "./FlexMessagePreview";

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

function OaAvatar() {
  return (
    <span
      aria-hidden
      className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ffcc00] text-[8px] font-bold text-[#1c1c1e]"
    >
      OA
    </span>
  );
}

export function AutoResponseChatPreview({
  accountName,
  responseType,
  text,
  contents,
}: {
  accountName: string;
  responseType: "TEXT" | "FLEX";
  text: string;
  contents: unknown;
}) {
  const iconBtn = "h-[18px] w-[18px] shrink-0 text-[#1c1c1e]";
  const showText = responseType === "TEXT" && text.trim() !== "";
  const showFlex = responseType === "FLEX";

  return (
    <div
      aria-label={`จำลองแชท LINE ของ ${accountName}`}
      className="mx-auto flex h-[560px] w-full max-w-[320px] flex-col overflow-hidden rounded-[2rem] border border-default-300 bg-black shadow-sm"
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

        <div className="relative z-[1] flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overflow-x-hidden px-2.5 pb-2 pt-2">
          <div className="flex justify-center">
            <span className="rounded-full bg-[#6b7f94]/85 px-2.5 py-0.5 text-[10px] font-medium text-white">
              Today
            </span>
          </div>

          {showText ? (
            <div className="flex items-end gap-1.5">
              <OaAvatar />
              <div className="whitespace-pre-wrap rounded-2xl rounded-bl-md bg-white px-3 py-2 text-[12px] leading-snug text-black shadow-sm">
                {text}
              </div>
              <span className="mb-0.5 text-[10px] text-[#e8eef3]">11:48</span>
            </div>
          ) : showFlex ? (
            <div className="flex items-end gap-1.5">
              <OaAvatar />
              <div className="min-w-0 flex-1">
                <FlexMessagePreview contents={contents} />
              </div>
            </div>
          ) : (
            <p className="py-4 text-center text-xs text-white/80">
              พิมพ์ข้อความเพื่อดูตัวอย่าง
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 bg-white px-2 pb-1 pt-2">
        <div className="flex h-8 min-w-0 flex-1 items-center rounded-full bg-[#f2f2f7] px-3">
          <span className="flex-1 text-[13px] text-[#aeaeb2]">Aa</span>
          <IconSmile className="h-5 w-5 shrink-0 text-[#8e8e93]" />
        </div>
      </div>
      <div
        aria-hidden
        className="flex shrink-0 justify-center bg-white pb-2 pt-1"
      >
        <span className="h-[3px] w-24 rounded-full bg-black" />
      </div>
    </div>
  );
}
