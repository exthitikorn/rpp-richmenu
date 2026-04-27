# LINE OA Rich Menu Manager

เว็บแอปแบบ Multi-Tenant สำหรับจัดการ Rich Menu ของ LINE Official Accounts รองรับทั้งการ Import จาก LINE Bot Designer และการสร้าง Rich Menu แบบ Manual

แอปตัวนี้ออกแบบมาให้พร้อมใช้งานบน GitHub / Vercel และอ่านง่ายสำหรับทั้ง Dev ไทยและต่างชาติ

## สารบัญ

- [Tech Stack](#tech-stack)
- [การติดตั้งและการใช้งาน](#การติดตั้งและการใช้งาน-getting-started)
- [ฟีเจอร์หลัก](#ฟีเจอร์หลัก-main-features)
- [Click Tracking & Webhook](#click-tracking--webhook)
- [Deployment (Vercel)](#deployment-vercel)
- [License](#license)

## Tech Stack

- Next.js 15 (App Router, Server Actions)
- TypeScript (strict)
- Tailwind CSS + HeroUI
- Prisma ORM
- TiDB Serverless (MySQL compatible)
- NextAuth.js (Credentials)
- Zod, Recharts, @vercel/blob

## การติดตั้งและการใช้งาน (Getting Started)

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

### 3. เตรียม Database

```bash
npx prisma generate
npx prisma db push
```

หรือใช้ migration:

```bash
npx prisma migrate dev
```

### 4. รัน Dev Server

```bash
npm run dev
```

เปิด `http://localhost:3000` แล้ว:

- สมัครสมาชิกที่ `/register`
- เข้าสู่ระบบที่ `/login`

## ฟีเจอร์หลัก (Main Features)

- **Login / Register** — เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน
- **Dashboard** — สรุปสถานะ Organizations, LINE Accounts, Rich Menus, และสถิติการคลิก
- **Organizations** — สร้าง/จัดการหน่วยงานและสมาชิก (OWNER, ADMIN, MEMBER)
- **LINE Accounts** — เพิ่ม LINE OA (Channel ID, Secret, Access Token)
- **Rich Menus** — จัดการรายการ Rich Menu ต่อ LINE OA แต่ละบัญชี
- **Import** — อัปโหลด `richmenu.json` + รูปจาก LINE Bot Designer
- **Rich Menu Editor** — แก้ไข areas, กำหนด action (URI / Message / Postback / Switch) และ Deploy ไป LINE
- **Deploy Logs** — ดูประวัติการ deploy Rich Menu
- **Analytics** — กราฟคลิกต่อเมนู/ปุ่ม (จาก Recharts)
- **Settings** — ตั้งค่าบัญชีผู้ใช้

## Click Tracking & Webhook

LINE Platform จะส่ง webhook มาที่ URL ตาม Channel (ใน LINE Developers Console ตั้ง Webhook URL เป็น):

```text
https://your-domain.com/api/webhook/line/{channelId}
```

เมื่อผู้ใช้กดปุ่ม Rich Menu ที่เป็น **Postback** และกำหนด `data` เป็นรูปแบบ `rpp:{richMenuId}:{areaIndex}` ระบบจะบันทึก ClickEvent ให้อัตโนมัติ (ใช้แสดงใน Analytics)

## Deployment (Vercel)

1. Push โค้ดขึ้น Git แล้วเชื่อมกับ Vercel
2. ตั้งค่า Environment Variables บน Vercel:
   - `DATABASE_URL`
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`
   - `BLOB_READ_WRITE_TOKEN` (ถ้าใช้ Vercel Blob)
3. Build Command: `npm run build`
4. Install Command: `npm install`
5. การจัดการ Prisma:
   - ใส่ `prisma generate` ใน `postinstall` หรือ
   - รัน `prisma migrate deploy` แยกในขั้นตอน CI / หลัง deploy

## License

MIT
