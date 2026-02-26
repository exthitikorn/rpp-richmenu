You are a senior full-stack engineer. Generate a production-ready SaaS web application.

# Project: LINE OA Rich Menu Manager (Hybrid Import)

Build a multi-tenant web app to manage Rich Menus for multiple LINE Official Accounts.

## Tech Stack (MANDATORY)

- Next.js 14+ (App Router, Server Actions)
- TypeScript (strict)
- Tailwind CSS + HeroUI
- Prisma ORM
- TiDB Serverless (MySQL compatible)
- Deployment target: Vercel
- Storage: Vercel Blob (or S3-compatible)
- Charts: Recharts
- Form validation: Zod

---

## Core Requirements

### Multi-Tenant

Support multiple organizations and multiple LINE OA accounts per organization.

Entities:

- Organization
- User
- Membership (role-based)
- LINE OA Account

Roles:

- OWNER
- ADMIN
- MEMBER

---

## Hybrid Rich Menu Workflow

Support TWO creation methods:

### 1) Import from LINE Bot Designer (PRIMARY)

User uploads:

- richmenu.json
- image file

System must:

1. Parse JSON
2. Validate schema
3. Validate image size matches JSON size
4. Store data in database
5. Show preview with clickable overlay areas
6. Allow editing of actions before deploy

Supported actions:

- URI
- Message
- Postback
- Switch Rich Menu

---

### 2) Manual Creation (Fallback)

User can manually:

- Define size
- Add areas
- Configure actions

---

## LINE Integration

Implement API integration with LINE Messaging API:

Functions:

- Create Rich Menu
- Upload Rich Menu Image
- Set Default Rich Menu
- Link Rich Menu to users
- Delete Rich Menu

Use environment variables:

LINE_CHANNEL_ID
LINE_CHANNEL_SECRET
LINE_CHANNEL_ACCESS_TOKEN

---

## Click Tracking

Implement webhook endpoint:

POST /api/webhook/line

Record:

- userId
- richMenuId
- area index
- timestamp

Store in click_events table.

---

## Dashboard

Create analytics dashboard:

- Clicks per button
- Clicks per menu
- Daily / Monthly charts
- Top performing areas

---

## Database Schema (Prisma)

Models required:

- User
- Organization
- Membership
- LineAccount
- RichMenu
- RichMenuArea
- DeployLog
- ClickEvent
- SiteSetting

Use relations and indexes.

---

## UI Pages

### Public

- Login page

### App

- Dashboard
- Organizations
- LINE Accounts
- Rich Menu List
- Import Rich Menu Page
- Rich Menu Editor
- Deploy Logs
- Analytics
- Settings

---

## Rich Menu Editor UI

Features:

- Image preview
- Overlay boxes for areas
- Click area to edit action
- Add / Delete areas
- Live preview

---

## Deployment Flow

When user clicks DEPLOY:

1. Create rich menu via LINE API
2. Upload image
3. Link rich menu
4. Update status
5. Log result

---

## Code Quality Requirements

- Modular folder structure
- Reusable components
- Proper error handling
- Loading states
- Type-safe API
- No any types
- Environment validation
- Production-ready

---

## Output Format

Generate:

1. Project folder structure
2. Prisma schema
3. Key backend routes
4. LINE API integration service
5. Rich Menu parser
6. Editor components
7. Dashboard components
8. Deployment instructions for Vercel
9. README.md

Do NOT generate explanations. Only generate code and necessary files.

Ensure the app can run after:

npm install
npx prisma migrate dev
npm run dev