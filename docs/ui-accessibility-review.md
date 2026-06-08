# รายงานตรวจสอบ UI และการเข้าถึง (Accessibility)

**โปรเจกต์:** rpp-richmenu  
**วันที่ตรวจสอบ:** 8 มิถุนายน 2026  
**ขอบเขต:** Layout หลัก, Navbar, Sidebar, ฟอร์ม, ตาราง, Modal, Analytics, Rich Menu Editor

---

## สรุปภาพรวม

แอปมีพื้นฐานที่ดี — ใช้ HeroUI ที่มี label ในฟอร์ม, ขนาดปุ่มสัมผัสที่เหมาะสม, และ live region ในหลายจุด แต่ยังมีช่องว่างสำคัญที่ส่งผลต่อผู้ใช้ screen reader และผู้ใช้คีย์บอร์ด โดยเฉพาะภาษาเอกสาร, ปุ่มเมนูโปรไฟล์บนเดสก์ท็อป, กราฟ Analytics และเครื่องมือแก้ไข Rich Menu ที่ใช้ได้เฉพาะเมาส์/ทัช

---

## สิ่งที่ทำได้ดีแล้ว

### การสัมผัสและมือถือ

- กำหนดขนาดปุ่มขั้นต่ำ 44px ใน `styles/globals.css` และบนคอนโทรลสำคัญ (หน้า login, เมนูมือถือ, ลิงก์ sidebar)
- รองรับ safe-area สำหรับอุปกรณ์ที่มี notch
- ตั้ง `maximumScale: 5` ใน viewport — ไม่บล็อกการซูมด้วยนิ้ว

### การนำทาง

- Sidebar ใช้ `aria-label`, `aria-current="page"` และ semantic `<nav>` / `<ul>`
- ปุ่มเปิด Drawer บนมือถือมี `aria-label="เปิดเมนูนำทาง"`
- ปุ่มเมนูโปรไฟล์บนมือถือมี `aria-label` และ Dropdown มี `aria-label`

### ฟอร์มและข้อความแจ้งเตือน

- ฟอร์ม login, settings, profile ใช้ `role="alert"` / `role="status"` สำหรับ error และ success
- Input ในหน้า login มี `autoComplete` ที่ถูกต้อง
- Switch และ Select ในตารางผู้ใช้มี `aria-label` อธิบายบริบท

### รายการและตาราง

- Card list บนมือถือและตาราง HeroUI บนเดสก์ท็อปมักมี `aria-label`
- ไอคอนตกแต่งใช้ `aria-hidden` และ `focusable="false"`

---

## ปัญหาระดับวิกฤต (Critical)

### 1. ภาษาเอกสารไม่ตรงกับเนื้อหา (`lang="en"` แต่ UI เป็นภาษาไทย)

**ไฟล์:** `app/layout.tsx`

```html
<html lang="en">
```

เนื้อหาส่วนใหญ่เป็นภาษาไทย แต่ตั้ง `lang="en"` Screen reader จะอ่านภาษาไทยผิดเสียง

**แนะนำ:** เปลี่ยนเป็น `lang="th"` หรือใช้ `lang="th"` เป็นหลักและใส่ `lang="en"` เฉพาะส่วนที่เป็นภาษาอังกฤษ

---

### 2. ปุ่มเมนูโปรไฟล์บนเดสก์ท็อปไม่มี accessible name

**ไฟล์:** `components/navbar.tsx`

บนมือถือปุ่ม Avatar มี `aria-label="เมนูโปรไฟล์"` แต่บนเดสก์ท็อปปุ่ม Dropdown trigger ไม่มี `aria-label`

**แนะนำ:** เพิ่ม `aria-label="เมนูโปรไฟล์"` หรือรวมชื่อผู้ใช้ เช่น `aria-label={`เมนูโปรไฟล์: ${profileLabel}`}`

---

### 3. กราฟ Analytics ไม่มีทางเลือกสำหรับ screen reader

**ไฟล์:** `app/(app)/analytics/AnalyticsCharts.tsx`

กราฟ Recharts ไม่มี:

- `aria-label` หรือ `role="img"` พร้อมสรุปข้อความ
- ตารางข้อมูลซ่อนสำหรับ screen reader
- ลิงก์หรือปุ่มสลับไปดูข้อมูลแบบตาราง

ผู้ใช้คีย์บอร์ดและ screen reader ไม่สามารถเข้าถึงข้อมูลสถิติบนแดชบอร์ดได้

**แนะนำ:** เพิ่มตารางข้อมูลที่ซ่อนด้วย CSS (`sr-only`) หรือปุ่ม "ดูข้อมูลเป็นตาราง" ที่แสดงข้อมูลเดียวกัน

