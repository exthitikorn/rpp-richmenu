-- AlterTable
ALTER TABLE `LineAccount` MODIFY `channelSecret` TEXT NOT NULL,
    MODIFY `accessToken` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `LineAccountRequest` MODIFY `channelSecret` TEXT NOT NULL,
    MODIFY `accessToken` TEXT NOT NULL;
