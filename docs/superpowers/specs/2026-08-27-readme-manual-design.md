# Design: README คู่มือติดตั้ง + ใช้งาน

**วันที่:** 2026-08-27  
**สถานะ:** approved (chat)  
**ขอบเขต:** แก้เฉพาะ `README.md` — ไม่แยกไฟล์ docs เพิ่ม

## เป้าหมาย

คู่มือภาษาไทย step-by-step สำหรับ (1) IT ติดตั้ง/ขึ้น production และ (2) ผู้ใช้/System Admin ใช้งานระบบ

## โครง (approach 3)

1. บทนำ + สารบัญ  
2. ความต้องการระบบ  
3. **ส่วน A — ติดตั้ง:** Dev → Env → Production PM2 → Checklist → อัปเดตเวอร์ชัน  
4. **ส่วน B — ใช้งาน:** บทบาท → Login → Admin ตั้งค่า → Rich Menu → Auto-response → โปรไฟล์ → Webhook  
5. **ส่วน C — อ้างอิง:** Tech stack, คำสั่ง, Vercel, ลิงก์ docs ค้าง, License  

## นอกขอบเขต

Screenshot จำนวนมาก, nginx ครบสูตร, hardening P1

## Self-review

- ไม่มี placeholder TBD  
- ไม่ใส่ secret จริงจาก `.env`  
- สอดคล้อง UI ปัจจุบัน (auto-response ที่หน้า OA, builder ที่ `/rules/new` และ `/rules/[id]`)  
- System Admin คนแรก: ตั้งผ่าน Prisma Studio / SQL (ไม่มี bootstrap UI)
