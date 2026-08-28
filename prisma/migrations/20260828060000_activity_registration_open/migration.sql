-- Override manual buka/tutup pendaftaran.
-- NULL = otomatis (buka saat fase REGISTRATION, tutup setelahnya),
-- TRUE = dipaksa buka, FALSE = dipaksa tutup.
ALTER TABLE `activity` ADD COLUMN `registrationOpen` BOOLEAN NULL;
