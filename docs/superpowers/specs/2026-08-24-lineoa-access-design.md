# LineOA-Centric Access Design

## Summary

This design removes `Organization` as an access-control boundary and replaces it with direct assignment between users and LINE Official Accounts (`LineAccount`). The resulting permission model has only two concepts:

- `isSystemAdmin` for system-wide administration
- LineOA assignment for scoped operational access

Approved non-admin users can manage rich menus, analytics, and deploy logs only for the LineOA entries they are assigned to.

## Goals

- Remove the current multi-layer access model built around `Organization`, `Membership`, and organization roles.
- Make the permission model match the real operating unit: `LineAccount`.
- Keep system-wide administration separate from day-to-day rich menu operations.
- Preserve scoped access for non-admin users without introducing a new role hierarchy.

## Non-Goals

- No partial compatibility layer for organization-based access.
- No delegated management of LineOA settings or assignees by non-admin users.
- No change to authentication provider flow beyond permission checks and data loading.

## Target Permission Model

### User States

1. Unapproved user
   - Cannot access the app beyond approval flow.
2. Approved system admin
   - Full access to all resources and administration features.
3. Approved assigned user
   - Access only to the LineOA resources they are explicitly assigned to.
4. Approved unassigned user
   - Can sign in, but has no operational resources to manage.

### System Admin Capabilities

- Approve users
- Grant or revoke `isSystemAdmin`
- Create, update, and delete `LineAccount`
- Assign and unassign users to `LineAccount`
- View all rich menus, analytics, click events, and deploy logs

### Assigned User Capabilities

- View assigned `LineAccount` records
- Import rich menus for assigned LineOA
- Create, edit, deploy, and set default rich menus for assigned LineOA
- View analytics, click events, and deploy logs for assigned LineOA

### Assigned User Restrictions

- Cannot create, update, or delete `LineAccount`
- Cannot assign or unassign other users
- Cannot approve users or manage system admins

## Data Model Changes

### Remove

- `Organization`
- `Membership`
- organization-scoped access helpers
- organization role concepts such as `ADMIN` and `USER`

### Keep on User

- `department` field sourced from LDAP OU for display and filtering purposes only
- no authorization decisions should depend on `department`

### Add

Introduce a direct many-to-many relation between `User` and `LineAccount`.

Recommended explicit join model:

```prisma
model LineAccountAssignment {
  id            String      @id @default(cuid())
  userId        String
  lineAccountId String
  createdAt     DateTime    @default(now())

  user          User        @relation(fields: [userId], references: [id])
  lineAccount   LineAccount @relation(fields: [lineAccountId], references: [id])

  @@unique([userId, lineAccountId])
  @@index([lineAccountId])
}
```

This keeps the design extensible if assignment metadata is needed later, while still staying simple today.

### Core Relation Shape

- A `User` can be assigned to many `LineAccount` records.
- A `LineAccount` can have many assigned users.
- `RichMenu`, `ClickEvent`, and `DeployLog` continue to scope through `LineAccount`.

### User Profile Data from LDAP

Add a nullable string field such as `department` to `User`.

Expected behavior:

- populate `department` from the LDAP OU value during LDAP sign-in or user sync
- update it on subsequent LDAP logins so the app reflects current directory data
- treat it as informational profile data only
- allow it to be shown in user management UI and used for text filtering/search later if needed

## Authorization Design

### Keep

- `isApproved`
- `isSystemAdmin`
- middleware protection for authenticated and approved access
- `department` as informational user metadata only

### Replace

Current organization-based helpers should be replaced by LineOA-based helpers:

- `lineAccountWhere(user)`
- `lineAccountByIdWhere(user, id)`
- `richMenuWhere(user)`
- `richMenuByIdWhere(user, id)`
- `clickEventWhere(user)`
- `deployLogWhere(user)`

Behavior:

- system admin returns unrestricted filters (`{}`)
- non-admin users filter by assigned `lineAccountId`

### New Guard Functions

- `requireSystemAdmin()`
- `requireLineAccountAccess(lineAccountId)`

`requireLineAccountAccess(lineAccountId)` should:

- allow system admins
- allow assigned users for that exact LineOA
- reject all others

This should be the shared root fix for operational actions instead of repeating one-off checks in each route.

## API Changes

### Admin-Only APIs

- user approval and admin management
- create/update/delete `LineAccount`
- assign/unassign users to `LineAccount`

### LineOA-Scoped APIs

- rich menu import
- rich menu CRUD
- deploy rich menu
- set default rich menu
- analytics and click-event access
- deploy-log access

These APIs should authorize through direct LineOA access, either by:

- checking a specific `lineAccountId`, or
- resolving a `richMenu` through a scoped Prisma `where`

## UI Changes

### Remove Organization UI

- organization list and detail pages
- organization creation and editing flows
- organization-related navigation labels
- membership and role management tied to organizations

### Replace User Assignment UX

On the users management screen:

- replace organization membership editing with LineOA assignment editing
- remove role selectors entirely
- show assigned LineOA names as the scoped access summary
- show the LDAP-derived `department` value as a read-only user attribute

### LineOA Management UX

- system admin manages LineOA records and assignees
- assigned users can open and operate within only their assigned LineOA scope

### Navigation

- remove organization navigation
- keep admin-only navigation for user administration
- expose deploy logs and analytics to assigned users, scoped by assigned LineOA

## Migration Strategy

1. Add `LineAccountAssignment`
2. Backfill assignments from current organization memberships through each organization's linked `LineAccount`
3. Switch application reads and permission checks to the new assignment model
4. Add `User.department` and populate it from LDAP OU for existing users where possible on next login or sync
5. Remove organization UI and API usage
6. Drop `Membership`, `Organization`, and role-related schema

If existing data includes users belonging to organizations with multiple `LineAccount` entries, the backfill should create one assignment per `(user, lineAccount)` pair.

## Error Handling

- Unauthorized: user is not signed in
- Forbidden: user is signed in but lacks LineOA assignment or admin privilege
- Not found: requested resource does not exist within the caller's visible scope

API behavior should keep using scoped lookups where possible so forbidden resources are not distinguishable from invisible resources unless admin-only actions require explicit guard failures.

## Verification Plan

1. System admin can create, edit, and delete LineOA records.
2. System admin can assign and unassign users from LineOA records.
3. Assigned users can import, edit, deploy, and set default rich menus only for assigned LineOA records.
4. Assigned users can view analytics, click events, and deploy logs only for assigned LineOA records.
5. Assigned users cannot edit LineOA configuration or assignees.
6. Unassigned approved users can sign in but cannot access operational resources.
7. System admin still has global access across all LineOA data.

## Open Implementation Notes

- Prefer one explicit join model over implicit many-to-many to keep future audit fields easy to add.
- Reuse existing scoped Prisma helper patterns; only the scope source changes from organization membership to LineOA assignment.
- Do not add a second role layer unless a real use case appears later.
