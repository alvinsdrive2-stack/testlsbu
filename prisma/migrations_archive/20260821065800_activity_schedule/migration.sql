ALTER TABLE `Activity` ADD COLUMN `registrationStart` DATETIME(3) NULL;
ALTER TABLE `Activity` ADD COLUMN `pretestStart` DATETIME(3) NULL;
ALTER TABLE `Activity` ADD COLUMN `materialStart` DATETIME(3) NULL;
ALTER TABLE `Activity` ADD COLUMN `posttestStart` DATETIME(3) NULL;
ALTER TABLE `Activity` ADD COLUMN `closedAt` DATETIME(3) NULL;

-- Backfill: pertahankan semantik status lama berdasarkan waktu dibuat
UPDATE `Activity` SET `pretestStart` = `createdAt` WHERE `status` = 'PRETEST_OPEN';
UPDATE `Activity` SET `posttestStart` = `createdAt` WHERE `status` = 'POSTTEST_OPEN';
UPDATE `Activity` SET `closedAt` = `createdAt` WHERE `status` = 'CLOSED';

ALTER TABLE `Activity` DROP COLUMN `status`;