---

### 4. เครื่องมือแก้ไข Rich Menu ใช้ได้เฉพาะ pointer

**ไฟล์:** `app/(app)/import/ImportRichMenuForm.tsx`

พื้นที่วาด/ย้าย/resize Area ใช้ pointer events และ `role="presentation"` — ไม่มีทางเลือกด้วยคีย์บอร์ด

ละเมิด WCAG 2.1 หลักการ **2.1.1 Keyboard** สำหรับ workflow หลักของแอป

**แนะนำ:** เพิ่มทางเลือกด้วยคีย์บอร์ด เช่น

- เลือก Area แล้วใช้ลูกศรย้าย/resize
- หรือฟอร์มกรอกพิกัด (x, y, width, height) สำหรับแต่ละ Area

---

## ปัญหาระดับกลาง (Medium)

### 5. ไม่มี Skip link

ไม่มีลิงก์ "ข้ามไปเนื้อหาหลัก" ก่อน Navbar ผู้ใช้คีย์บอร์ดต้อง Tab ผ่าน header ทุกครั้งที่โหลดหน้า

**แนะนำ:** เพิ่มลิงก์ที่ซ่อนจนกว่าจะ focus ชี้ไปที่ `<main>`

---

### 6. โครงสร้าง HTML ของ Navbar ไม่ถูกต้อง

**ไฟล์:** `components/navbar.tsx`

```tsx
<NavbarBrand as="li" ...>
```

ใช้ `<li>` โดยไม่มี parent `<ul>` — HTML ไม่ valid และอาจสับสน assistive technology

**แนะนำ:** ใช้ element ปกติ หรือห่อด้วย `<ul>`

---

### 7. Layout ของ `<main>` ส่งผลต่อการใช้งาน

**ไฟล์:** `app/layout.tsx`

```tsx
<main className="... items-center justify-center">
```

`items-center justify-center` ทำให้เนื้อหาหน้าแอปถูกจัดกึ่งกลางแนวตั้ง หน้าที่มีตารางหรือฟอร์มยาวควรชิดด้านบน

**แนะนำ:** ใช้ `items-stretch` หรือ `items-start` สำหรับหน้าแอป และจัดกึ่งกลางเฉพาะหน้า auth (login)

---

### 8. หน้า Error ผสมภาษา

**ไฟล์:** `app/error.tsx`

- หัวข้อ: "Something went wrong" (อังกฤษ)
- ปุ่ม: "Try again" (อังกฤษ)
- เนื้อหา: ภาษาไทย

**แนะนำ:** แปลหัวข้อและปุ่มเป็นภาษาไทยให้สอดคล้องกัน

---

### 9. หัวข้อหน้า Profile ผสมภาษา

**ไฟล์:** `app/(app)/profile/page.tsx`

- `PageHeader` ใช้ title `"Profile"` (อังกฤษ, h1)
- ส่วนใน `ProfileForm` ใช้หัวข้อภาษาไทย (h2)

**แนะนำ:** เปลี่ยน title เป็น `"โปรไฟล์"`

---

### 10. ปุ่ม Area ใน Preview ไม่บอกสถานะที่เลือก

**ไฟล์:** `components/rich-menu-editor/RichMenuPreview.tsx`

มีเพียง `aria-label={`Area ${index + 1}`}` ไม่มีสถานะ selected

**แนะนำ:**

- เพิ่ม `aria-pressed={selectedIndex === index}`
- ใช้ label ภาษาไทย เช่น `พื้นที่ที่ ${index + 1}`

---

### 11. ปุ่มอัปโหลดไฟล์ใน Settings

**ไฟล์:** `app/(app)/settings/SettingsForm.tsx`

ใช้ `<Button as="label">` สำหรับเลือก Logo/Favicon โดยไม่มี accessible name ที่ชัดเจน

**แนะนำ:** เพิ่ม `aria-label` หรือ `<label htmlFor="...">` ที่เชื่อมกับ input

---

### 12. Card list บนมือถือ — semantics ไม่ครบ

**ไฟล์:** เช่น `RichMenusTable.tsx`, `OrganizationList.tsx`, `LineAccountList.tsx`

Container ใช้ `role="list"` แต่ลูกเป็น `<Card>` ไม่ใช่ `role="listitem"`

**แนะนำ:** เพิ่ม `role="listitem"` บน Card หรือลบ `role="list"` ออก

---

### 13. ตารางผู้ใช้รออนุมัติบนแดชบอร์ด

**ไฟล์:** `app/(app)/dashboard/page.tsx`

