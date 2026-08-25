# Edit Rich Menu — move action buttons to bottom of Areas aside

Date: 2026-08-25  
Status: approved (user: position A bottom of aside, approach 1 move JSX only)

## Goal

On the edit Rich Menu form (`ImportRichMenuForm` in edit mode), move **ล้าง Areas**, **Deploy ไป LINE**, and **ตั้งเป็น Default** from under the Areas heading to the **bottom of the right aside**, after Area chips / selected-area editor.

## Scope

- File: `app/(app)/import/ImportRichMenuForm.tsx` only
- Edit mode only (`isEditMode`); import mode unchanged

## Layout (aside, top → bottom)

1. Heading `Areas (N)`
2. Area chips + selected-area editor (unchanged)
3. Action button row: ล้าง Areas → Deploy ไป LINE → ตั้งเป็น Default

## Non-goals

- No behavior, API, or handler changes
- No style/size/color changes to buttons
- No change to clear-areas confirm modal
- No move to form footer (ย้อนกลับ / บันทึก)

## Implementation

Cut the existing `isEditMode` button `div` from under the Areas heading and paste it after the areas empty-state / chips+editor block, still inside `<aside>`, still wrapped in `{isEditMode && (...)}`.

Visibility rules stay the same: `canSetDefault` gates the Default button; clear/deploy/default handlers unchanged.
