/**
 * แปลง DATABASE_URL เป็น config object สำหรับ @prisma/adapter-mariadb
 * เปิด SSL เมื่อ URL มี ?sslaccept=strict หรือ ?ssl=true หรือเมื่อตั้งค่า DATABASE_SSL=true
 * ถ้าไม่มี → ไม่บังคับ SSL (ใช้กับ localhost/XAMPP ได้ปกติ)
 */
function shouldUseSsl(databaseUrl: string): boolean {
  const envSsl = process.env.DATABASE_SSL?.toLowerCase();

  if (envSsl === "true" || envSsl === "1") return true;
  if (envSsl === "false" || envSsl === "0") return false;

  try {
    const url = new URL(databaseUrl);
    const sslAccept = url.searchParams.get("sslaccept");
    const ssl = url.searchParams.get("ssl");

    return sslAccept === "strict" || ssl === "true";
  } catch {
    return false;
  }
}

export function getDbPoolConfig(databaseUrl: string) {
  let url: URL;

  try {
    url = new URL(databaseUrl);
  } catch {
    throw new Error(
      "DATABASE_URL มีรูปแบบไม่ถูกต้อง ต้องเป็น mysql://user:password@host:port/database",
    );
  }

  if (url.protocol !== "mysql:") {
    throw new Error("DATABASE_URL ต้องใช้โพรโทคอล mysql:// เท่านั้น");
  }

  const password = url.password ? decodeURIComponent(url.password) : undefined;
  const database = url.pathname ? url.pathname.slice(1) : undefined;

  const isVercel = process.env.VERCEL === "1";

  const config: {
    host: string;
    port: number;
    user?: string;
    password?: string;
    database?: string;
    connectionLimit?: number;
    connectTimeout: number;
    acquireTimeout: number;
    ssl?: boolean;
  } = {
    host: url.hostname,
    port: url.port ? Number.parseInt(url.port, 10) : 3306,
    user: url.username || undefined,
    password,
    database: database || undefined,
    ...(isVercel && { connectionLimit: 1 }),
    connectTimeout: isVercel ? 20_000 : 10_000,
    acquireTimeout: isVercel ? 25_000 : 10_000,
  };

  if (shouldUseSsl(databaseUrl)) {
    config.ssl = true;
  }

  return config;
}
