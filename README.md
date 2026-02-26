# LINE OA Rich Menu Manager

เว็บแอป Multi-Tenant สำหรับจัดการ Rich Menu ของ LINE Official Accounts รองรับการ Import จาก LINE Bot Designer และการสร้าง Rich Menu แบบ Manual

## Tech Stack

- Next.js 15 (App Router, Server Actions)
- TypeScript (strict)
- Tailwind CSS + HeroUI
- Prisma ORM
- TiDB Serverless (MySQL compatible)
- NextAuth.js (Credentials)
- Zod, Recharts, @vercel/blob

## วิธีรันโปรเจกต์

### 1. ติดตั้ง dependencies

```bash
npm install
```

### 2. ตั้งค่า Environment

สร้างไฟล์ `.env` (หรือ copy จาก `.env.example`):

```env
DATABASE_URL="mysql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-at-least-32-chars"
BLOB_READ_WRITE_TOKEN="optional-for-vercel-blob"
```

### 3. Database

```bash
npx prisma generate
npx prisma db push
```

หรือใช้ migration:

```bash
npx prisma migrate dev
```

### 4. รัน dev server

```bash
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000) — สมัครสมาชิกที่ `/register` แล้วเข้าสู่ระบบที่ `/login`

## หน้าที่หลัก

- **Login / Register** — เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน
- **Dashboard** — สรุป Organizations, LINE Accounts, Rich Menus, คลิก
- **Organizations** — สร้าง/จัดการองค์กรและสมาชิก (OWNER, ADMIN, MEMBER)
- **LINE Accounts** — เพิ่ม LINE OA (Channel ID, Secret, Access Token)
- **Rich Menus** — รายการ Rich Menu ต่อ account
- **Import** — อัปโหลด richmenu.json + รูปจาก LINE Bot Designer
- **Rich Menu Editor** — แก้ไข areas, กำหนด action (URI / Message / Postback / Switch), Deploy ไป LINE
- **Deploy Logs** — ประวัติการ deploy
- **Analytics** — กราฟคลิกต่อเมนู/ปุ่ม (จาก Recharts)
- **Settings** — ตั้งค่าบัญชี

## Click Tracking (Webhook)

LINE Platform ส่ง webhook มาที่ URL ตาม Channel (ใน LINE Developers Console ตั้ง Webhook URL เป็น):

```
https://your-domain.com/api/webhook/line/{channelId}
```

เมื่อผู้ใช้กดปุ่ม Rich Menu ที่เป็น **Postback** ถ้ากำหนด data เป็นรูปแบบ `rpp:{richMenuId}:{areaIndex}` ระบบจะบันทึก ClickEvent ให้อัตโนมัติ (ใช้แสดงใน Analytics)

## Deployment (Vercel)

1. Push โค้ดไป Git แล้วเชื่อม Vercel
2. ตั้งค่า Environment Variables: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `BLOB_READ_WRITE_TOKEN` (ถ้าใช้ Vercel Blob)
3. Build Command: `npm run build`
4. Install Command: `npm install`
5. รัน Prisma: ใช้ Vercel Build ใส่ `prisma generate` ใน `postinstall` หรือรัน `prisma migrate deploy` ในขั้นตอนแยก (เช่น CI หรือหลัง deploy)

## License

MIT
