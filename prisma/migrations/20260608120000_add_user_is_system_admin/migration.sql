-- AlterTable
ALTER TABLE `User` ADD COLUMN `isSystemAdmin` BOOLEAN NOT NULL DEFAULT false;

-- Migrate existing global admins: users with any ADMIN membership become system admins
UPDATE `User` u
SET u.`isSystemAdmin` = true
WHERE EXISTS (
  SELECT 1 FROM `Membership` m
  WHERE m.`userId` = u.`id` AND m.`role` = 'ADMIN'
);
