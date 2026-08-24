import { readFile } from "fs/promises";
import path from "path";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;

  for (const segment of segments) {
    if (
      segment === ".." ||
      segment === "." ||
      segment.includes("/") ||
      segment.includes("\\")
    ) {
      return new Response("Not Found", { status: 404 });
    }
  }

  const ext = segments[segments.length - 1]?.split(".").pop()?.toLowerCase();

  if (ext !== "jpg" && ext !== "jpeg" && ext !== "png") {
    return new Response("Not Found", { status: 404 });
  }

  const storagePath = path.join(
    process.cwd(),
    "storage",
    "uploads",
    ...segments,
  );
  const legacyPath = path.join(process.cwd(), "public", "uploads", ...segments);

  let file: Buffer;

  try {
    file = await readFile(storagePath);
  } catch {
    try {
      file = await readFile(legacyPath);
    } catch {
      return new Response("Not Found", { status: 404 });
    }
  }

  const contentType = ext === "png" ? "image/png" : "image/jpeg";

  return new Response(file, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
