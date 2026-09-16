-- Sertifikat jadi entitas sendiri: nomor + salinan semua yang tercetak saat
-- penerbitan, supaya sertifikat lama tidak ikut berubah kalau profil peserta
-- atau jadwal kegiatan diedit belakangan.

-- CreateTable
CREATE TABLE `certificate` (
    `id` VARCHAR(191) NOT NULL,
    `participantId` VARCHAR(191) NOT NULL,
    `number` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `company` VARCHAR(191) NOT NULL,
    `npwp` VARCHAR(191) NOT NULL,
    `moduleTitle` VARCHAR(191) NOT NULL,
    `examDate` DATETIME(3) NULL,
    `issuedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `certificate_participantId_key`(`participantId`),
    UNIQUE INDEX `certificate_number_key`(`number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Backfill: sertifikat yang sudah terbit disalin dari kondisi data SEKARANG.
-- Id deterministik dari participantId, jadi kalau migration ini sampai
-- dijalankan ulang hasilnya duplicate key — bukan sertifikat kedua untuk
-- orang yang sama.
INSERT INTO `certificate` (`id`, `participantId`, `number`, `name`, `company`, `npwp`, `moduleTitle`, `examDate`, `issuedAt`)
SELECT
    SUBSTRING(MD5(CONCAT('gapensi-cert-', p.`id`)), 1, 25),
    p.`id`,
    p.`certificateNumber`,
    u.`nama`,
    u.`badanUsaha`,
    u.`npwp`,
    m.`title`,
    a.`posttestStart`,
    COALESCE(p.`certificateIssuedAt`, NOW(3))
FROM `participant` p
JOIN `user` u ON u.`id` = p.`userId`
JOIN `activity` a ON a.`id` = p.`activityId`
JOIN `module` m ON m.`id` = a.`moduleId`
WHERE p.`certificateNumber` IS NOT NULL;

-- Nomor & tanggal terbit pindah ke tabel `certificate`.
ALTER TABLE `participant` DROP INDEX `participant_certificateNumber_key`;
ALTER TABLE `participant`
    DROP COLUMN `certificateNumber`,
    DROP COLUMN `certificateIssuedAt`;

ALTER TABLE `certificate` ADD CONSTRAINT `certificate_participantId_fkey` FOREIGN KEY (`participantId`) REFERENCES `participant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
