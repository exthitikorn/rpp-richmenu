import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/config/site";

export interface SocialLink {
  label: string;
  platform: string;
  url: string;
}

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  footerText: string;
  copyrightText: string;
  socialLinks: SocialLink[];
}

const SOCIAL_LINKS_SCHEMA = z.array(
  z.object({
    label: z.string(),
    platform: z.string(),
    url: z.string().url(),
  }),
);

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: siteConfig.name,
  siteDescription: siteConfig.description,
  logoUrl: null,
  faviconUrl: null,
  primaryColor: "#0f172a",
  secondaryColor: "#22c55e",
  backgroundColor: "#ffffff",
  footerText: `${siteConfig.name} · Powered by HeroUI`,
  copyrightText: "",
  socialLinks: [],
};

function parseJsonSetting<T>(
  raw: string | undefined,
  schema: z.ZodType<T>,
  fallback: T,
): T {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as unknown;
    const result = schema.safeParse(parsed);

    if (!result.success) return fallback;

    return result.data;
  } catch {
    return fallback;
  }
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const rows = await prisma.siteSetting.findMany();
  const map = new Map<string, string>();

  for (const row of rows) {
    map.set(row.key, row.value);
  }

  return {
    siteName: map.get("site.name") ?? DEFAULT_SETTINGS.siteName,
    siteDescription:
      map.get("site.description") ?? DEFAULT_SETTINGS.siteDescription,
    logoUrl: map.get("site.logoUrl") ?? DEFAULT_SETTINGS.logoUrl,
    faviconUrl: map.get("site.faviconUrl") ?? DEFAULT_SETTINGS.faviconUrl,
    primaryColor:
      map.get("theme.primaryColor") ?? DEFAULT_SETTINGS.primaryColor,
    secondaryColor:
      map.get("theme.secondaryColor") ?? DEFAULT_SETTINGS.secondaryColor,
    backgroundColor:
      map.get("theme.backgroundColor") ?? DEFAULT_SETTINGS.backgroundColor,
    footerText: map.get("footer.text") ?? DEFAULT_SETTINGS.footerText,
    copyrightText:
      map.get("footer.copyright") ?? DEFAULT_SETTINGS.copyrightText,
    socialLinks: parseJsonSetting(
      map.get("footer.socialLinks"),
      SOCIAL_LINKS_SCHEMA,
      DEFAULT_SETTINGS.socialLinks,
    ),
  };
}

async function upsertSetting(key: string, value: string): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export async function updateGeneralSettings(input: {
  siteName: string;
  siteDescription?: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
}): Promise<void> {
  const description = input.siteDescription ?? "";
  const tasks: Promise<void>[] = [
    upsertSetting("site.name", input.siteName),
    upsertSetting("site.description", description),
  ];

  if (input.logoUrl !== undefined) {
    tasks.push(upsertSetting("site.logoUrl", input.logoUrl ?? ""));
  }

  if (input.faviconUrl !== undefined) {
    tasks.push(upsertSetting("site.faviconUrl", input.faviconUrl ?? ""));
  }

  await Promise.all(tasks);
}

export async function updateAppearanceSettings(input: {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
}): Promise<void> {
  await Promise.all([
    upsertSetting("theme.primaryColor", input.primaryColor),
    upsertSetting("theme.secondaryColor", input.secondaryColor),
    upsertSetting("theme.backgroundColor", input.backgroundColor),
  ]);
}

export async function updateFooterSettings(input: {
  footerText?: string;
  copyrightText?: string;
  socialLinks?: SocialLink[];
}): Promise<void> {
  const tasks: Promise<void>[] = [];

  if (input.footerText !== undefined) {
    tasks.push(upsertSetting("footer.text", input.footerText));
  }

  if (input.copyrightText !== undefined) {
    tasks.push(upsertSetting("footer.copyright", input.copyrightText));
  }

  if (input.socialLinks !== undefined) {
    tasks.push(
      upsertSetting(
        "footer.socialLinks",
        JSON.stringify(input.socialLinks ?? []),
      ),
    );
  }

  if (tasks.length > 0) {
    await Promise.all(tasks);
  }
}
