-- Dedupe channelId (keep oldest row) then enforce uniqueness for webhook routing.
DELETE t1
FROM LineAccount t1
INNER JOIN LineAccount t2
  ON t1.channelId = t2.channelId
 AND t1.createdAt > t2.createdAt;

CREATE UNIQUE INDEX `LineAccount_channelId_key` ON `LineAccount`(`channelId`);
