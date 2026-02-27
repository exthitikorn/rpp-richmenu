"use client";

import type { SiteSettings, SocialLink } from "@/lib/site-settings";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { Tabs, Tab } from "@heroui/tabs";
import { Select, SelectItem } from "@heroui/select";
import { Image } from "@heroui/image";

interface SettingsFormProps {
  initialSettings: SiteSettings;
}

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/svg+xml",
];

type ThemePresetKey = "default" | "green" | "purple" | "orange";

const THEME_PRESETS: Record<
  ThemePresetKey,
  { label: string; primary: string; secondary: string; background: string }
> = {
  default: {
    label: "HeroUI Default (Blue)",
    primary: "#006FEE",
    secondary: "#17C964",
    background: "#FFFFFF",
  },
  green: {
    label: "Emerald",
    primary: "#16A34A",
    secondary: "#22C55E",
    background: "#F0FDF4",
  },
  purple: {
    label: "Grape",
    primary: "#7C3AED",
    secondary: "#A855F7",
    background: "#F3E8FF",
  },
  orange: {
    label: "Sunset",
    primary: "#EA580C",
    secondary: "#F97316",
    background: "#FFF7ED",
  },
};

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const router = useRouter();
  const [siteName, setSiteName] = useState(initialSettings.siteName);
  const [siteDescription, setSiteDescription] = useState(
    initialSettings.siteDescription,
  );
  const [logoPreview, setLogoPreview] = useState<string | null>(
    initialSettings.logoUrl,
  );
  const [faviconPreview, setFaviconPreview] = useState<string | null>(
    initialSettings.faviconUrl,
  );
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const [themePreset, setThemePreset] = useState<ThemePresetKey>(() => {
    const entries = Object.entries(THEME_PRESETS) as [
      ThemePresetKey,
      (typeof THEME_PRESETS)[ThemePresetKey],
    ][];
    const matched = entries.find(([, value]) => {
      return (
        value.primary.toLowerCase() ===
          initialSettings.primaryColor.toLowerCase() &&
        value.secondary.toLowerCase() ===
          initialSettings.secondaryColor.toLowerCase() &&
        value.background.toLowerCase() ===
          initialSettings.backgroundColor.toLowerCase()
      );
    });

    return matched?.[0] ?? "default";
  });

  const [primaryColor, setPrimaryColor] = useState(
    initialSettings.primaryColor,
  );
  const [secondaryColor, setSecondaryColor] = useState(
    initialSettings.secondaryColor,
  );
  const [backgroundColor, setBackgroundColor] = useState(
    initialSettings.backgroundColor,
  );

  const [footerText, setFooterText] = useState(initialSettings.footerText);
  const [copyrightText, setCopyrightText] = useState(
    initialSettings.copyrightText,
  );
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(
    initialSettings.socialLinks.length > 0
      ? initialSettings.socialLinks
      : [
          { label: "Facebook", platform: "facebook", url: "" },
          { label: "X", platform: "x", url: "" },
          { label: "LINE", platform: "line", url: "" },
        ],
  );

  const [savingSection, setSavingSection] = useState<
    "general" | "appearance" | "footer" | null
  >(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const preset = THEME_PRESETS[themePreset];

    setPrimaryColor(preset.primary);
    setSecondaryColor(preset.secondary);
    setBackgroundColor(preset.background);
  }, [themePreset]);

  function validateImage(file: File): string | null {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return "รองรับเฉพาะไฟล์ PNG, JPG, SVG";
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return "ขนาดไฟล์ต้องไม่เกิน 2MB";
    }

    return null;
  }

  async function handleSaveGeneral() {
    setSuccessMessage(null);

    const formData = new FormData();

    formData.append("siteName", siteName.trim());
    formData.append("siteDescription", siteDescription.trim());

    if (logoFile) {
      const error = validateImage(logoFile);

      if (error) {
        setImageError(error);

        return;
      }
      formData.append("logo", logoFile);
    }

    if (faviconFile) {
      const error = validateImage(faviconFile);

      if (error) {
        setImageError(error);

        return;
      }
      formData.append("favicon", faviconFile);
    }

    try {
      setSavingSection("general");
      const response = await fetch("/api/settings/general", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };

        throw new Error(data.error ?? "บันทึกการตั้งค่าทั่วไปไม่สำเร็จ");
      }

      setSuccessMessage("บันทึกการตั้งค่าทั่วไปเรียบร้อยแล้ว");
      setImageError(null);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "บันทึกการตั้งค่าไม่สำเร็จ";

      setImageError(message);
    } finally {
      setSavingSection(null);
    }
  }

  async function handleSaveAppearance() {
    setSuccessMessage(null);

    try {
      setSavingSection("appearance");
      const response = await fetch("/api/settings/appearance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryColor,
          secondaryColor,
          backgroundColor,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as unknown;

        throw new Error(
          data && typeof data === "object" && "error" in data
            ? String((data as { error?: string }).error)
            : "บันทึกการตั้งค่าธีมไม่สำเร็จ",
        );
      }

      setSuccessMessage("บันทึกการตั้งค่าการแสดงผลเรียบร้อยแล้ว");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "บันทึกการตั้งค่าไม่สำเร็จ";

      setImageError(message);
    } finally {
      setSavingSection(null);
    }
  }

  async function handleSaveFooter() {
    setSuccessMessage(null);

    try {
      setSavingSection("footer");
      const response = await fetch("/api/settings/footer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          footerText,
          copyrightText,
          socialLinks,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };

        throw new Error(
          data.error ?? "บันทึกการตั้งค่าส่วนท้ายเว็บไซต์ไม่สำเร็จ",
        );
      }

      setSuccessMessage("บันทึกการตั้งค่า Footer เรียบร้อยแล้ว");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "บันทึกการตั้งค่าไม่สำเร็จ";

      setImageError(message);
    } finally {
      setSavingSection(null);
    }
  }

  function handleResetFooterToDefault() {
    setFooterText(initialSettings.footerText);
    setCopyrightText(initialSettings.copyrightText);
    setSocialLinks(initialSettings.socialLinks);
    setSuccessMessage("รีเซ็ตค่า Footer กลับเป็นค่าปัจจุบันแล้ว");
  }

  function handleSocialLinkChange(
    index: number,
    field: keyof SocialLink,
    value: string,
  ) {
    setSocialLinks((prev) =>
      prev.map((link, position) =>
        position === index ? { ...link, [field]: value } : link,
      ),
    );
  }

  function handleAddSocialLink() {
    setSocialLinks((prev) => [
      ...prev,
      { label: "Custom", platform: "custom", url: "" },
    ]);
  }

  function handleRemoveSocialLink(index: number) {
    setSocialLinks((prev) => prev.filter((_, position) => position !== index));
  }

  return (
    <div className="space-y-4">
      {successMessage && (
        <p className="text-sm text-success" role="status">
          {successMessage}
        </p>
      )}
      {imageError && (
        <p className="text-sm text-danger" role="alert">
          {imageError}
        </p>
      )}

      <Tabs aria-label="Settings sections" color="primary" variant="underlined">
        <Tab key="general" title="ทั่วไป">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleSaveGeneral();
            }}
          >
            <Card as="section">
              <CardHeader className="flex flex-col items-start gap-1 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">General Settings</h2>
                  <p className="text-sm text-default-500">
                    ตั้งค่าชื่อเว็บไซต์ คำอธิบาย Logo และ Favicon
                  </p>
                </div>
                <Button
                  color="primary"
                  isLoading={savingSection === "general"}
                  size="sm"
                  type="submit"
                >
                  บันทึก
                </Button>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    isRequired
                    label="Site Name"
                    placeholder="ชื่อเว็บไซต์"
                    value={siteName}
                    onValueChange={setSiteName}
                  />
                  <Textarea
                    label="Site Description"
                    minRows={3}
                    placeholder="คำอธิบายเว็บไซต์"
                    value={siteDescription}
                    onValueChange={setSiteDescription}
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Logo</p>
                    <Button
                      as="label"
                      className="w-full justify-start"
                      size="sm"
                      variant="bordered"
                    >
                      <span className="truncate">
                        {logoFile?.name ?? "เลือกไฟล์โลโก้ (PNG / JPG / SVG)"}
                      </span>
                      <input
                        accept={ALLOWED_IMAGE_TYPES.join(",")}
                        className="hidden"
                        type="file"
                        onChange={(event) => {
                          const file = event.target.files?.[0];

                          if (!file) {
                            setLogoFile(null);

                            return;
                          }
                          const error = validateImage(file);

                          if (error) {
                            setImageError(error);
                            setLogoFile(null);

                            return;
                          }
                          setImageError(null);
                          setLogoFile(file);
                          const url = URL.createObjectURL(file);

                          setLogoPreview(url);
                        }}
                      />
                    </Button>
                    {logoPreview && (
                      <div>
                        <p className="text-xs text-default-500">Preview</p>
                        <Image
                          alt="Logo preview"
                          className="mt-1 h-12 w-auto rounded-medium border border-default-200 bg-white object-contain"
                          src={logoPreview}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Favicon</p>
                    <Button
                      as="label"
                      className="w-full justify-start"
                      size="sm"
                      variant="bordered"
                    >
                      <span className="truncate">
                        {faviconFile?.name ??
                          "เลือกไฟล์ favicon (PNG / JPG / SVG)"}
                      </span>
                      <input
                        accept={ALLOWED_IMAGE_TYPES.join(",")}
                        className="hidden"
                        type="file"
                        onChange={(event) => {
                          const file = event.target.files?.[0];

                          if (!file) {
                            setFaviconFile(null);

                            return;
                          }
                          const error = validateImage(file);

                          if (error) {
                            setImageError(error);
                            setFaviconFile(null);

                            return;
                          }
                          setImageError(null);
                          setFaviconFile(file);
                          const url = URL.createObjectURL(file);

                          setFaviconPreview(url);
                        }}
                      />
                    </Button>
                    {faviconPreview && (
                      <div>
                        <p className="text-xs text-default-500">Preview</p>
                        <Image
                          alt="Favicon preview"
                          className="mt-1 h-10 w-10 rounded-medium border border-default-200 bg-white object-contain"
                          src={faviconPreview}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          </form>
        </Tab>

        <Tab key="appearance" title="การแสดงผล">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleSaveAppearance();
            }}
          >
            <Card as="section">
              <CardHeader className="flex flex-col items-start gap-1 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Appearance Settings</h2>
                  <p className="text-sm text-default-500">
                    เลือกโทนสีหลักของระบบจากชุดธีมที่แนะนำ
                  </p>
                </div>
                <Button
                  color="primary"
                  isLoading={savingSection === "appearance"}
                  size="sm"
                  type="submit"
                >
                  บันทึก
                </Button>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="space-y-2">
                  <Select
                    className="max-w-xs"
                    label="Theme Preset"
                    selectedKeys={[themePreset]}
                    onSelectionChange={(keys) => {
                      const [key] = Array.from(keys as Set<React.Key>);

                      if (!key) return;
                      setThemePreset(key as ThemePresetKey);
                    }}
                  >
                    {(
                      Object.entries(THEME_PRESETS) as [
                        ThemePresetKey,
                        (typeof THEME_PRESETS)[ThemePresetKey],
                      ][]
                    ).map(([key, preset]) => (
                      <SelectItem key={key}>{preset.label}</SelectItem>
                    ))}
                  </Select>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1">
                    <p className="text-xs text-default-400">Primary Color</p>
                    <div className="flex items-center gap-2">
                      <span
                        className="h-6 w-6 rounded-full border border-default-200"
                        style={{ backgroundColor: primaryColor }}
                      />
                      <span className="text-xs text-default-500">
                        {primaryColor}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-default-400">Secondary Color</p>
                    <div className="flex items-center gap-2">
                      <span
                        className="h-6 w-6 rounded-full border border-default-200"
                        style={{ backgroundColor: secondaryColor }}
                      />
                      <span className="text-xs text-default-500">
                        {secondaryColor}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-default-400">Background Color</p>
                    <div className="flex items-center gap-2">
                      <span
                        className="h-6 w-6 rounded-full border border-default-200"
                        style={{ backgroundColor: backgroundColor }}
                      />
                      <span className="text-xs text-default-500">
                        {backgroundColor}
                      </span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </form>
        </Tab>

        <Tab key="footer" title="Footer">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleSaveFooter();
            }}
          >
            <Card as="section">
              <CardHeader className="flex flex-col items-start gap-1 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Footer Settings</h2>
                  <p className="text-sm text-default-500">
                    ตั้งค่าข้อความส่วนท้าย และลิงก์ Social Media
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="bordered"
                    onPress={handleResetFooterToDefault}
                  >
                    รีเซ็ต
                  </Button>
                  <Button
                    color="primary"
                    isLoading={savingSection === "footer"}
                    size="sm"
                    type="submit"
                  >
                    บันทึก
                  </Button>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    label="Footer Text"
                    minRows={3}
                    placeholder="ข้อความส่วนท้ายเว็บไซต์"
                    value={footerText}
                    onValueChange={setFooterText}
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    label="Copyright"
                    placeholder="เช่น © 2026 Your Company"
                    value={copyrightText}
                    onValueChange={setCopyrightText}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Social Links</span>
                    <Button
                      size="sm"
                      variant="light"
                      onPress={handleAddSocialLink}
                    >
                      เพิ่มลิงก์
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {socialLinks.map((link, index) => (
                      <div
                        key={`${link.platform}-${index}`}
                        className="grid gap-2 rounded-large border border-default-200 p-3 md:grid-cols-[1fr,2fr,auto]"
                      >
                        <Input
                          label="Label"
                          placeholder="เช่น Facebook"
                          size="sm"
                          value={link.label}
                          onValueChange={(value) =>
                            handleSocialLinkChange(index, "label", value)
                          }
                        />
                        <Input
                          label="URL"
                          placeholder="https://"
                          size="sm"
                          value={link.url}
                          onValueChange={(value) =>
                            handleSocialLinkChange(index, "url", value)
                          }
                        />
                        <div className="flex items-end justify-end">
                          <Button
                            color="danger"
                            size="sm"
                            variant="light"
                            onPress={() => handleRemoveSocialLink(index)}
                          >
                            ลบ
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardBody>
            </Card>
          </form>
        </Tab>
      </Tabs>
    </div>
  );
}
