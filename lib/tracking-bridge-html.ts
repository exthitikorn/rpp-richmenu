import { siteConfig } from "@/config/site";

function escapeHtml(raw: string): string {
  return raw
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export type BridgeKind = "tel" | "mailto" | "other";

export function describeBridgeTarget(target: string): {
  kind: BridgeKind;
  display: string;
  status: string;
  cta: string;
} {
  try {
    const u = new URL(target);

    if (u.protocol === "tel:") {
      const display = decodeURIComponent(u.pathname);

      return {
        kind: "tel",
        display,
        status: "กำลังเปิดการโทร…",
        cta: "โทรเลย",
      };
    }

    if (u.protocol === "mailto:") {
      const display = decodeURIComponent(
        (u.pathname || "").split("?")[0] ?? "",
      );

      return {
        kind: "mailto",
        display,
        status: "กำลังเปิดอีเมล…",
        cta: "ส่งอีเมล",
      };
    }
  } catch {
    // fall through
  }

  return {
    kind: "other",
    display: target,
    status: "กำลังเปิดต่อ…",
    cta: "เปิดต่อ",
  };
}

/** Branded HTML bridge for tel:/mailto: (HTTP 302 cannot open those schemes). */
export function buildTrackingBridgeHtml(target: string): string {
  const { display, status, cta } = describeBridgeTarget(target);
  const hrefAttr = escapeHtml(target);
  const hrefJs = JSON.stringify(target);
  const primary = siteConfig.colors.primary;
  const secondary = siteConfig.colors.secondary;
  const hospital = escapeHtml(siteConfig.hospitalName);
  const orgLine = escapeHtml("สำนักการแพทย์ กทม.");
  const safeDisplay = escapeHtml(display);
  const safeStatus = escapeHtml(status);
  const safeCta = escapeHtml(cta);

  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${hospital}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100dvh;
    display: grid;
    place-items: center;
    padding: 24px 16px;
    font-family: "Sarabun", "Noto Sans Thai", system-ui, sans-serif;
    color: ${primary};
    background:
      radial-gradient(120% 80% at 50% 0%, #e8f3ee 0%, #f7faf8 45%, #ffffff 100%);
  }
  main {
    width: min(100%, 22rem);
    text-align: center;
  }
  img {
    width: 7.5rem;
    height: 7.5rem;
    object-fit: contain;
    display: block;
    margin: 0 auto 1rem;
  }
  h1 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    letter-spacing: 0.01em;
  }
  .org {
    margin: 0.35rem 0 0;
    font-size: 0.9rem;
    color: ${secondary};
    font-weight: 600;
  }
  .status {
    margin: 1.5rem 0 0.35rem;
    font-size: 0.95rem;
    opacity: 0.85;
  }
  .dest {
    margin: 0;
    font-size: 1.35rem;
    font-weight: 700;
    word-break: break-word;
  }
  a.cta {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-top: 1.5rem;
    min-height: 3rem;
    padding: 0.75rem 1.5rem;
    border-radius: 0.75rem;
    background: ${primary};
    color: #fff;
    font-size: 1.05rem;
    font-weight: 700;
    text-decoration: none;
    box-shadow: 0 8px 20px color-mix(in srgb, ${primary} 28%, transparent);
  }
  a.cta:active { transform: scale(0.98); }
  .hint {
    margin: 1rem 0 0;
    font-size: 0.8rem;
    opacity: 0.65;
    line-height: 1.4;
  }
</style>
</head>
<body>
<main>
  <img src="/brand/rpp-logo.png" width="120" height="120" alt="${hospital}">
  <h1>${hospital}</h1>
  <p class="org">${orgLine}</p>
  <p class="status">${safeStatus}</p>
  <p class="dest">${safeDisplay}</p>
  <a class="cta" href="${hrefAttr}">${safeCta}</a>
  <p class="hint">หากไม่เปิดอัตโนมัติ ให้กดปุ่มด้านบน</p>
</main>
<script>location.href=${hrefJs}</script>
</body>
</html>`;
}
