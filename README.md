# ระบบจัดการ Rich Menu LINE OA

เว็บแอปสำหรับจัดการ **Rich Menu** และ **ตอบกลับอัตโนมัติ (keyword)** ของ LINE Official Accounts หลายบัญชีในระบบเดียว  
รองรับการ Import จาก LINE Bot Designer และการแก้ไข / Deploy ผ่าน Editor

พัฒนาสำหรับ**โรงพยาบาลราชพิพัฒน์ — ฝ่ายวิชาการและแผนงาน**

| หัวข้อ | รายละเอียด |
| --- | --- |
| **ขอบเขตการเข้าถึง** | ผู้ใช้ถูกผูกกับ LINE OA ผ่านการมอบหมาย (`User` ↔ `LineAccountAssignment` ↔ `LineAccount`) — ไม่มี Organization / Membership |
| **System Admin** | เห็นทุก OA; อนุมัติผู้ใช้; มอบหมาย OA; เข้า Deploy Logs |
| **ผู้ใช้ทั่วไป** | เห็นเฉพาะ OA ที่ได้รับมอบหมาย |
| **Production** | Self-host ด้วย **PM2 + MariaDB + disk คงที่** (`storage/uploads`) — ไม่พึ่ง S3 หรือ multi-instance |

เอกสารออกแบบโครงคู่มือนี้: [`docs/superpowers/specs/2026-08-27-readme-manual-design.md`](./docs/superpowers/specs/2026-08-27-readme-manual-design.md)

---

## สารบัญ

### ส่วน A — คู่มือติดตั้ง (IT)

