# Line Account Request — Design Spec

**Date:** 2026-08-27  
**Status:** Implemented  
**Approach:** Separate `LineAccountRequest` table (Approach 1)

## Problem

Only system admins can create LINE Official Accounts today. Regular approved users must wait for an admin to onboard their OA, which creates a bottleneck when teams want self-service onboarding with admin oversight.

## Goal

Allow approved users to **request** a new LINE OA by submitting full credentials. Admins **approve or reject** from the dashboard. On approval, the system creates the `LineAccount`, auto-assigns the requester, and the requester can assign others later via the existing Users page.

## Non-Goals (v1)

- External notifications (email, LINE push)
- Multi-user assignment at request time
- Editing a pending request (cancel + resubmit instead)
- Removing admin direct-create (`POST /api/line-accounts`)

## Decisions Log

| Topic | Decision |
|---|---|
| Credentials at submit | User fills all fields; admin approves only |
| Post-approval access | Auto-assign requester only; others via Users page |
| Admin direct create | Keep existing flow |
| Credential verification | On submit **and** on approve |
| Rejection | Required reason; user may resubmit |
| Pending request edits | Cancel only; no inline edit |
| Submit UI location | `/line-accounts` |
| Admin review UI location | Dashboard (reuse pending-users card pattern) |
| Admin sees secrets | No — metadata only |
| Duplicate channelId | Block if OA exists or another PENDING exists |
| User sees own requests | Yes — full history on `/line-accounts` |
| Notifications | In-app only (v1) |
| UI detail in spec | Deferred — implement using existing patterns |

---

## Data Model

### New enum: `LineAccountRequestStatus`

```
PENDING | APPROVED | REJECTED | CANCELLED
```

### New model: `LineAccountRequest`

| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | PK |
| `name` | String | Display name for the OA |
| `channelId` | String | Not globally unique on this table |
| `channelSecret` | String | Encrypted via `encryptSecret` |
| `accessToken` | String | Encrypted via `encryptSecret` |
| `status` | `LineAccountRequestStatus` | Default `PENDING` |
| `requestedById` | String | FK → `User` |
| `reviewedById` | String? | FK → `User`; admin who approved/rejected |
| `rejectionReason` | String? | Required when `status = REJECTED` |
| `reviewedAt` | DateTime? | Set on approve/reject |
| `lineAccountId` | String? | FK → `LineAccount`; set on approve |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

### Relations

- `User.requestedLineAccountRequests` ← `requestedById`
- `User.reviewedLineAccountRequests` ← `reviewedById` (optional)
- `LineAccount.lineAccountRequests` ← `lineAccountId` (optional, reverse)

### Indexes

- `@@index([requestedById, status])` — user's own request list
- `@@index([status, createdAt])` — admin pending queue on dashboard

### Uniqueness rules (application-enforced)

MariaDB partial unique indexes are awkward; enforce in app + transaction:

1. **On create:** reject if `LineAccount.channelId` already exists
2. **On create:** reject if any `LineAccountRequest` with same `channelId` and `status = PENDING` exists
3. **On approve:** re-check both rules inside transaction (race guard)
4. **Rejected / cancelled** requests do **not** block resubmission of the same `channelId`

---

## API

### User endpoints (approved user required)

#### `POST /api/line-account-requests`

Create a pending request.

**Body:** `{ name, channelId, channelSecret, accessToken }` — same Zod shape as `POST /api/line-accounts`.

**Steps:**
1. `getCurrentUser()` — 401 if missing/unapproved
2. Validate body
3. Check duplicate `channelId` against `LineAccount` and pending requests
4. `verifyLineCredentials(...)` — 400 on failure
5. Encrypt secrets, insert `LineAccountRequest` with `status = PENDING`

**Response:** `{ success: true, id }`

#### `GET /api/line-account-requests`

List requests for the current user (all statuses), ordered by `createdAt desc`.

**Response fields (public):** `id`, `name`, `channelId`, `status`, `rejectionReason`, `reviewedAt`, `lineAccountId`, `createdAt` — **never** return secrets.