ใช้ `<table>` HTML ธรรมดาโดยไม่มี `<caption>` หรือ `scope="col"` บน `<th>`

**แนะนำ:** เพิ่ม caption และ scope เพื่อให้ screen reader อ่านบริบทได้ดีขึ้น

---

### 14. ไม่รองรับ prefers-reduced-motion

**ไฟล์:** `app/(app)/dashboard/page.tsx`

การ์ดใช้ `hover:-translate-y-1` และ transition โดยไม่มี fallback สำหรับผู้ที่ตั้งค่าลดการเคลื่อนไหว

**แนะนำ:** ใช้ `motion-reduce:transform-none motion-reduce:transition-none`

---

## ปัญหาระดับต่ำ (Low)

| รายการ | รายละเอียด |
|--------|------------|
| สีข้อความ `text-default-400` | อาจ contrast ไม่ถึง 4.5:1 บนพื้นหลังอ่อน — ควรตรวจสอบ |
| ปุ่มคัดลอก | การคัดลอก clipboard อาจไม่มี feedback ผ่าน `aria-live` (toast ช่วยเฉพาะผู้เห็น) |
| Heatmap overlay | ตัวเลขคลิกแสดงบนภาพแต่ไม่มีโครงสร้างที่นำทางได้ด้วย AT |
| หัวข้อใน AreaActionForm | ใช้ `<span>` แทน heading — โครงสร้าง heading ใน editor อ่อน |
| Theme switch | บังคับ `forcedTheme: "light"` — ถ้าตั้งใจไม่รองรับ dark mode ก็โอเค; `theme-switch.tsx` อาจเป็น dead code |

---

## รายการแก้ไขตามลำดับความสำคัญ

| ลำดับ | การแก้ไข | ความยาก |
|-------|----------|---------|
| P0 | ตั้ง `lang="th"` บน `<html>` | ต่ำ |
| P0 | เพิ่ม `aria-label` ให้ปุ่มเมนูโปรไฟล์บนเดสก์ท็อป | ต่ำ |
| P1 | เพิ่มตารางหรือสรุปข้อความสำหรับกราฟ Analytics | ปานกลาง |
| P1 | เพิ่มทางเลือกคีย์บอร์ดสำหรับแก้ไข Area ใน Rich Menu | สูง |
| P2 | เพิ่ม Skip-to-main link | ต่ำ |
| P2 | แก้ semantics ของ Navbar (`<li>`) | ต่ำ |
| P2 | จัด `<main>` ให้ชิดด้านบนสำหรับหน้าแอป | ต่ำ |
| P2 | แปลหน้า error และ title หน้า profile เป็นภาษาไทย | ต่ำ |
| P3 | `aria-pressed`, list roles, table caption, reduced motion | ต่ำ–ปานกลาง |

---

## ไฟล์ที่เกี่ยวข้องหลัก

| ไฟล์ | ประเด็น |
|------|---------|
| `app/layout.tsx` | `lang`, layout ของ `<main>` |
| `components/navbar.tsx` | aria-label เดสก์ท็อป, `<li>` semantics |
| `app/(app)/analytics/AnalyticsCharts.tsx` | กราฟไม่ accessible |
| `app/(app)/import/ImportRichMenuForm.tsx` | pointer-only editor |
| `components/rich-menu-editor/RichMenuPreview.tsx` | `aria-pressed`, label ภาษาไทย |
| `app/error.tsx` | ภาษาผสม |
| `app/(app)/profile/page.tsx` | title ภาษาอังกฤษ |
| `app/(app)/settings/SettingsForm.tsx` | ปุ่มอัปโหลดไฟล์ |
| `app/(app)/dashboard/page.tsx` | ตาราง, reduced motion |
| `styles/globals.css` | touch target (ดีแล้ว) |

---

## สรุปท้ายรายงาน

พื้นฐานของแอปอยู่ในระดับที่ใช้งานได้ — มี nav ที่มี label, error ในฟอร์ม, ขนาดปุ่มสัมผัส และการซูมที่ไม่ถูกบล็อก ช่องว่างที่กระทบผู้ใช้จริงมากที่สุดคือ **ภาษาเอกสาร**, **ปุ่มโปรไฟล์บนเดสก์ท็อป**, **กราฟที่อ่านไม่ได้ด้วย AT** และ **เครื่องมือแก้ Rich Menu ที่ใช้คีย์บอร์ดไม่ได้** การแก้สี่จุดนี้จะยกระดับการเข้าถึงของแอปให้ใกล้ WCAG 2.1 AA สำหรับ workflow หลักได้อย่างมีนัยสำคัญ
