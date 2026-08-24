-- CreateTable
CREATE TABLE `LineAccountAssignment` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `lineAccountId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `LineAccountAssignment_userId_lineAccountId_key`(`userId`, `lineAccountId`),
    INDEX `LineAccountAssignment_lineAccountId_idx`(`lineAccountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `User`
    ADD COLUMN `department` VARCHAR(191) NULL;

-- Backfill assignments from Organization membership to direct LineAccount access
INSERT INTO `LineAccountAssignment` (`id`, `userId`, `lineAccountId`, `createdAt`)
SELECT
    REPLACE(UUID(), '-', ''),
    m.`userId`,
    la.`id`,
    CURRENT_TIMESTAMP(3)
FROM `Membership` m
INNER JOIN `LineAccount` la ON la.`organizationId` = m.`organizationId`
GROUP BY m.`userId`, la.`id`;

-- AddForeignKey
ALTER TABLE `LineAccountAssignment`
    ADD CONSTRAINT `LineAccountAssignment_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LineAccountAssignment`
    ADD CONSTRAINT `LineAccountAssignment_lineAccountId_fkey`
    FOREIGN KEY (`lineAccountId`) REFERENCES `LineAccount`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- DropForeignKey
ALTER TABLE `LineAccount` DROP FOREIGN KEY `LineAccount_organizationId_fkey`;

-- DropForeignKey
ALTER TABLE `Membership` DROP FOREIGN KEY `Membership_organizationId_fkey`;

-- DropForeignKey
ALTER TABLE `Membership` DROP FOREIGN KEY `Membership_userId_fkey`;

-- DropIndex
DROP INDEX `LineAccount_organizationId_idx` ON `LineAccount`;

-- AlterTable
ALTER TABLE `LineAccount`
    DROP COLUMN `organizationId`;

-- DropTable
DROP TABLE `Membership`;

-- DropTable
DROP TABLE `Organization`;
