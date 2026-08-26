# ระบบจัดการ Rich Menu LINE OA

เว็บแอปสำหรับจัดการ Rich Menu ของ LINE Official Accounts หลายบัญชีในระบบเดียว  
รองรับการ Import จาก LINE Bot Designer และการแก้ไข / Deploy ผ่าน Editor

พัฒนาสำหรับโรงพยาบาลราชพิพัฒน์ — ฝ่ายวิชาการและแผนงาน

**ขอบเขตการเข้าถึงข้อมูล:** ผู้ใช้ถูกผูกกับ LINE OA ผ่านการมอบหมาย (User ↔ LineAccountAssignment ↔ LineAccount)  
ไม่มี Organization / Membership — System Admin เห็นทุกบัญชี ส่วนผู้ใช้ทั่วไปเห็นเฉพาะ OA ที่ได้รับมอบหมาย

**เป้าหมาย production:** self-host ด้วย **PM2 + MariaDB + disk คงที่** (`storage/uploads`) — ไม่พึ่ง S3 หรือ multi-instance

## สารบัญ

- [Tech Stack](#tech-stack)
- [ความต้องการระบบ](#ความต้องการระบบ)
- [การติดตั้ง (Development)](#การติดตั้ง-development)
- [Environment Variables](#environment-variables)
- [สิทธิ์และการเข้าถึง](#สิทธิ์และการเข้าถึง)
- [ฟีเจอร์หลัก](#ฟีเจอร์หลัก)
- [Click Tracking & Webhook](#click-tracking--webhook)
- [Production (PM2)](#production-pm2)
- [Checklist ก่อนเปิดใช้งาน](#checklist-ก่อนเปิดใช้งาน)
- [คำสั่งที่ใช้บ่อย](#คำสั่งที่ใช้บ่อย)
- [หมายเหตุ Vercel](#หมายเหตุ-vercel)
- [License](#license)



## Tech Stack


| ส่วน                   | เทคโนโลยี                                                |
| ---------------------- | -------------------------------------------------------- |
| Framework              | Next.js 15 (App Router, Turbopack)                       |
| Language               | TypeScript (strict)                                      |
| UI                     | Tailwind CSS 4 + HeroUI                                  |
| Database               | Prisma ORM + MariaDB / MySQL (`@prisma/adapter-mariadb`) |
| Auth                   | NextAuth.js + LDAP / Active Directory                    |
| Validation / Charts    | Zod, Recharts                                            |
| Process manager (prod) | PM2 (`ecosystem.config.js`, `run.sh`)                    |




## ความต้องการระบบ

- **Node.js** — เวอร์ชันที่รองรับ Next.js 15 (แนะนำ LTS ปัจจุบัน)
- **MariaDB หรือ MySQL** — สำหรับ Prisma
- **LDAP / Active Directory** — ใช้ล็อกอินเท่านั้น (ไม่มี local password login)
- **PM2** — สำหรับ production (แนะนำ)
- **พอร์ต** — แอปรันที่ `3000` (ตั้งใน `ecosystem.config.js`)
- **Disk** — โฟลเดอร์ `storage/uploads` ต้องมีและ writable โดย user ที่รันโปรเซส  
URL สาธารณะของรูปยังเป็น `/uploads/...` แต่ไฟล์จริงอยู่ที่ `storage/uploads/` (มี fallback อ่าน `public/uploads/` สำหรับของเก่า)



## การติดตั้ง (Development)



### 1. ติดตั้ง dependencies

```bash
npm install
```



### 2. ตั้งค่า Environment

คัดลอก `.env.example` เป็น `.env` แล้วกรอกค่าจริง (ดูรายละเอียดใน [Environment Variables](#environment-variables))

```bash
cp .env.example .env
```



### 3. เตรียม Database

```bash
npx prisma generate
npx prisma migrate dev
```



### 4. รัน Dev Server

```bash
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000) แล้วเข้าสู่ระบบที่ `/login` ด้วยบัญชี LDAP

**หลัง login ครั้งแรก:** ระบบสร้าง User ในฐานข้อมูลอัตโนมัติ แต่ต้องรอ System Admin อนุมัติที่หน้า **จัดการผู้ใช้** ก่อนเข้าใช้งานได้  
ระหว่างรอจะถูกส่งไปที่ `/pending-approval`

## Environment Variables

อ้างอิงไฟล์ `.env.example` ใน root ของโปรเจกต์

### Required


| ตัวแปร               | ความหมาย                                                                                                  |
| -------------------- | --------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`       | `mysql://user:pass@host:port/dbname`                                                                      |
| `NEXTAUTH_SECRET`    | JWT signing secret (ยาวสุ่ม ≥ 32 ตัวอักษ) — **ไม่มี fallback**                                            |
| `NEXTAUTH_URL`       | URL เต็มของแอปที่ผู้ใช้ / LINE เข้าถึง (เช่น `http://localhost:3000` หรือ `https://richmenu.example.com`) |
| `LDAP_URL`           | LDAP server (`ldap://` หรือแนะนำ `ldaps://`)                                                              |
| `LDAP_BASE_DN`       | Base DN สำหรับค้นหาผู้ใช้                                                                                 |
| `LDAP_BIND_DN`       | DN ของ service account                                                                                    |
| `LDAP_BIND_PASSWORD` | รหัสผ่าน service account                                                                                  |




### แนะนำสำหรับ production


| ตัวแปร                              | ความหมาย                                                                                                           |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `CREDENTIALS_ENCRYPTION_KEY`        | คีย์แยกสำหรับเข้ารหัส `channelSecret` / `accessToken` ในฐานข้อมูล — ถ้าไม่ตั้งจะใช้ `NEXTAUTH_SECRET` แทน (ควรแยก) |
| `DATABASE_SSL` / `sslaccept=strict` | เปิด SSL กับ DB ตามนโยบาย IT — ใส่ `?sslaccept=strict` ใน `DATABASE_URL` หรือตั้ง `DATABASE_SSL=true`              |




### Optional — LDAP tuning


| ตัวแปร                 | ความหมาย                                                    |
| ---------------------- | ----------------------------------------------------------- |
| `LDAP_SEARCH_FILTER`   | ฟิลเตอร์ค้นหา (default ตามโค้ด / ตัวอย่างใน `.env.example`) |
| `LDAP_USER_OU`         | OU ของผู้ใช้ (ถ้าใช้)                                       |
| `LDAP_USER_DOMAIN`     | Domain ของผู้ใช้ (ถ้าใช้)                                   |
| `LDAP_TIMEOUT`         | Timeout (ms)                                                |
| `LDAP_CONNECT_TIMEOUT` | Connect timeout (ms)                                        |
| `LDAP_IDLE_TIMEOUT`    | Idle timeout (ms)                                           |
| `LDAP_RECONNECT`       | เปิด reconnect                                              |




### Optional — LINE Login (เชื่อมบัญชีในหน้าโปรไฟล์)

ใช้สำหรับ **account linking** ไม่ใช่การล็อกอินหลัก


| ตัวแปร                      | ความหมาย                                             |
| --------------------------- | ---------------------------------------------------- |
| `LINE_LOGIN_CHANNEL_ID`     | LINE Login channel ID                                |
| `LINE_LOGIN_CHANNEL_SECRET` | LINE Login channel secret                            |
| `LINE_LOGIN_CALLBACK_URL`   | เช่น `https://your-domain/api/line/connect/callback` |


ตัวอย่าง `.env` ขั้นต่ำ:

```env
DATABASE_URL="mysql://user:pass@host:port/dbname"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-at-least-32-chars"
CREDENTIALS_ENCRYPTION_KEY="another-long-random-string"
LDAP_URL="ldaps://your-dc.example.local"
LDAP_BASE_DN="DC=example,DC=local"
LDAP_BIND_DN="CN=svc-account,OU=Service Accounts,DC=example,DC=local"
LDAP_BIND_PASSWORD="..."
```



## สิทธิ์และการเข้าถึง


| บทบาท                          | สิทธิ์                                                                                  |
| ------------------------------ | --------------------------------------------------------------------------------------- |
| **ผู้ใช้ที่ยังไม่อนุมัติ**     | ล็อกอินได้ แต่เข้าได้แค่ `/pending-approval`                                            |
| **ผู้ใช้ทั่วไป (อนุมัติแล้ว)** | เห็น / จัดการเฉพาะ LINE OA ที่ถูกมอบหมาย; ใช้ Dashboard, Rich Menus, Import, Profile    |
| **System Admin**               | เห็นทุก OA; อนุมัติผู้ใช้ / ตั้ง System Admin ที่ `/users`; เข้า Deploy Logs ได้จากเมนู |


หน้า `/users` ถูกกันที่ middleware สำหรับ System Admin เท่านั้น  
การมอบหมาย LINE OA ให้ผู้ใช้ทำผ่านหน้าจัดการผู้ใช้ / LINE Accounts (ตาม UI ที่มี)

Session ใช้ JWT อายุสูงสุด 8 ชั่วโมง — ค่า `isSystemAdmin` / `isApproved` ถูกดึงจาก DB ใหม่ใน `jwt()` callback

## ฟีเจอร์หลัก

- **LDAP Login** — เข้าสู่ระบบผ่าน Active Directory; ผู้ใช้ใหม่รออนุมัติก่อนใช้งาน
- **Dashboard** — สรุปจำนวน LINE Accounts, Rich Menus และสถิติการคลิก
- **LINE Accounts** — เพิ่ม / แก้ไข OA (Channel ID, Secret, Access Token) พร้อมตรวจ credentials; `channelId` ต้องไม่ซ้ำ
- **Rich Menus** — รายการ Rich Menu ต่อบัญชี LINE OA (สถานะ, thumbnail, ตั้งเป็น default)
- **Import** — อัปโหลด `richmenu.json` + รูปจาก LINE Bot Designer  
เก็บไฟล์ที่ `storage/uploads/richmenus/{lineAccountId}/...` เสิร์ฟผ่าน `/uploads/...`
- **Rich Menu Editor** — แก้ไขขนาด / areas / action แล้ว Deploy ไป LINE  
Action ที่รองรับใน schema: `uri`, `message`, `postback`, `richmenuswitch`, `location`  
(บาง action อาจยังไม่มีครบในฟอร์ม UI — ดู `docs/line-action-gap-analysis.md`)
- **Deploy** — สร้างเมนูบน LINE, อัปโหลดรูป, alias, ตั้ง default, sync ผู้ติดตาม (best-effort ตามประเภท OA)
- **Deploy Logs** — ประวัติการ deploy
- **จัดการผู้ใช้** — อนุมัติ / ตั้ง System Admin / มอบหมาย OA (System Admin)
- **โปรไฟล์** — แก้ไขข้อมูลโปรไฟล์ และเชื่อม / ยกเลิกเชื่อมบัญชี LINE Login (ถ้าตั้งค่า env ไว้)



## Click Tracking & Webhook

ใน LINE Developers Console ตั้ง Webhook URL เป็น:

```text
https://your-domain.com/api/webhook/line/{channelId}
```

แทน `{channelId}` ด้วย Channel ID ของ Messaging API ของ OA นั้น

ระบบจะ:

1. ตรวจ `x-line-signature` (HMAC-SHA256) ด้วย channel secret
2. อ่าน event ประเภท **postback** ที่ `data` เป็นรูปแบบ `rpp:{richMenuId}:{areaIndex}`
3. บันทึก `ClickEvent` (แสดงใน Dashboard)

ตอน Deploy ค่า **URI** actions จะถูก wrap ด้วย redirect URL ของระบบเพื่อติดตามการคลิกผ่าน `/api/rich-menus/redirect`

## Production (PM2)

เป้าหมายหลักของการ deploy คือเครื่องใน รพ. ที่ disk คงที่

### วิธีเร็ว — `run.sh`

สคริปต์จะ: `npm ci` → `prisma migrate deploy` → `npm run build` → start/reload PM2

```bash
chmod +x run.sh
./run.sh
```



### จัดการเอง

```bash
npm ci
npx prisma migrate deploy
npm run build
pm2 start ecosystem.config.js
# อัปเดตภายหลัง:
pm2 reload ecosystem.config.js --update-env
pm2 save
```



### ข้อกำหนดสำคัญ


| หัวข้อ            | รายละเอียด                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| **instances**     | ตั้งเป็น `1` (`fork`) ใน `ecosystem.config.js` — **ห้าม cluster** จนกว่า uploads จะแชร์ข้าม process ได้ |
| **พอร์ต**         | `3000` (env ใน ecosystem)                                                                               |
| **Uploads**       | สร้างและให้สิทธิ์เขียน `storage/uploads` แก่ user ที่รัน PM2                                            |
| **NEXTAUTH_URL**  | ต้องเป็น URL จริงที่ผู้ใช้และ LINE เรียกถึง (รวม scheme)                                                |
| **LDAP**          | ใช้ `ldaps://` หรือ tunnel ที่เข้ารหัส ถ้าสายไม่น่าเชื่อถือ                                             |
| **Reverse proxy** | แนะนำ nginx (หรือเทียบเท่า) → `localhost:3000` + HTTPS                                                  |
| **Webhook**       | ชี้ไป `https://<host>/api/webhook/line/{channelId}`                                                     |
| **Backup**        | MariaDB dump ตามตารางเวลา + สำรองโฟลเดอร์ `storage/uploads`                                             |




### ลำดับเปิดเครื่องครั้งแรก (สรุป)

1. ตั้ง `.env` ครบ + สร้าง `storage/uploads`
2. `./run.sh` หรือ migrate + build + PM2
3. ตั้ง System Admin คนแรก / อนุมัติผู้ใช้ / มอบหมาย OA
4. ตั้ง webhook ใน LINE Developers
5. Smoke test: Import → Deploy → เปิดแชทดูเมนู → ตรวจคลิกใน Dashboard



## Checklist ก่อนเปิดใช้งาน

ใช้ตอนขึ้นเครื่อง รพ. / pilot

- [ ] รัน `npx prisma migrate deploy` (รวม unique `channelId`)
- [ ] ตั้ง `.env` ครบ: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, LDAP_*
- [ ] ตั้ง `CREDENTIALS_ENCRYPTION_KEY` แยกจาก `NEXTAUTH_SECRET`
- [ ] ใช้ `ldaps://` (หรือ tunnel ที่เข้ารหัส) ถ้าสายไม่น่าเชื่อถือ
- [ ] `NEXTAUTH_URL` = URL จริงที่ผู้ใช้ / LINE เข้าถึง
- [ ] DB SSL ตามนโยบาย IT (`DATABASE_SSL` / `sslaccept=strict`)
- [ ] `storage/uploads` มีอยู่และ writable โดย user ที่รัน PM2
- [ ] เปิดด้วย `./run.sh` หรือ PM2 — **instances: 1**
- [ ] ตั้ง webhook LINE → `https://<host>/api/webhook/line/{channelId}`
- [ ] Reverse proxy → port 3000 + HTTPS ตามต้องการ
- [ ] System Admin คนแรก + อนุมัติผู้ใช้ + มอบหมาย OA
- [ ] Backup schedule: MariaDB dump + โฟลเดอร์ `storage/uploads`
- [ ] Smoke test: import → deploy → เปิดแชทดูเมนู + คลิก tracking

รายการค้าง / hardening เพิ่มเติมดูที่ `[docs/สิ่งที่ต้องแก้ไข.md](./docs/สิ่งที่ต้องแก้ไข.md)`

## คำสั่งที่ใช้บ่อย

```bash
npm run dev              # Dev server (Turbopack)
npm run build            # prisma generate + next build
npm run start            # Production server (โดยตรง; prod แนะนำ PM2)
npm run lint             # ESLint + auto-fix
npm run check:security   # Self-check ด้าน security
npx prisma generate      # สร้าง Prisma Client
npx prisma migrate dev   # Migration ตอนพัฒนา
npx prisma migrate deploy
npx prisma studio        # เปิด DB browser
./run.sh                 # Install + migrate + build + PM2
```



## หมายเหตุ Vercel

รองรับเป็นทางเลือก แต่**ไม่ใช่เป้าหมายหลัก**ของโปรเจกต์นี้:

1. ตั้ง Environment Variables ให้ครบ
2. Build Command: `npm run build` (`prisma generate` อยู่ใน `postinstall` และก่อน `next build`)
3. หลัง deploy / เมื่อมี migration ใหม่: รัน `npx prisma migrate deploy`
4. รูปใน `storage/uploads` **ไม่คงอยู่ข้าม instance** บน serverless — ต้องมี external storage ถ้าจะใช้จริงบน Vercel



## License

MIT