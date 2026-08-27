ALTER TABLE `LineAccount`
  ADD COLUMN `autoResponseEnabled` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `fallbackMessage` TEXT NULL;

CREATE TABLE `KeywordResponseRule` (
  `id` VARCHAR(191) NOT NULL,
  `lineAccountId` VARCHAR(191) NOT NULL,
  `keyword` VARCHAR(191) NOT NULL,
  `isEnabled` BOOLEAN NOT NULL DEFAULT true,
  `responseType` ENUM('TEXT', 'FLEX') NOT NULL,
  `responsePayload` JSON NOT NULL,
  `flexSource` ENUM('FORM', 'JSON') NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `KeywordResponseRule_lineAccountId_keyword_key`(`lineAccountId`, `keyword`),
  INDEX `KeywordResponseRule_lineAccountId_isEnabled_idx`(`lineAccountId`, `isEnabled`),
  CONSTRAINT `KeywordResponseRule_lineAccountId_fkey`
    FOREIGN KEY (`lineAccountId`) REFERENCES `LineAccount`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `UnmatchedMessage` (
  `id` VARCHAR(191) NOT NULL,
  `lineAccountId` VARCHAR(191) NOT NULL,
  `lineUserId` VARCHAR(191) NOT NULL,
  `messageText` TEXT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `UnmatchedMessage_lineAccountId_createdAt_idx`(`lineAccountId`, `createdAt`),
  CONSTRAINT `UnmatchedMessage_lineAccountId_fkey`
    FOREIGN KEY (`lineAccountId`) REFERENCES `LineAccount`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
