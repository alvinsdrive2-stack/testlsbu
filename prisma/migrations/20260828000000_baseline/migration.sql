-- CreateTable
CREATE TABLE `module` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `shuffleQuestions` BOOLEAN NOT NULL DEFAULT false,
    `shuffleOptions` BOOLEAN NOT NULL DEFAULT false,
    `pretestDurationMin` INTEGER NOT NULL DEFAULT 30,
    `posttestDurationMin` INTEGER NOT NULL DEFAULT 30,
    `pretestPassingGrade` INTEGER NOT NULL DEFAULT 0,
    `posttestPassingGrade` INTEGER NOT NULL DEFAULT 70,
    `showAnswerReview` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `question` (
    `id` VARCHAR(191) NOT NULL,
    `moduleId` VARCHAR(191) NOT NULL,
    `section` ENUM('PRETEST', 'POSTTEST') NOT NULL,
    `text` VARCHAR(191) NOT NULL,
    `explanation` TEXT NULL,
    `order` INTEGER NOT NULL,

    INDEX `question_moduleId_section_idx`(`moduleId`, `section`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `option` (
    `id` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `text` VARCHAR(191) NOT NULL,
    `isCorrect` BOOLEAN NOT NULL,

    INDEX `option_questionId_idx`(`questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `material` (
    `id` VARCHAR(191) NOT NULL,
    `moduleId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` MEDIUMTEXT NOT NULL,
    `videoUrl` VARCHAR(191) NULL,
    `pdfUrl` VARCHAR(191) NULL,
    `order` INTEGER NOT NULL,

    INDEX `material_moduleId_idx`(`moduleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity` (
    `id` VARCHAR(191) NOT NULL,
    `moduleId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `registrationStart` DATETIME(3) NULL,
    `pretestStart` DATETIME(3) NULL,
    `materialStart` DATETIME(3) NULL,
    `posttestStart` DATETIME(3) NULL,
    `closedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `activity_moduleId_idx`(`moduleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `participant` (
    `id` VARCHAR(191) NOT NULL,
    `activityId` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `badanUsaha` VARCHAR(191) NOT NULL,
    `npwp` VARCHAR(191) NOT NULL,
    `wa` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `isGapensiMember` BOOLEAN NOT NULL,
    `stage` ENUM('REGISTERED', 'PRETEST_DONE', 'POSTTEST_PASSED') NOT NULL DEFAULT 'REGISTERED',
    `certificateNumber` VARCHAR(191) NULL,
    `certificateIssuedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `participant_token_key`(`token`),
    UNIQUE INDEX `participant_certificateNumber_key`(`certificateNumber`),
    INDEX `participant_activityId_idx`(`activityId`),
    INDEX `participant_email_idx`(`email`),
    INDEX `participant_wa_idx`(`wa`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attempt` (
    `id` VARCHAR(191) NOT NULL,
    `participantId` VARCHAR(191) NOT NULL,
    `section` ENUM('PRETEST', 'POSTTEST') NOT NULL,
    `seed` INTEGER NOT NULL,
    `score` INTEGER NULL,
    `passed` BOOLEAN NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `submittedAt` DATETIME(3) NULL,

    INDEX `attempt_participantId_section_idx`(`participantId`, `section`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `answer` (
    `id` VARCHAR(191) NOT NULL,
    `attemptId` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `optionId` VARCHAR(191) NULL,

    UNIQUE INDEX `answer_attemptId_questionId_key`(`attemptId`, `questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `certificate_config` (
    `id` VARCHAR(191) NOT NULL,
    `fields` JSON NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `question` ADD CONSTRAINT `question_moduleId_fkey` FOREIGN KEY (`moduleId`) REFERENCES `module`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `option` ADD CONSTRAINT `option_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `question`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material` ADD CONSTRAINT `material_moduleId_fkey` FOREIGN KEY (`moduleId`) REFERENCES `module`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity` ADD CONSTRAINT `activity_moduleId_fkey` FOREIGN KEY (`moduleId`) REFERENCES `module`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `participant` ADD CONSTRAINT `participant_activityId_fkey` FOREIGN KEY (`activityId`) REFERENCES `activity`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attempt` ADD CONSTRAINT `attempt_participantId_fkey` FOREIGN KEY (`participantId`) REFERENCES `participant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `answer` ADD CONSTRAINT `answer_attemptId_fkey` FOREIGN KEY (`attemptId`) REFERENCES `attempt`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `answer` ADD CONSTRAINT `answer_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `question`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `answer` ADD CONSTRAINT `answer_optionId_fkey` FOREIGN KEY (`optionId`) REFERENCES `option`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

