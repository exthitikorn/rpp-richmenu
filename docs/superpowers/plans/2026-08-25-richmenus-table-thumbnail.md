# Rich Menus Table Thumbnail Implementation Plan

> **For agentic workers:** Execute task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add small clickable thumbnails to the rich menus list (table + mobile cards) with a shared enlarge modal.

**Architecture:** One shared preview state in `RichMenusTable`; thumbnails are buttons that set preview; a single HeroUI Modal renders the large image. Use `next/image` with existing local `imageUrl` paths.

**Tech Stack:** Next.js `Image`, HeroUI `Modal` / `Table` / `Card` (already in file)

## Global Constraints

- Touch only `app/(app)/rich-menus/RichMenusTable.tsx` (plus this plan/spec docs)
- No new dependencies
- No Prisma / page query changes — `imageUrl` is already on `RichMenu`
- Project has no test suite — verify manually in browser
- Do not commit unless the user asks

---

### Task 1: Thumbnail button + shared enlarge modal

**Files:**
- Modify: `app/(app)/rich-menus/RichMenusTable.tsx`

**Interfaces:**
- Consumes: `rm.imageUrl`, `rm.name`, `rm.width`, `rm.height`
- Produces: `RichMenuThumbButton` (or inline) + one `preview` state on `RichMenusTable`

- [ ] **Step 1: Add preview state and modal to `RichMenusTable`**

```tsx
type Preview = {
  name: string;
  imageUrl: string;
  width: number;
  height: number;
};

// inside RichMenusTable:
const [preview, setPreview] = useState<Preview | null>(null);

// Modal size="2xl", title = preview.name, Image object-contain
// onOpenChange closes by setPreview(null)
```

- [ ] **Step 2: Add table thumb column (~48px wide)**

```tsx
const TABLE_THUMB_W = 48;
const thumbH = Math.max(1, Math.round((TABLE_THUMB_W * rm.height) / rm.width));

// New first TableColumn (header "รูป" or empty)
// First TableCell: button wrapping next/image, onPress/onClick → setPreview(...)
```

- [ ] **Step 3: Add mobile card banner**

```tsx
// Top of RichMenuCardItem CardBody: full-width button, max-h ~140px, object-contain
// Needs setPreview passed in as prop (or lift card into table file with callback)
```

- [ ] **Step 4: Manual check**

Run: `npm run dev` → `/rich-menus`  
Expected: thumb in table left column; banner on mobile cards; click opens modal with large image; Esc/backdrop closes.

- [ ] **Step 5: Commit only if user asks**
