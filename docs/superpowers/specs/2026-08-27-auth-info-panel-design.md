# Design: Auth info panel (คำอธิบายหน้า login)

**วันที่:** 2026-08-27  
**สถานะ:** approved (chat)  
**ขอบเขต:** หน้า auth ที่ใช้ `AuthCard` — `/login` และ `/pending-approval`

## เป้าหมาย

เพิ่มแผงคำอธิบายด้านซ้ายแบบตัวอย่างระบบจัดการผู้ใช้งาน (ไอคอน + หัวข้อ + คำอธิบาย + รายการ “คุณสามารถ:” พร้อมติ๊กถูก) คู่กับการ์ดฟอร์มด้านขวา โดยคงพื้นหลังอ่อนและ Navbar ปัจจุบัน

## เลย์เอาต์

- Desktop: การ์ดขาว 2 ใบเรียงข้างกัน (ซ้าย = info, ขวา = form)
- Mobile: ซ้อนแนวตั้ง — info บน, form ล่าง
- พื้นหลัง / Navbar / พฤติกรรม login (LDAP, LINE, error) ไม่เปลี่ยน

## ข้อความแผงซ้าย (ใช้ชุดเดียวกันทั้งสองหน้า)

- **หัวข้อ:** ระบบจัดการ Rich Menu LINE OA
- **คำอธิบาย:** ระบบของโรงพยาบาลราชพิพัฒน์ สำหรับจัดการ Rich Menu และบัญชี LINE Official Account ที่ได้รับมอบหมาย
- **คุณสามารถ:**
  1. เข้าสู่ระบบด้วยบัญชีโรงพยาบาล (LDAP)
  2. จัดการ Rich Menu ของ LINE OA ที่ได้รับสิทธิ์
  3. Deploy Rich Menu ไปยัง LINE และติดตามสถานะ
  4. ดูสถิติการคลิก Rich Menu
  5. เชื่อมต่อบัญชี LINE เพื่อเข้าสู่ระบบด้วย LINE ได้ในภายหลัง

## คอมโพเนนต์

| ส่วน | การเปลี่ยนแปลง |
|---|---|
| `components/layouts/AuthInfoPanel.tsx` (ใหม่) | ไอคอนวงกลมสี primary + หัวข้อ + คำอธิบาย + รายการติ๊กถูก |
| `components/layouts/AuthCard.tsx` | เพิ่ม `aside?: ReactNode` — มี aside แล้วใช้ grid 2 คอลัมน์ (มือถือ 1 คอลัมน์) |
| `LoginForm` / `AwaitingApprovalMessage` | ส่ง `<AuthInfoPanel />` เป็น `aside` |

## นอกขอบเขต

- พื้นหลังเขียวเข้มแบบตัวอย่าง
- ย้ายโลโก้โรงพยาบาลเข้าการ์ดขวา
- เปลี่ยน Navbar
- หน้า auth อื่นนอกเหนือจากสองหน้าข้างต้น (ถ้ามีในอนาคต)

## Self-review

- ไม่มี placeholder TBD
- ข้อความแผงซ้ายชัดเจนและใช้ชุดเดียวทั้ง login / pending-approval
- ขอบเขตไฟล์แคบ: AuthCard + AuthInfoPanel + 2 callers
- ไม่แตะ auth logic
