-- Pisahkan identitas peserta (`user`) dari pendaftaran per kegiatan
-- (`participant`). Email jadi unik per ORANG, bukan per kegiatan, supaya
-- peserta yang sama boleh ikut pelatihan di hari berbeda dengan email yang
-- sama tanpa terdaftar sebagai orang baru.

-- CreateTable
CREATE TABLE `user` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `wa` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `badanUsaha` VARCHAR(191) NOT NULL,
    `npwp` VARCHAR(191) NOT NULL,
    `isGapensiMember` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_email_key`(`email`),
    INDEX `user_wa_idx`(`wa`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Backfill: satu user per email, diambil dari baris participant TERBARU milik
-- email itu (ROW_NUMBER, jadi baris dengan createdAt kembar tetap terpilih
-- satu). Id sengaja deterministik dari email — kalau migration ini sampai
-- dijalankan ulang di DB yang sudah ter-backfill, errornya duplicate key,
-- bukan diam-diam bikin user kedua untuk orang yang sama.
INSERT INTO `user` (`id`, `email`, `wa`, `nama`, `badanUsaha`, `npwp`, `isGapensiMember`, `createdAt`, `updatedAt`)
SELECT
    SUBSTRING(MD5(CONCAT('gapensi-user-', `email`)), 1, 25),
    `email`,
    `wa`,
    `nama`,
    `badanUsaha`,
    `npwp`,
    `isGapensiMember`,
    `createdAt`,
    NOW(3)
FROM (
    SELECT
        p.`email`, p.`wa`, p.`nama`, p.`badanUsaha`, p.`npwp`, p.`isGapensiMember`, p.`createdAt`,
        ROW_NUMBER() OVER (
            PARTITION BY p.`email`
            ORDER BY p.`createdAt` DESC, p.`id` DESC
        ) AS `rn`
    FROM `participant` p
) ranked
WHERE ranked.`rn` = 1;

-- AlterTable: kolom ditambah nullable dulu supaya backfill di bawah bisa jalan
ALTER TABLE `participant` ADD COLUMN `userId` VARCHAR(191) NULL;

UPDATE `participant` p
JOIN `user` u ON u.`email` = p.`email`
SET p.`userId` = u.`id`;

-- Identitas pindah ke `user`; participant tinggal jadi pendaftaran.
-- Index email & wa ikut dibuang karena kolomnya sudah tidak ada di sini.
ALTER TABLE `participant` DROP INDEX `participant_email_idx`;
ALTER TABLE `participant` DROP INDEX `participant_wa_idx`;
ALTER TABLE `participant`
    DROP COLUMN `nama`,
    DROP COLUMN `badanUsaha`,
    DROP COLUMN `npwp`,
    DROP COLUMN `wa`,
    DROP COLUMN `email`,
    DROP COLUMN `isGapensiMember`;

-- Sengaja keras: kalau ada participant yang emailnya tidak ketemu pasangan
-- user-nya, migration ini gagal di sini daripada lanjut bikin baris
-- enrollment tanpa identitas.
ALTER TABLE `participant` MODIFY `userId` VARCHAR(191) NOT NULL;

-- Satu orang maksimal punya satu pendaftaran per kegiatan.
CREATE UNIQUE INDEX `participant_activityId_userId_key` ON `participant`(`activityId`, `userId`);
CREATE INDEX `participant_userId_idx` ON `participant`(`userId`);

ALTER TABLE `participant` ADD CONSTRAINT `participant_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
