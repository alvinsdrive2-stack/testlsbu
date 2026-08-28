-- DropForeignKey
ALTER TABLE `activity` DROP FOREIGN KEY `Activity_moduleId_fkey`;

-- DropForeignKey
ALTER TABLE `answer` DROP FOREIGN KEY `Answer_attemptId_fkey`;

-- DropForeignKey
ALTER TABLE `answer` DROP FOREIGN KEY `Answer_optionId_fkey`;

-- DropForeignKey
ALTER TABLE `answer` DROP FOREIGN KEY `Answer_questionId_fkey`;

-- DropForeignKey
ALTER TABLE `attempt` DROP FOREIGN KEY `Attempt_participantId_fkey`;

-- DropForeignKey
ALTER TABLE `material` DROP FOREIGN KEY `Material_moduleId_fkey`;

-- DropForeignKey
ALTER TABLE `option` DROP FOREIGN KEY `Option_questionId_fkey`;

-- DropForeignKey
ALTER TABLE `participant` DROP FOREIGN KEY `Participant_activityId_fkey`;

-- DropForeignKey
ALTER TABLE `question` DROP FOREIGN KEY `Question_moduleId_fkey`;

-- RedefineIndex
DROP INDEX `Activity_moduleId_idx` ON `activity`;
CREATE INDEX `activity_moduleId_idx` ON `activity`(`moduleId`);

-- RedefineIndex
DROP INDEX `Answer_attemptId_questionId_key` ON `answer`;
CREATE UNIQUE INDEX `answer_attemptId_questionId_key` ON `answer`(`attemptId`, `questionId`);

-- RedefineIndex
DROP INDEX `Attempt_participantId_section_idx` ON `attempt`;
CREATE INDEX `attempt_participantId_section_idx` ON `attempt`(`participantId`, `section`);

-- RedefineIndex
DROP INDEX `Material_moduleId_idx` ON `material`;
CREATE INDEX `material_moduleId_idx` ON `material`(`moduleId`);

-- RedefineIndex
DROP INDEX `Option_questionId_idx` ON `option`;
CREATE INDEX `option_questionId_idx` ON `option`(`questionId`);

-- RedefineIndex
DROP INDEX `Participant_activityId_idx` ON `participant`;
CREATE INDEX `participant_activityId_idx` ON `participant`(`activityId`);

-- RedefineIndex
DROP INDEX `Participant_token_key` ON `participant`;
CREATE UNIQUE INDEX `participant_token_key` ON `participant`(`token`);

-- RedefineIndex
DROP INDEX `Question_moduleId_section_idx` ON `question`;
CREATE INDEX `question_moduleId_section_idx` ON `question`(`moduleId`, `section`);

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
