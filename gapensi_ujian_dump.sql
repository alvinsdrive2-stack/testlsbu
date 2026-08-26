-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: gapensi_ujian
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('16be7a85-1595-4b61-a8e3-8999523ce398','f546da00675acb7ff2f3d31934a7fab6847ce3e7f5ae337b4c9cd5895d399d1d',NULL,'20260824044020_lowercase_table_names','A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260824044020_lowercase_table_names\n\nDatabase error code: 1061\n\nDatabase error:\nDuplicate key name \'activity_moduleId_idx\'\n\nPlease check the query number 19 from the migration file.\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name=\"20260824044020_lowercase_table_names\"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name=\"20260824044020_lowercase_table_names\"\n             at schema-engine\\commands\\src\\commands\\apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:260','2026-08-24 04:42:02.726','2026-08-24 04:40:20.705',0),('8020c30a-a896-4db6-8051-9bfe6fdc76d2','acfed0098e0d7599d5d41c2e145ba238b21be174c407f8d47a177f0b26588a8f','2026-08-21 06:52:06.678','20260821065206_module_answer_review',NULL,NULL,'2026-08-21 06:52:06.664',1),('92d6a71e-0caf-4e53-bd60-157b77b8da89','502239300018969265c852f02e4682685e13ac670edf88c9ba996772b6ea106f','2026-08-20 10:02:17.340','20260820100217_question_explanation',NULL,NULL,'2026-08-20 10:02:17.325',1),('a2db9fa2-26a3-4b62-864f-18d9627a03ac','45a48dda1b947b6ba8631717bda272658e8b677a0b55edfda596f6e1f83b2f14','2026-08-24 04:42:02.727','20260824044020_lowercase_table_names','',NULL,'2026-08-24 04:42:02.727',0),('bc897a28-a085-4556-bb7c-108c24c12b3e','579a7c96d3bc1c70d213c763e6c545edf9efdf19cce0066575794e77f4bc8e8c','2026-08-21 03:13:41.316','20260821031341_question_explanation_text',NULL,NULL,'2026-08-21 03:13:41.252',1),('bd3bc370-4f88-4d54-a6a3-b0fff3670b61','0b4b95c6474ca461a84bbd44bbf93b9a2b7e0ea0d3c3b0b24b2b092c4f258c44','2026-08-19 10:31:09.130','20260819103108_init',NULL,NULL,'2026-08-19 10:31:08.539',1),('c7f2af84-6d9c-44e2-ad07-4236b2a688ee','bccf55ec86c7b92398674412eaa8ba1a11e4b238edda27c8cd3af178aa57392c','2026-08-21 06:56:29.363','20260821065800_activity_schedule',NULL,NULL,'2026-08-21 06:56:29.322',1),('eacd51ac-ee61-4f6b-9d84-d789f6aa9763','de57ae425d635d00b614b4e7fb45eca7c1c81c4979d362d1519539b6a4e8dfa2','2026-08-21 06:50:21.720','20260821065021_material_pdf',NULL,NULL,'2026-08-21 06:50:21.701',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `activity`
--

DROP TABLE IF EXISTS `activity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activity` (
  `id` varchar(191) NOT NULL,
  `moduleId` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `registrationStart` datetime(3) DEFAULT NULL,
  `pretestStart` datetime(3) DEFAULT NULL,
  `materialStart` datetime(3) DEFAULT NULL,
  `posttestStart` datetime(3) DEFAULT NULL,
  `closedAt` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `activity_moduleId_idx` (`moduleId`),
  CONSTRAINT `activity_moduleId_fkey` FOREIGN KEY (`moduleId`) REFERENCES `module` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity`
--

LOCK TABLES `activity` WRITE;
/*!40000 ALTER TABLE `activity` DISABLE KEYS */;
INSERT INTO `activity` VALUES ('cmt5mg8bm00011he0cbwxjift','cmt1cg9fg00121h4cftvyg0dp','KEGIATAN 1 PASAR MINGGU','2026-08-23 09:45:37.568','2026-08-23 09:46:00.000','2026-08-23 09:52:00.000','2026-08-23 09:54:00.000','2026-08-23 09:55:00.000','2026-08-23 09:59:00.000');
/*!40000 ALTER TABLE `activity` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `answer`
--

DROP TABLE IF EXISTS `answer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `answer` (
  `id` varchar(191) NOT NULL,
  `attemptId` varchar(191) NOT NULL,
  `questionId` varchar(191) NOT NULL,
  `optionId` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `answer_attemptId_questionId_key` (`attemptId`,`questionId`),
  KEY `answer_questionId_fkey` (`questionId`),
  KEY `answer_optionId_fkey` (`optionId`),
  CONSTRAINT `answer_attemptId_fkey` FOREIGN KEY (`attemptId`) REFERENCES `attempt` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `answer_optionId_fkey` FOREIGN KEY (`optionId`) REFERENCES `option` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `answer_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `question` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `answer`
--

LOCK TABLES `answer` WRITE;
/*!40000 ALTER TABLE `answer` DISABLE KEYS */;
INSERT INTO `answer` VALUES ('cmt5mok9400071he04rvrr75w','cmt5mojli00051he0pz5zcwzh','cmt2f4jsw00011h0c3hybebxp','cmt2f55mt00091h0cohza146b'),('cmt5msgrq000b1he09u9qqgry','cmt5mser100091he0ct2up5c7','cmt2f4jsw00011h0c3hybebxp','cmt2f50hh00071h0c5u8t0810');
/*!40000 ALTER TABLE `answer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attempt`
--

DROP TABLE IF EXISTS `attempt`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `attempt` (
  `id` varchar(191) NOT NULL,
  `participantId` varchar(191) NOT NULL,
  `section` enum('PRETEST','POSTTEST') NOT NULL,
  `seed` int(11) NOT NULL,
  `score` int(11) DEFAULT NULL,
  `passed` tinyint(1) DEFAULT NULL,
  `startedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `submittedAt` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `attempt_participantId_section_idx` (`participantId`,`section`),
  CONSTRAINT `attempt_participantId_fkey` FOREIGN KEY (`participantId`) REFERENCES `participant` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attempt`
--

LOCK TABLES `attempt` WRITE;
/*!40000 ALTER TABLE `attempt` DISABLE KEYS */;
INSERT INTO `attempt` VALUES ('cmt5mojli00051he0pz5zcwzh','cmt5mh27300031he0rqrh4ux1','PRETEST',1301318713,100,1,'2026-08-23 09:52:05.430','2026-08-23 09:52:07.961'),('cmt5mser100091he0ct2up5c7','cmt5mh27300031he0rqrh4ux1','POSTTEST',1381443741,0,0,'2026-08-23 09:55:05.773','2026-08-23 09:55:12.710');
/*!40000 ALTER TABLE `attempt` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `material`
--

DROP TABLE IF EXISTS `material`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `material` (
  `id` varchar(191) NOT NULL,
  `moduleId` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `content` varchar(191) NOT NULL,
  `videoUrl` varchar(191) DEFAULT NULL,
  `order` int(11) NOT NULL,
  `pdfUrl` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `material_moduleId_idx` (`moduleId`),
  CONSTRAINT `material_moduleId_fkey` FOREIGN KEY (`moduleId`) REFERENCES `module` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material`
--

LOCK TABLES `material` WRITE;
/*!40000 ALTER TABLE `material` DISABLE KEYS */;
INSERT INTO `material` VALUES ('cmt0xcslr000a1huwokzsu9iy','cmt0xcsfl00001huw2in80the','Pengantar SBU','Materi pengantar',NULL,1,NULL),('cmt2f6fws000b1h0cqedqcxxd','cmt1cg9fg00121h4cftvyg0dp','SIAPAKAH ALVIN','<h2><strong>ssadasdasdasda</strong></h2><h3>asdasdasdasdasd</h3><p></p>','https://www.youtube.com/watch?v=vezAOZia6Fs',1,NULL),('cmt2f75a3000d1h0cxweugwl3','cmt1cg9fg00121h4cftvyg0dp','ALVIN 2026','<h2><strong>ssadasdasdasda</strong></h2><h3>asdasdasdasdasd</h3><p></p>',NULL,2,NULL);
/*!40000 ALTER TABLE `material` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `module`
--

DROP TABLE IF EXISTS `module`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `module` (
  `id` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `shuffleQuestions` tinyint(1) NOT NULL DEFAULT 0,
  `shuffleOptions` tinyint(1) NOT NULL DEFAULT 0,
  `pretestDurationMin` int(11) NOT NULL DEFAULT 30,
  `posttestDurationMin` int(11) NOT NULL DEFAULT 30,
  `pretestPassingGrade` int(11) NOT NULL DEFAULT 0,
  `posttestPassingGrade` int(11) NOT NULL DEFAULT 70,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `showAnswerReview` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `module`
--

LOCK TABLES `module` WRITE;
/*!40000 ALTER TABLE `module` DISABLE KEYS */;
INSERT INTO `module` VALUES ('cmt0xcsfl00001huw2in80the','Sertifikasi BUJK 2026',NULL,0,0,30,30,0,70,'2026-08-20 02:52:01.899','2026-08-20 02:52:01.899',0),('cmt1cg9fg00121h4cftvyg0dp','sasdasd','s',0,0,30,30,0,70,'2026-08-20 09:54:38.139','2026-08-20 09:54:38.139',0);
/*!40000 ALTER TABLE `module` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `option`
--

DROP TABLE IF EXISTS `option`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `option` (
  `id` varchar(191) NOT NULL,
  `questionId` varchar(191) NOT NULL,
  `text` varchar(191) NOT NULL,
  `isCorrect` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `option_questionId_idx` (`questionId`),
  CONSTRAINT `option_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `question` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `option`
--

LOCK TABLES `option` WRITE;
/*!40000 ALTER TABLE `option` DISABLE KEYS */;
INSERT INTO `option` VALUES ('cmt0xcsl300041huwyfasu7f8','cmt0xcsk900021huwoblikuc5','Konsultan',0),('cmt0xcslb00061huwsirfee0g','cmt0xcsk900021huwoblikuc5','Kontraktor',1),('cmt0xcslp00081huwtbasewek','cmt0xcsk900021huwoblikuc5','Supir',0),('cmt0y2ghk00031hgwuh2dsv26','cmt0y2gh800011hgwfvp1zgmv','5 tahun',1),('cmt0y2ghr00051hgwsdz25obt','cmt0y2gh800011hgwfvp1zgmv','1 tahun',0),('cmt0y2ghw00091hgwm6m54l7u','cmt0y2ghu00071hgwx2zatyui','Syarat tender',1),('cmt0y2gi0000b1hgw6i8pit65','cmt0y2ghu00071hgwx2zatyui','Plat nomor',0),('cmt2f4skz00031h0c9z3wx0v0','cmt2f4jsw00011h0c3hybebxp','IYA',0),('cmt2f4vhx00051h0c74ne7r7g','cmt2f4jsw00011h0c3hybebxp','TIDAK',0),('cmt2f50hh00071h0c5u8t0810','cmt2f4jsw00011h0c3hybebxp','BISA JADI',0),('cmt2f55mt00091h0cohza146b','cmt2f4jsw00011h0c3hybebxp','IYA KEREN BANGET',1);
/*!40000 ALTER TABLE `option` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `participant`
--

DROP TABLE IF EXISTS `participant`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `participant` (
  `id` varchar(191) NOT NULL,
  `activityId` varchar(191) NOT NULL,
  `token` varchar(191) NOT NULL,
  `nama` varchar(191) NOT NULL,
  `badanUsaha` varchar(191) NOT NULL,
  `npwp` varchar(191) NOT NULL,
  `wa` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `isGapensiMember` tinyint(1) NOT NULL,
  `stage` enum('REGISTERED','PRETEST_DONE','POSTTEST_PASSED') NOT NULL DEFAULT 'REGISTERED',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `participant_token_key` (`token`),
  KEY `participant_activityId_idx` (`activityId`),
  CONSTRAINT `participant_activityId_fkey` FOREIGN KEY (`activityId`) REFERENCES `activity` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `participant`
--

LOCK TABLES `participant` WRITE;
/*!40000 ALTER TABLE `participant` DISABLE KEYS */;
INSERT INTO `participant` VALUES ('cmt5mh27300031he0rqrh4ux1','cmt5mg8bm00011he0cbwxjift','461ed557-64a6-41b7-8827-716eb5615c26','Ananda Alviansyah Sudarmawan','PT ANAJAY','12451351351','4312415132123','alvians.alvians@yahoo.com',1,'PRETEST_DONE','2026-08-23 09:46:16.288');
/*!40000 ALTER TABLE `participant` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `question`
--

DROP TABLE IF EXISTS `question`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `question` (
  `id` varchar(191) NOT NULL,
  `moduleId` varchar(191) NOT NULL,
  `section` enum('PRETEST','POSTTEST') NOT NULL,
  `text` varchar(191) NOT NULL,
  `order` int(11) NOT NULL,
  `explanation` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `question_moduleId_section_idx` (`moduleId`,`section`),
  CONSTRAINT `question_moduleId_fkey` FOREIGN KEY (`moduleId`) REFERENCES `module` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `question`
--

LOCK TABLES `question` WRITE;
/*!40000 ALTER TABLE `question` DISABLE KEYS */;
INSERT INTO `question` VALUES ('cmt0xcsk900021huwoblikuc5','cmt0xcsfl00001huw2in80the','PRETEST','Apa itu SBU?',1,NULL),('cmt0y2gh800011hgwfvp1zgmv','cmt0xcsfl00001huw2in80the','PRETEST','Kapan SBU wajib diperbarui?',2,NULL),('cmt0y2ghu00071hgwx2zatyui','cmt0xcsfl00001huw2in80the','POSTTEST','Apa fungsi SBU?',1,NULL),('cmt2f4jsw00011h0c3hybebxp','cmt1cg9fg00121h4cftvyg0dp','PRETEST','APAKAH SAYA KEREN?\r\n',1,'ALVIN EMANG KEREN');
/*!40000 ALTER TABLE `question` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-24 11:50:32