1. [ความต้องการระบบ](#ความต้องการระบบ)
2. [A1. ติดตั้ง Development](#a1-ติดตั้ง-development)
3. [A2. Environment Variables](#a2-environment-variables)
4. [A3. ติดตั้ง Production (เครื่อง รพ.)](#a3-ติดตั้ง-production-เครื่อง-รพ)
5. [A4. Checklist ก่อนเปิดใช้งาน](#a4-checklist-ก่อนเปิดใช้งาน)
6. [A5. อัปเดตเวอร์ชันภายหลัง](#a5-อัปเดตเวอร์ชันภายหลัง)

### ส่วน B — คู่มือใช้งาน

7. [B1. บทบาทและสิทธิ์](#b1-บทบาทและสิทธิ์)
8. [B2. เข้าสู่ระบบครั้งแรก](#b2-เข้าสู่ระบบครั้งแรก)
9. [B3. System Admin — ตั้งค่าเริ่มต้น](#b3-system-admin--ตั้งค่าเริ่มต้น)
10. [B4. จัดการ Rich Menu](#b4-จัดการ-rich-menu)
11. [B5. ตอบกลับอัตโนมัติ (Auto-response)](#b5-ตอบกลับอัตโนมัติ-auto-response)
12. [B6. โปรไฟล์](#b6-โปรไฟล์)
13. [B7. Click Tracking และ Webhook](#b7-click-tracking-และ-webhook)

### ส่วน C — อ้างอิง

14. [เปลี่ยนพอร์ต (PORT)](#เปลี่ยนพอร์ต-port)
15. [Tech Stack](#tech-stack)
16. [คำสั่งที่ใช้บ่อย](#คำสั่งที่ใช้บ่อย)
17. [หมายเหตุ Vercel](#หมายเหตุ-vercel)
18. [เอกสารเพิ่มเติม](#เอกสารเพิ่มเติม)
19. [License](#license)

---

## ความต้องการระบบ

| รายการ | รายละเอียด |
| --- | --- |
| **Node.js** | เวอร์ชันที่รองรับ Next.js 15 (แนะนำ LTS ปัจจุบัน เช่น 20 หรือ 22) |
| **MariaDB / MySQL** | สำหรับ Prisma |
| **LDAP / Active Directory** | ใช้ล็อกอินเท่านั้น — **ไม่มี** local password login |
| **PM2** | สำหรับ production (แนะนำ) |
| **พอร์ต** | ค่าเริ่มต้น `3007` — เปลี่ยนได้ด้วยตัวแปร `PORT` ใน `.env` (ดู [เปลี่ยนพอร์ต](#เปลี่ยนพอร์ต-port)) |
| **Disk** | โฟลเดอร์ `storage/uploads` ต้องมีและ writable โดย user ที่รันโปรเซส |

**หมายเหตุเรื่องไฟล์อัปโหลด:** URL สาธารณะยังเป็น `/uploads/...` แต่ไฟล์จริงอยู่ที่ `storage/uploads/` (มี fallback อ่าน `public/uploads/` สำหรับของเก่า)

---

# ส่วน A — คู่มือติดตั้ง (IT)

## A1. ติดตั้ง Development

ทำตามลำดับนี้บนเครื่องพัฒนา (Windows / macOS / Linux)

### ขั้นที่ 1 — ติดตั้งเครื่องมือพื้นฐาน

1. ติดตั้ง **Node.js** (LTS) และตรวจว่าใช้ได้:

```bash
node -v
npm -v
```

2. ติดตั้ง / เปิดบริการ **MariaDB หรือ MySQL** ให้รันอยู่
3. เตรียมการเข้าถึง **LDAP / AD** (หรือใช้ DC ขององค์กร) สำหรับทดสอบล็อกอิน

### ขั้นที่ 2 — ดึงโค้ดและติดตั้ง dependencies

```bash
git clone https://github.com/exthitikorn/rpp-richmenu.git
cd rpp-richmenu
npm install
```

`postinstall` จะรัน `prisma generate` ให้อัตโนมัติ

### ขั้นที่ 3 — สร้างฐานข้อมูล

ใน MariaDB/MySQL สร้าง database ว่าง (ชื่อตามที่ใส่ใน `DATABASE_URL`) เช่น:

```sql
CREATE DATABASE rpp_richmenu CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### ขั้นที่ 4 — ตั้งค่า Environment

```bash
cp .env.example .env
```

บน Windows (PowerShell):

```powershell
Copy-Item .env.example .env
```

เปิดไฟล์ `.env` แล้วกรอกค่าจริง — อย่างน้อยต้องมีตัวแปรในหมวด [Required](#required)  
ตัวอย่างขั้นต่ำดูที่ [ตัวอย่าง `.env`](#ตัวอย่าง-env-ขั้นต่ำ)

สร้าง secret สุ่ม (แนะนำ ≥ 32 ตัวอักษ) เช่น:

```bash
openssl rand -base64 32
```

### ขั้นที่ 5 — สร้างโฟลเดอร์อัปโหลด

```bash
mkdir -p storage/uploads
```

บน Windows (PowerShell):

```powershell
New-Item -ItemType Directory -Force -Path storage/uploads
```

### ขั้นที่ 6 — Migrate schema

```bash
npx prisma generate
npx prisma migrate dev
```

ถ้า Prisma ถามชื่อ migration ครั้งแรก ให้ใส่ชื่อเช่น `init` แล้ว Enter

### ขั้นที่ 7 — รัน Dev Server

```bash
npm run dev
```

เปิด [http://localhost:3007](http://localhost:3007) แล้วไปที่ `/login`

### ขั้นที่ 8 — ผู้ใช้คนแรก (System Admin)

หลัง login ด้วย LDAP สำเร็จ ระบบจะสร้าง User ใน DB อัตโนมัติ แต่สถานะเริ่มต้นคือ **ยังไม่อนุมัติ** และ **ยังไม่ใช่ System Admin**

ตั้งค่าคนแรกด้วย Prisma Studio หรือ SQL:

```bash
npx prisma studio
```

ในตาราง `User` ของบัญชีของคุณ ตั้ง:

- `isApproved` = `true`
- `isSystemAdmin` = `true`

หรือรัน SQL (แทนที่ username ให้ตรง):

```sql
UPDATE User
SET isApproved = true, isSystemAdmin = true
WHERE ldapUsername = 'your-ldap-username';
```

จากนั้นออกจากระบบแล้วล็อกอินใหม่ (หรือรอให้ session รีเฟรช) แล้วเข้า `/users` ได้

---

## A2. Environment Variables

อ้างอิงไฟล์ `.env.example` ใน root ของโปรเจกต์

### Required

| ตัวแปร | ความหมาย |
| --- | --- |
| `DATABASE_URL` | `mysql://user:pass@host:port/dbname` |
| `NEXTAUTH_SECRET` | JWT signing secret (ยาวสุ่ม ≥ 32 ตัวอักษ) — **ไม่มี fallback** |
| `NEXTAUTH_URL` | URL เต็มของแอปที่ผู้ใช้ / LINE เข้าถึง (เช่น `http://localhost:3007` หรือ `https://richmenu.example.com`) — **ต้องตรงกับ URL จริง รวมพอร์ตถ้าเปิดตรงไม่ผ่าน proxy** |
| `LDAP_URL` | LDAP server (`ldap://` หรือแนะนำ `ldaps://`) |
| `LDAP_BASE_DN` | Base DN สำหรับค้นหาผู้ใช้ |
| `LDAP_BIND_DN` | DN หรือ UPN ของ service account |
| `LDAP_BIND_PASSWORD` | รหัสผ่าน service account |

### แนะนำสำหรับ production

| ตัวแปร | ความหมาย |
| --- | --- |
| `PORT` | พอร์ตที่แอปฟัง (ค่าเริ่มต้น `3007`) — **ตั้งใน `.env` อย่างเดียว** ไม่ต้องแก้ `ecosystem.config.js` — ดู [เปลี่ยนพอร์ต](#เปลี่ยนพอร์ต-port) |
| `CREDENTIALS_ENCRYPTION_KEY` | คีย์แยกสำหรับเข้ารหัส `channelSecret` / `accessToken` ในฐานข้อมูล — ถ้าไม่ตั้งจะใช้ `NEXTAUTH_SECRET` แทน (ควรแยก) |
| `DATABASE_SSL` / `sslaccept=strict` | เปิด SSL กับ DB ตามนโยบาย IT — ใส่ `?sslaccept=strict` ใน `DATABASE_URL` หรือตั้ง `DATABASE_SSL=true` |

### Optional — LDAP tuning

| ตัวแปร | ความหมาย |
| --- | --- |
| `LDAP_SEARCH_FILTER` | ฟิลเตอร์ค้นหา (default ตามโค้ด / ตัวอย่างใน `.env`) |
| `LDAP_USER_OU` | OU ของผู้ใช้ (ถ้าใช้) |
| `LDAP_USER_DOMAIN` | Domain ของผู้ใช้ (ถ้าใช้) |
| `LDAP_TIMEOUT` | Timeout (ms) |
| `LDAP_CONNECT_TIMEOUT` | Connect timeout (ms) |
| `LDAP_IDLE_TIMEOUT` | Idle timeout (ms) |
| `LDAP_RECONNECT` | เปิด reconnect |

### Optional — LINE Login (เชื่อมบัญชีในหน้าโปรไฟล์)

ใช้สำหรับ **account linking** ไม่ใช่การล็อกอินหลัก

| ตัวแปร | ความหมาย |
| --- | --- |
| `LINE_LOGIN_CHANNEL_ID` | LINE Login channel ID |
| `LINE_LOGIN_CHANNEL_SECRET` | LINE Login channel secret |
| `LINE_LOGIN_CALLBACK_URL` | เช่น `https://your-domain/api/line/connect/callback` |

### ตัวอย่าง `.env` ขั้นต่ำ

```env
DATABASE_URL="mysql://user:pass@127.0.0.1:3306/rpp_richmenu"
PORT=3007
NEXTAUTH_URL="http://localhost:3007"
NEXTAUTH_SECRET="your-secret-at-least-32-chars"
CREDENTIALS_ENCRYPTION_KEY="another-long-random-string"
LDAP_URL="ldaps://your-dc.example.local"
LDAP_BASE_DN="DC=example,DC=local"
LDAP_BIND_DN="CN=svc-account,OU=Service Accounts,DC=example,DC=local"
LDAP_BIND_PASSWORD="..."
```

---

## เปลี่ยนพอร์ต (PORT)

ค่าเริ่มต้นคือ **3007**  
**แก้ที่เดียวใน `.env`** — ไม่ต้องแก้ `ecosystem.config.js`  
Next.js (`npm run dev` / `next start` ผ่าน PM2) โหลด `PORT` จาก `.env` เอง

ให้ `PORT` กับ `NEXTAUTH_URL` สอดคล้องกัน (และ reverse proxy ถ้ามี)

### ขั้นตอน

1. แก้ `.env`:

```env
PORT=8080
NEXTAUTH_URL="http://localhost:8080"
```

ถ้ามี reverse proxy (HTTPS หน้าบ้าน → แอปภายใน):

```env
PORT=8080
NEXTAUTH_URL="https://richmenu.example.com"
```

`NEXTAUTH_URL` คือ URL ที่ผู้ใช้ / LINE เห็นจากภายนอก — ไม่ต้องมี `:8080` ถ้า proxy ซ่อนพอร์ตภายในไว้

2. รีสตาร์ทแอป

```bash
# Development
npm run dev

# Production
./run.sh
# หรือ
pm2 reload ecosystem.config.js --update-env
```

3. เปิดเบราว์เซอร์ที่ URL ตาม `NEXTAUTH_URL`  
   ถ้าใช้ nginx ให้ `proxy_pass` ไป `http://127.0.0.1:8080` (พอร์ตเดียวกับ `PORT`)

### (ทางเลือก) ระบุพอร์ตครั้งเดียวโดยไม่แก้ `.env`

```bash
# macOS / Linux
PORT=8080 npm run dev

# Windows PowerShell
$env:PORT=8080; npm run dev
```

อย่าลืมให้ `NEXTAUTH_URL` ตรงกับพอร์ตนั้นด้วย มิฉะนั้น login / callback อาจพัง

### สิ่งที่ต้องเช็กหลังเปลี่ยนพอร์ต

| รายการ | ทำอะไร |
| --- | --- |
| `.env` → `PORT` | พอร์ตที่ process ฟัง (แหล่งตั้งค่าหลัก) |
| `.env` → `NEXTAUTH_URL` | URL ที่ผู้ใช้เปิด (รวมพอร์ตถ้าเข้าตรง) |
| `ecosystem.config.js` | **ไม่ต้องแก้** |
| Firewall / รพ. | เปิดพอร์ตนั้นถ้าเข้าถึงจากเครื่องอื่นโดยไม่ผ่าน proxy |
| Reverse proxy | ชี้ไป `127.0.0.1:$PORT` |
| LINE Webhook / LINE Login callback | ใช้ host ตาม `NEXTAUTH_URL` |

---

## A3. ติดตั้ง Production (เครื่อง รพ.)

เป้าหมาย: เครื่องใน รพ. ที่ disk คงที่ รันด้วย PM2 (พอร์ตเริ่มต้น `3007` — เปลี่ยนได้ด้วย `PORT` ใน `.env`)

### ขั้นที่ 1 — เตรียมเครื่อง

1. ติดตั้ง Node.js (LTS), MariaDB/MySQL, Git, PM2:

```bash
npm install -g pm2
```

2. สร้าง database สำหรับ production
3. เตรียม LDAP ที่แอปเข้าถึงได้จากเครื่องนี้
4. (แนะนำ) เตรียม reverse proxy + HTTPS ชี้ไป `localhost:3007`

### ขั้นที่ 2 — วางโค้ดและตั้งค่า

```bash
git clone https://github.com/exthitikorn/rpp-richmenu.git
cd rpp-richmenu
cp .env.example .env
# แก้ไข .env ให้เป็นค่า production
```

จุดสำคัญใน `.env` production:

- `PORT` = พอร์ตที่แอปฟัง ใน `.env` (ค่าเริ่มต้น `3007` ถ้าไม่ใส่) — **ไม่ต้องแก้** `ecosystem.config.js`
- `NEXTAUTH_URL` = URL จริงที่ผู้ใช้และ LINE เรียกถึง (รวม `https://`) — ถ้าเข้าแอปตรงโดยไม่ผ่าน proxy ต้องใส่พอร์ตให้ตรงกับ `PORT`
- `CREDENTIALS_ENCRYPTION_KEY` แยกจาก `NEXTAUTH_SECRET`
- ใช้ `ldaps://` (หรือ tunnel ที่เข้ารหัส) ถ้าสายไม่น่าเชื่อถือ
- ตั้ง DB SSL ตามนโยบาย IT ถ้าจำเป็น

### ขั้นที่ 3 — สร้างโฟลเดอร์อัปโหลด

```bash
mkdir -p storage/uploads
# ให้สิทธิ์เขียนแก่ user ที่จะรัน PM2
```

### ขั้นที่ 4 — Install / Migrate / Build / Start

**วิธีเร็ว (แนะนำ)** — สคริปต์จะทำ: `npm ci` → `prisma migrate deploy` → `npm run build` → start/reload PM2

```bash
chmod +x run.sh
./run.sh
```

**หรือทำทีละขั้น:**

```bash
npm ci
npx prisma migrate deploy
npm run build
pm2 start ecosystem.config.js
pm2 save
```

ตรวจสถานะ:

```bash
pm2 status
pm2 logs rpp-richmenu
```

แอปควรฟังที่พอร์ตตาม `PORT` ใน `.env` (ค่าเริ่มต้น **3007**) — `instances: 1`, โหมด `fork` (**ห้าม cluster** จนกว่า uploads จะแชร์ข้าม process ได้)

### ขั้นที่ 5 — Reverse proxy (แนะนำ)

ตั้ง nginx (หรือเทียบเท่า) ให้:

- รับ HTTPS จากภายนอก
- proxy ไป `http://127.0.0.1:$PORT` (เช่น `3007` หรือพอร์ตที่ตั้งใน `.env`)
- ส่ง header ที่จำเป็นสำหรับ Next.js / WebSocket ตามมาตรฐาน reverse proxy

จากนั้นให้ `NEXTAUTH_URL` ตรงกับ URL สาธารณะ (เช่น `https://richmenu.rpphosp.local`)

รายละเอียดการเปลี่ยนพอร์ต: [เปลี่ยนพอร์ต (PORT)](#เปลี่ยนพอร์ต-port)

### ขั้นที่ 6 — ตั้ง Webhook ใน LINE Developers

สำหรับแต่ละ Messaging API channel:

```text
https://your-domain.com/api/webhook/line/{channelId}
```

แทน `{channelId}` ด้วย Channel ID จริงของ OA นั้น  
(ในหน้าบัญชี LINE ของแอปมีปุ่มคัดลอก webhook URL ให้)

เปิด **Use webhook** และปิดการตอบอัตโนมัติของ LINE OA ที่ขัดกับระบบนี้ถ้าต้องการให้แอปเป็นตัวตอบ

### ขั้นที่ 7 — System Admin คนแรก + อนุมัติผู้ใช้

1. ให้ผู้ใช้ที่ต้องการเป็น admin ล็อกอินครั้งหนึ่ง (สร้างแถวใน `User`)
2. ตั้ง `isApproved` + `isSystemAdmin` ตาม [ขั้นที่ 8 ของ Dev](#ขั้นที่-8--ผู้ใช้คนแรก-system-admin)
3. เข้าเมนู **จัดการผู้ใช้** → อนุมัติผู้ใช้อื่น → มอบหมาย LINE OA
4. เพิ่ม / ตรวจ LINE Account (Channel ID, Secret, Access Token)

### ขั้นที่ 8 — Smoke test

1. Import Rich Menu จาก LINE Bot Designer
2. Deploy ไปยัง OA
3. เปิดแชท LINE ดูว่าเมนูขึ้น
4. คลิกพื้นที่เมนู → ตรวจสถิติใน **แดชบอร์ด**
5. (ถ้าใช้) ทดสอบตอบกลับอัตโนมัติด้วย keyword

### ข้อกำหนดสำคัญ (Production)

| หัวข้อ | รายละเอียด |
| --- | --- |
| **instances** | `1` (`fork`) ใน `ecosystem.config.js` |
| **พอร์ต** | ค่าเริ่มต้น `3007` — ตั้งด้วย `PORT` ใน `.env` |
| **Uploads** | `storage/uploads` writable โดย user ที่รัน PM2 |
| **NEXTAUTH_URL** | URL จริง รวม scheme |
| **LDAP** | `ldaps://` หรือ tunnel ที่เข้ารหัสเมื่อสายไม่น่าเชื่อถือ |
| **Backup** | MariaDB dump ตามตารางเวลา + สำรองโฟลเดอร์ `storage/uploads` |

---

## A4. Checklist ก่อนเปิดใช้งาน

ใช้ตอนขึ้นเครื่อง รพ. / pilot

- [ ] รัน `npx prisma migrate deploy` (รวม unique `channelId`)
- [ ] ตั้ง `.env` ครบ: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, LDAP\_\*
- [ ] ตั้ง `CREDENTIALS_ENCRYPTION_KEY` แยกจาก `NEXTAUTH_SECRET`
- [ ] ใช้ `ldaps://` (หรือ tunnel ที่เข้ารหัส) ถ้าสายไม่น่าเชื่อถือ
- [ ] `NEXTAUTH_URL` = URL จริงที่ผู้ใช้ / LINE เข้าถึง
- [ ] DB SSL ตามนโยบาย IT (`DATABASE_SSL` / `sslaccept=strict`)
- [ ] `storage/uploads` มีอยู่และ writable โดย user ที่รัน PM2
- [ ] เปิดด้วย `./run.sh` หรือ PM2 — **instances: 1**
- [ ] ตั้ง webhook LINE → `https://<host>/api/webhook/line/{channelId}`
- [ ] Reverse proxy → พอร์ตตาม `PORT` + HTTPS ตามต้องการ
- [ ] System Admin คนแรก + อนุมัติผู้ใช้ + มอบหมาย OA
- [ ] Backup schedule: MariaDB dump + โฟลเดอร์ `storage/uploads`
- [ ] Smoke test: import → deploy → เปิดแชทดูเมนู + คลิก tracking

รายการค้าง / hardening เพิ่มเติม: [`docs/สิ่งที่ต้องแก้ไข.md`](./docs/สิ่งที่ต้องแก้ไข.md)

---

## A5. อัปเดตเวอร์ชันภายหลัง

บนเครื่อง production:

```bash
cd /path/to/rpp-richmenu
git pull
./run.sh
```

หรือทีละขั้น:

```bash
git pull
npm ci
npx prisma migrate deploy
npm run build
pm2 reload ecosystem.config.js --update-env
pm2 save
```

ตรวจ `pm2 logs rpp-richmenu` หลัง reload

---

# ส่วน B — คู่มือใช้งาน

## B1. บทบาทและสิทธิ์

| บทบาท | สิทธิ์ |
| --- | --- |
| **ยังไม่อนุมัติ** | ล็อกอินได้ แต่เข้าได้แค่ `/pending-approval` |
| **ผู้ใช้ทั่วไป (อนุมัติแล้ว)** | เห็น / จัดการเฉพาะ LINE OA ที่ถูกมอบหมาย — แดชบอร์ด, Rich Menus, Import, Auto-response, โปรไฟล์ |
| **System Admin** | เห็นทุก OA; อนุมัติผู้ใช้ / ตั้ง System Admin / มอบหมาย OA ที่ **จัดการผู้ใช้**; เข้า **บันทึกการ Deploy** ได้จากเมนู |

Session ใช้ JWT อายุสูงสุด **8 ชั่วโมง** — ค่า `isSystemAdmin` / `isApproved` ถูกดึงจาก DB ใหม่ใน `jwt()` callback

---

## B2. เข้าสู่ระบบครั้งแรก

1. เปิด URL ของระบบ → ไปที่หน้า **เข้าสู่ระบบ** (`/login`)
2. ใส่บัญชี / รหัสผ่าน **LDAP (Active Directory)** ขององค์กร
3. ถ้ายังไม่เคยถูกอนุมัติ ระบบจะพาไป `/pending-approval` — รอ System Admin อนุมัติที่เมนู **จัดการผู้ใช้**
4. หลังอนุมัติแล้ว ล็อกอินใหม่ (หรือรีเฟรช) เพื่อเข้าแดชบอร์ด

> ผู้ใช้ใหม่ถูกสร้างในฐานข้อมูลอัตโนมัติตอนล็อกอินครั้งแรก แต่ยังใช้เมนูหลักไม่ได้จนกว่าจะถูกอนุมัติ และต้องถูกมอบหมาย OA อย่างน้อยหนึ่งบัญชี (ยกเว้น System Admin)

---

## B3. System Admin — ตั้งค่าเริ่มต้น

ทำตามลำดับนี้หลังติดตั้งครั้งแรก

### ขั้นที่ 1 — อนุมัติผู้ใช้

1. เข้าเมนู **จัดการผู้ใช้** (`/users`)
2. หาผู้ใช้ที่รออนุมัติ
3. เปิดสวิตช์อนุมัติ (`isApproved`)
4. (ถ้าต้องการ) ตั้งเป็น System Admin ด้วยสวิตช์ที่เกี่ยวข้อง

### ขั้นที่ 2 — เพิ่มบัญชี LINE Official Account

1. เข้าเมนู **บัญชี LINE Official Account** (`/line-accounts`)
2. เพิ่มบัญชีใหม่ โดยกรอกอย่างน้อย:
   - ชื่อที่แสดง
   - **Channel ID** (ต้องไม่ซ้ำในระบบ)
   - **Channel Secret**
   - **Channel Access Token**
3. บันทึก — ระบบจะตรวจ credentials กับ LINE API

ค่าเหล่านี้ได้จาก [LINE Developers Console](https://developers.line.biz/) → Channel ประเภท Messaging API

### ขั้นที่ 3 — มอบหมาย OA ให้ผู้ใช้

1. ที่ **จัดการผู้ใช้** กดปุ่มแก้ไขการมอบหมาย LINE OA ของผู้ใช้นั้น
2. เลือก OA ที่ต้องการให้เห็น / จัดการ
3. บันทึก

ผู้ใช้ทั่วไปจะเห็นเฉพาะ OA ที่ถูกติ๊ก

### ขั้นที่ 4 — ตั้ง Webhook ของ OA

1. เปิดหน้ารายละเอียด OA
2. ใช้ปุ่มคัดลอก **Webhook URL**
3. วางใน LINE Developers Console ของ channel นั้น
4. Verify / เปิดใช้ webhook

---

## B4. จัดการ Rich Menu

### นำเข้าจาก LINE Bot Designer (Import)

1. ใน LINE Bot Designer สร้าง Rich Menu แล้ว export เป็นไฟล์ JSON + รูปภาพ
2. ในแอป เข้าเมนู **นำเข้า Rich Menu** (`/import`) หรือจากหน้ารายละเอียด OA กด **นำเข้า Rich Menu**
3. เลือก LINE OA ปลายทาง (ถ้ายังไม่ได้เลือก)
4. อัปโหลดไฟล์ JSON + รูป — ระบบตรวจขนาดรูปให้ตรงกับที่ประกาศใน JSON และจำกัดขนาดตามข้อกำหนด LINE
5. ไฟล์รูปถูกเก็บที่ `storage/uploads/richmenus/{lineAccountId}/...`

### แก้ไข Rich Menu

1. เข้า **Rich Menu** (`/rich-menus`) หรือเปิดจากหน้ารายละเอียด OA
2. เลือกเมนูที่ต้องการ → **แก้ไข**
3. ปรับขนาด / พื้นที่ (areas) / action ได้ตามที่ฟอร์มรองรับ  
   Action ใน schema: `uri`, `message`, `postback`, `richmenuswitch`, `location`  
   (บางประเภทอาจยังไม่มีครบใน UI — ดู [`docs/line-action-gap-analysis.md`](./docs/line-action-gap-analysis.md))
4. บันทึก

### Deploy ไปยัง LINE

1. จากรายการหรือหน้าแก้ไข กด **Deploy**
2. ระบบจะ: สร้างเมนูบน LINE → อัปโหลดรูป → ตั้ง alias → ตั้งเป็น default → พยายาม sync ผู้ติดตาม (best-effort ตามประเภท OA)
3. ดูผลได้ที่ **บันทึกการ Deploy** (`/deploy-logs`) และสถานะบนการ์ด Rich Menu

### ตรวจผลบนมือถือ / แชท

1. เปิดแชทกับ OA นั้นบน LINE
2. ตรวจว่า Rich Menu แสดงถูกต้อง
3. คลิกพื้นที่ที่มี URI / tracking → ดูสถิติใน **แดชบอร์ด**

---

## B5. ตอบกลับอัตโนมัติ (Auto-response)

ใช้เมื่อต้องการให้ OA ตอบข้อความตาม **keyword** อัตโนมัติผ่าน webhook ของระบบ

### เปิดใช้และตั้งค่าทั่วไป

1. เข้า **บัญชี LINE Official Account** → เลือก OA → กด **ตอบกลับอัตโนมัติ**
   - URL: `/line-accounts/{id}/auto-response`
2. เปิดสวิตช์เปิดใช้ตอบกลับอัตโนมัติ
3. (ถ้าต้องการ) ตั้งข้อความ fallback เมื่อไม่มี keyword ตรง
4. กดบันทึกการตั้งค่า
5. ตรวจว่า webhook ของ OA ชี้มาที่ระบบนี้แล้ว (ดู [B7](#b7-click-tracking-และ-webhook))

### สร้างกฎ keyword

1. ที่หน้ารายการกฎ กดสร้างกฎใหม่ → ไปที่ `/line-accounts/{id}/auto-response/rules/new`
2. ใส่คำ keyword ที่ต้องการจับ
3. เลือกประเภทการตอบ:
   - **ข้อความ (TEXT)** — พิมพ์ข้อความตอบ
   - **Flex (FLEX)** — วาง JSON จาก [Flex Message Simulator](https://developers.line.biz/flex-simulator/) หรือใช้โครงสร้างที่ระบบรองรับ
4. ดูตัวอย่างด้านพรีวิวแชท (ถ้ามี)
5. บันทึก

### แก้ไข / เปิด-ปิด / ลบกฎ

1. จากหน้ารายการกฎ กดแก้ไข → `/line-accounts/{id}/auto-response/rules/{ruleId}`
2. ใช้สวิตช์เปิด-ปิดกฎโดยไม่ต้องลบ
3. ลบกฎที่ไม่ใช้แล้วจากรายการ

> Flex ที่ใช้ key นอก allowlist (เช่น `header`, `styles` บางแบบ) หรือกล่องว่าง จะถูกปฏิเสธตอนบันทึก — แก้ JSON ให้ผ่าน validation หรือใช้โครงสร้างที่ builder รองรับ

---

## B6. โปรไฟล์

1. เข้าเมนู **โปรไฟล์** (`/profile`)
2. แก้ไขข้อมูลโปรไฟล์ตามที่มีในฟอร์ม
3. ถ้าตั้งค่า LINE Login ใน `.env` แล้ว สามารถ **เชื่อม / ยกเลิกเชื่อม** บัญชี LINE สำหรับ account linking ได้จากหน้านี้

---

## B7. Click Tracking และ Webhook

### Webhook URL

```text
https://your-domain.com/api/webhook/line/{channelId}
```

แทน `{channelId}` ด้วย Channel ID ของ Messaging API ของ OA นั้น

ระบบจะ:

1. ตรวจ `x-line-signature` (HMAC-SHA256) ด้วย channel secret
2. อ่าน event ที่เกี่ยวข้อง (เช่น postback สำหรับคลิกเมนู, ข้อความสำหรับ auto-response)
3. บันทึก `ClickEvent` จาก postback รูปแบบ `rpp:{richMenuId}:{areaIndex}` (แสดงในแดชบอร์ด)

ตอน Deploy ค่า **URI** actions จะถูก wrap ด้วย redirect URL ของระบบเพื่อติดตามการคลิกผ่าน `/api/rich-menus/redirect`

---

# ส่วน C — อ้างอิง

## Tech Stack

| ส่วน | เทคโนโลยี |
| --- | --- |
| Framework | Next.js 15 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| UI | Tailwind CSS 4 + HeroUI |
| Database | Prisma ORM + MariaDB / MySQL (`@prisma/adapter-mariadb`) |
| Auth | NextAuth.js + LDAP / Active Directory |
| Validation | Zod |
| Process manager (prod) | PM2 (`ecosystem.config.js`, `run.sh`) |

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

## เอกสารเพิ่มเติม

| เอกสาร | เนื้อหา |
| --- | --- |
| [`docs/สิ่งที่ต้องแก้ไข.md`](./docs/สิ่งที่ต้องแก้ไข.md) | Checklist production + hardening / gap ที่ยังค้าง |
| [`docs/line-action-gap-analysis.md`](./docs/line-action-gap-analysis.md) | LINE action ที่ยังขาดใน schema/UI |
| [`docs/project-review.md`](./docs/project-review.md) | รีวิวโปรเจกต์ (ถ้ามี) |

## License

MIT