Admin variant: `GET /api/line-account-requests?status=PENDING` returns all pending requests with requester info (`name`, `email`, `ldapUsername`). Requires `requireSystemAdmin()`.

#### `DELETE /api/line-account-requests/[id]`

Cancel own pending request → `status = CANCELLED`.

- 404 if not found or not owned by caller
- 409 if status is not `PENDING`

### Admin endpoints

#### `POST /api/line-account-requests/[id]/approve`

**Steps:**
1. `requireSystemAdmin()`
2. Load request where `status = PENDING` — 404/409 otherwise
3. `verifyLineCredentials(...)` — 400 if fail (admin should reject with reason instead)
4. Transaction:
   - Re-check `channelId` not in `LineAccount` and no other `PENDING` for same `channelId`
   - `lineAccount.create({ name, channelId, channelSecret, accessToken })`
   - `lineAccountAssignment.create({ userId: requestedById, lineAccountId })`
   - `lineAccountRequest.update({ status: APPROVED, lineAccountId, reviewedById, reviewedAt })`

**Response:** `{ success: true, lineAccountId }`

#### `POST /api/line-account-requests/[id]/reject`

**Body:** `{ reason: string }` — required, min 1 char.

**Steps:**
1. `requireSystemAdmin()`
2. Load request where `status = PENDING`
3. Update to `REJECTED` with `rejectionReason`, `reviewedById`, `reviewedAt`

### Unchanged

`POST /api/line-accounts` — admin direct create, no request record.

---

## Approval Flow

```
User submits request
  → verify credentials
  → store encrypted PENDING request

Admin sees queue on dashboard
  → Approve: verify again → create LineAccount + assign requester → APPROVED
  → Reject: require reason → REJECTED

User sees status on /line-accounts
  → PENDING: can cancel
  → REJECTED: sees reason, can submit new request
  → APPROVED: OA appears in their assigned list
```

---

## Error Handling

| Scenario | HTTP | Message (Thai) |
|---|---|---|
| Invalid / failed credential verify | 400 | จาก `verifyLineCredentials` |
| Duplicate channelId (OA exists) | 409 | Channel ID นี้มีในระบบแล้ว |
| Duplicate channelId (pending request) | 409 | มีคำขอรออนุมัติสำหรับ Channel ID นี้อยู่แล้ว |
| Cancel non-pending or not owner | 403/404 | ไม่พบหรือไม่มีสิทธิ์ |
| Approve non-pending | 409 | คำขอนี้ไม่อยู่ในสถานะรออนุมัติ |
| Reject without reason | 400 | กรุณาระบุเหตุผล |
| Verify fail on approve | 400 | credential ไม่ถูกต้องหรือหมดอายุ — ปฏิเสธคำขอแทน |

---

## UI (deferred)

Implement using existing codebase patterns; no wireframes in this spec.

**Minimum surfaces:**
- `/line-accounts`: request form for non-admin users; list of own requests with status badges; cancel button on PENDING
- `/dashboard`: admin card for pending OA requests (parallel to pending users card) with approve/reject actions; reject opens modal requiring reason
- Admin keeps existing "เพิ่ม LINE Account" button on `/line-accounts`

Reuse: `CreateLineAccountForm` field layout, `verifyLineCredentials`, dashboard pending-users card pattern, HeroUI Modal/Toast.

---

## Security

- Secrets encrypted at rest (same as `LineAccount`)
- Secrets never returned in API responses or admin UI
- Only request owner can cancel; only system admin can approve/reject
- Re-verify credentials on approve to catch expired tokens

---

## Migration

1. Add enum + `LineAccountRequest` model to `schema.prisma`
2. `npx prisma migrate dev --name add_line_account_request`

---

## Testing (manual)

No test suite in repo. Verify manually:

1. User submits valid request → PENDING appears in own list
2. Duplicate channelId blocked (existing OA and pending request)
3. User cancels PENDING → CANCELLED
4. Admin approves → LineAccount created, user assigned, request APPROVED
5. Admin rejects without reason → 400
6. Admin rejects with reason → user sees reason, can resubmit
7. Approve with expired token → 400
8. Admin direct create still works
