-- CreateTable
CREATE TABLE `LineAccountRequest` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `channelId` VARCHAR(191) NOT NULL,
    `channelSecret` VARCHAR(191) NOT NULL,
    `accessToken` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `requestedById` VARCHAR(191) NOT NULL,
    `reviewedById` VARCHAR(191) NULL,
    `rejectionReason` TEXT NULL,
    `reviewedAt` DATETIME(3) NULL,
    `lineAccountId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LineAccountRequest_requestedById_status_idx`(`requestedById`, `status`),
    INDEX `LineAccountRequest_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `LineAccountRequest_channelId_status_idx`(`channelId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LineAccountRequest` ADD CONSTRAINT `LineAccountRequest_requestedById_fkey` FOREIGN KEY (`requestedById`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LineAccountRequest` ADD CONSTRAINT `LineAccountRequest_reviewedById_fkey` FOREIGN KEY (`reviewedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LineAccountRequest` ADD CONSTRAINT `LineAccountRequest_lineAccountId_fkey` FOREIGN KEY (`lineAccountId`) REFERENCES `LineAccount`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
