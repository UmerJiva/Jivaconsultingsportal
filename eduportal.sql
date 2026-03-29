-- ============================================================
--  EduPortal Admin Panel — MySQL Database
--  Version: 2.0 (Full Functional with bcrypt hashes)
--  Compatible: MySQL 8.0+ / MariaDB 10.5+
--
--  DEFAULT PASSWORDS:
--    admin@eduportal.com   → Admin@123
--    agent@eduportal.com   → Agent@123
--    student@eduportal.com → Student@123
-- ============================================================

CREATE DATABASE IF NOT EXISTS `eduportal`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `eduportal`;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- TABLES
-- ============================================================

DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `application_status_history`;
DROP TABLE IF EXISTS `applications`;
DROP TABLE IF EXISTS `student_documents`;
DROP TABLE IF EXISTS `students`;
DROP TABLE IF EXISTS `programs`;
DROP TABLE IF EXISTS `university_intakes`;
DROP TABLE IF EXISTS `universities`;
DROP TABLE IF EXISTS `agents`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `countries`;

CREATE TABLE `countries` (
  `id`   SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `code` CHAR(2)      NOT NULL UNIQUE,
  `flag` VARCHAR(10)  DEFAULT NULL
) ENGINE=InnoDB;

CREATE TABLE `users` (
  `id`         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name`       VARCHAR(100) NOT NULL,
  `email`      VARCHAR(150) NOT NULL UNIQUE,
  `password`   VARCHAR(255) NOT NULL COMMENT 'bcrypt hash',
  `role`       ENUM('admin','agent','student') NOT NULL DEFAULT 'student',
  `avatar`     VARCHAR(10)  DEFAULT NULL,
  `is_active`  TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_role`  (`role`),
  INDEX `idx_email` (`email`)
) ENGINE=InnoDB;

CREATE TABLE `agents` (
  `id`                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id`           INT UNSIGNED NOT NULL UNIQUE,
  `city`              VARCHAR(100) DEFAULT NULL,
  `country_id`        SMALLINT UNSIGNED DEFAULT NULL,
  `phone`             VARCHAR(30)  DEFAULT NULL,
  `commission_total`  DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `status`            ENUM('Active','Inactive','Suspended') NOT NULL DEFAULT 'Active',
  `joined_at`         DATE         DEFAULT NULL,
  `created_at`        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`)    REFERENCES `users`(`id`)     ON DELETE CASCADE,
  FOREIGN KEY (`country_id`) REFERENCES `countries`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE `universities` (
  `id`             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name`           VARCHAR(200) NOT NULL,
  `country_id`     SMALLINT UNSIGNED DEFAULT NULL,
  `world_ranking`  SMALLINT UNSIGNED DEFAULT NULL,
  `logo_initials`  VARCHAR(5)  DEFAULT NULL,
  `website`        VARCHAR(200) DEFAULT NULL,
  `tuition_info`   VARCHAR(100) DEFAULT NULL,
  `status`         ENUM('Partner','Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_at`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`country_id`) REFERENCES `countries`(`id`) ON DELETE SET NULL,
  INDEX `idx_ranking` (`world_ranking`)
) ENGINE=InnoDB;

CREATE TABLE `university_intakes` (
  `id`            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `university_id` INT UNSIGNED NOT NULL,
  `intake_name`   VARCHAR(50)  NOT NULL,
  FOREIGN KEY (`university_id`) REFERENCES `universities`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uq_uni_intake` (`university_id`, `intake_name`)
) ENGINE=InnoDB;

CREATE TABLE `programs` (
  `id`              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `university_id`   INT UNSIGNED NOT NULL,
  `name`            VARCHAR(200) NOT NULL,
  `level`           ENUM('Bachelor','Master','PhD','Diploma','Certificate') NOT NULL DEFAULT 'Bachelor',
  `duration_years`  DECIMAL(3,1) DEFAULT NULL,
  `tuition_fee`     DECIMAL(12,2) DEFAULT NULL,
  `currency`        CHAR(3)      DEFAULT 'USD',
  `is_active`       TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`university_id`) REFERENCES `universities`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `students` (
  `id`              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id`         INT UNSIGNED NOT NULL UNIQUE,
  `agent_id`        INT UNSIGNED DEFAULT NULL,
  `phone`           VARCHAR(30)  DEFAULT NULL,
  `country_id`      SMALLINT UNSIGNED DEFAULT NULL,
  `date_of_birth`   DATE         DEFAULT NULL,
  `passport_no`     VARCHAR(30)  DEFAULT NULL,
  `address`         TEXT         DEFAULT NULL,
  `gpa`             DECIMAL(4,2) DEFAULT NULL,
  `ielts_score`     DECIMAL(3,1) DEFAULT NULL,
  `toefl_score`     SMALLINT     DEFAULT NULL,
  `sat_score`       SMALLINT     DEFAULT NULL,
  `target_program`  VARCHAR(200) DEFAULT NULL,
  `target_intake`   VARCHAR(50)  DEFAULT NULL,
  `status`          ENUM('Active','Pending','Rejected','Enrolled','Graduated','Withdrawn') NOT NULL DEFAULT 'Pending',
  `notes`           TEXT         DEFAULT NULL,
  `created_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`)    REFERENCES `users`(`id`)     ON DELETE CASCADE,
  FOREIGN KEY (`agent_id`)   REFERENCES `agents`(`id`)    ON DELETE SET NULL,
  FOREIGN KEY (`country_id`) REFERENCES `countries`(`id`) ON DELETE SET NULL,
  INDEX `idx_status`   (`status`),
  INDEX `idx_agent_id` (`agent_id`)
) ENGINE=InnoDB;

CREATE TABLE `student_documents` (
  `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `student_id`  INT UNSIGNED NOT NULL,
  `doc_type`    ENUM('Passport','Transcript','IELTS Certificate','Bank Statement',
                     'Recommendation Letter','SOP','CV','Other') NOT NULL,
  `file_name`   VARCHAR(255) NOT NULL,
  `file_url`    VARCHAR(500) DEFAULT NULL,
  `uploaded_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `verified`    TINYINT(1)   NOT NULL DEFAULT 0,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `applications` (
  `id`             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `app_code`       VARCHAR(20)  NOT NULL UNIQUE,
  `student_id`     INT UNSIGNED NOT NULL,
  `university_id`  INT UNSIGNED NOT NULL,
  `program_id`     INT UNSIGNED DEFAULT NULL,
  `agent_id`       INT UNSIGNED DEFAULT NULL,
  `intake`         VARCHAR(50)  DEFAULT NULL,
  `status`         ENUM('Draft','Submitted','Under Review','Conditional',
                        'Offer Received','Accepted','Rejected','Withdrawn','Enrolled')
                   NOT NULL DEFAULT 'Draft',
  `applied_date`   DATE         DEFAULT NULL,
  `decision_date`  DATE         DEFAULT NULL,
  `offer_letter`   VARCHAR(500) DEFAULT NULL,
  `notes`          TEXT         DEFAULT NULL,
  `created_at`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`)    REFERENCES `students`(`id`)     ON DELETE CASCADE,
  FOREIGN KEY (`university_id`) REFERENCES `universities`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`program_id`)    REFERENCES `programs`(`id`)     ON DELETE SET NULL,
  FOREIGN KEY (`agent_id`)      REFERENCES `agents`(`id`)       ON DELETE SET NULL,
  INDEX `idx_status`     (`status`),
  INDEX `idx_student_id` (`student_id`),
  INDEX `idx_agent_id`   (`agent_id`)
) ENGINE=InnoDB;

CREATE TABLE `application_status_history` (
  `id`              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `application_id`  INT UNSIGNED NOT NULL,
  `old_status`      VARCHAR(50)  DEFAULT NULL,
  `new_status`      VARCHAR(50)  NOT NULL,
  `changed_by`      INT UNSIGNED DEFAULT NULL,
  `note`            TEXT         DEFAULT NULL,
  `changed_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `notifications` (
  `id`         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id`    INT UNSIGNED NOT NULL,
  `title`      VARCHAR(200) NOT NULL,
  `message`    TEXT         DEFAULT NULL,
  `type`       ENUM('info','success','warning','error') NOT NULL DEFAULT 'info',
  `is_read`    TINYINT(1)   NOT NULL DEFAULT 0,
  `link`       VARCHAR(300) DEFAULT NULL,
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_read` (`user_id`, `is_read`)
) ENGINE=InnoDB;

CREATE TABLE `audit_logs` (
  `id`         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id`    INT UNSIGNED DEFAULT NULL,
  `action`     VARCHAR(100) NOT NULL,
  `table_name` VARCHAR(64)  DEFAULT NULL,
  `record_id`  INT UNSIGNED DEFAULT NULL,
  `old_values` JSON         DEFAULT NULL,
  `new_values` JSON         DEFAULT NULL,
  `ip_address` VARCHAR(45)  DEFAULT NULL,
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user`   (`user_id`),
  INDEX `idx_action` (`action`)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO `countries` (`name`, `code`, `flag`) VALUES
('Pakistan',        'PK', '🇵🇰'),
('Canada',          'CA', '🇨🇦'),
('Australia',       'AU', '🇦🇺'),
('United Kingdom',  'GB', '🇬🇧'),
('Germany',         'DE', '🇩🇪'),
('Singapore',       'SG', '🇸🇬'),
('United States',   'US', '🇺🇸'),
('UAE',             'AE', '🇦🇪'),
('Turkey',          'TR', '🇹🇷'),
('Malaysia',        'MY', '🇲🇾');

-- ── Users (bcrypt hashed passwords) ──────────────────────────
-- Admin@123, Agent@123, Student@123
INSERT INTO `users` (`id`,`name`,`email`,`password`,`role`,`avatar`) VALUES
(1,  'Sarah Mitchell',  'admin@eduportal.com',    '$2a$10$WZvtSTKswYobIcmqlLf5GOxCgEnaPdZzKvr/1d8WGLzD6rdU/4mSC', 'admin',   'SM'),
(2,  'James Rivera',    'agent@eduportal.com',    '$2a$10$a5W60IemAUG0JexqwqUZaO31gokGwxVVK93Ll1CtWAN8sUMVogeY6', 'agent',   'JR'),
(3,  'Aisha Khan',      'student@eduportal.com',  '$2a$10$E9p0QjaCgl4y/KmZS1FqjO6N2pN/B6rMJYUoSnXUkkCj8ioto0HRK', 'student', 'AK'),
(4,  'Priya Sharma',    'priya@agency.com',       '$2a$10$a5W60IemAUG0JexqwqUZaO31gokGwxVVK93Ll1CtWAN8sUMVogeY6', 'agent',   'PS'),
(5,  'Ali Hassan',      'ali@agency.com',         '$2a$10$a5W60IemAUG0JexqwqUZaO31gokGwxVVK93Ll1CtWAN8sUMVogeY6', 'agent',   'AH'),
(6,  'Emily Chen',      'emily@agency.com',       '$2a$10$a5W60IemAUG0JexqwqUZaO31gokGwxVVK93Ll1CtWAN8sUMVogeY6', 'agent',   'EC'),
(7,  'Marco Rossi',     'marco@agency.com',       '$2a$10$a5W60IemAUG0JexqwqUZaO31gokGwxVVK93Ll1CtWAN8sUMVogeY6', 'agent',   'MR'),
(8,  'Omar Farooq',     'omar@email.com',         '$2a$10$E9p0QjaCgl4y/KmZS1FqjO6N2pN/B6rMJYUoSnXUkkCj8ioto0HRK', 'student', 'OF'),
(9,  'Fatima Ali',      'fatima@email.com',       '$2a$10$E9p0QjaCgl4y/KmZS1FqjO6N2pN/B6rMJYUoSnXUkkCj8ioto0HRK', 'student', 'FA'),
(10, 'Bilal Hassan',    'bilal@email.com',        '$2a$10$E9p0QjaCgl4y/KmZS1FqjO6N2pN/B6rMJYUoSnXUkkCj8ioto0HRK', 'student', 'BH'),
(11, 'Sara Malik',      'sara@email.com',         '$2a$10$E9p0QjaCgl4y/KmZS1FqjO6N2pN/B6rMJYUoSnXUkkCj8ioto0HRK', 'student', 'SM'),
(12, 'Zain Ahmed',      'zain@email.com',         '$2a$10$E9p0QjaCgl4y/KmZS1FqjO6N2pN/B6rMJYUoSnXUkkCj8ioto0HRK', 'student', 'ZA');

INSERT INTO `agents` (`id`,`user_id`,`city`,`country_id`,`phone`,`commission_total`,`status`,`joined_at`) VALUES
(1, 2, 'Toronto', 2, '+1 416 555 0192',  12400.00, 'Active',   '2023-06-01'),
(2, 4, 'London',  4, '+44 20 7946 0892', 19800.00, 'Active',   '2023-03-15'),
(3, 5, 'Karachi', 1, '+92 21 3456 7890',  8100.00, 'Active',   '2023-09-20'),
(4, 6, 'Sydney',  3, '+61 2 9876 5432',  15300.00, 'Active',   '2022-11-10'),
(5, 7, 'Berlin',  5, '+49 30 1234 5678',  5400.00, 'Inactive', '2023-12-01');

INSERT INTO `universities` (`id`,`name`,`country_id`,`world_ranking`,`logo_initials`,`website`,`tuition_info`,`status`) VALUES
(1, 'University of Toronto',    2, 18,  'UT', 'utoronto.ca',       '$35,000 / year',    'Partner'),
(2, 'University of Melbourne',  3, 33,  'UM', 'unimelb.edu.au',    'AUD 42,000 / year', 'Partner'),
(3, 'Imperial College London',  4, 6,   'IC', 'imperial.ac.uk',    '£33,000 / year',    'Partner'),
(4, 'TU Munich',                5, 37,  'TM', 'tum.de',            '€0 + semester fee', 'Active'),
(5, 'University of Edinburgh',  4, 22,  'UE', 'ed.ac.uk',          '£26,000 / year',    'Partner'),
(6, 'NUS Singapore',            6, 8,   'NS', 'nus.edu.sg',        'SGD 38,000 / year', 'Active');

INSERT INTO `university_intakes` (`university_id`,`intake_name`) VALUES
(1,'Fall'),(1,'Winter'),(1,'Summer'),
(2,'February'),(2,'July'),
(3,'October'),
(4,'Winter'),(4,'Summer'),
(5,'September'),
(6,'August'),(6,'January');

INSERT INTO `programs` (`id`,`university_id`,`name`,`level`,`duration_years`,`tuition_fee`,`currency`) VALUES
(1,  1, 'BSc Computer Science',         'Bachelor', 4.0, 35000, 'USD'),
(2,  1, 'MSc Data Science',             'Master',   2.0, 38000, 'USD'),
(3,  1, 'MBA',                          'Master',   2.0, 52000, 'USD'),
(4,  2, 'MBA',                          'Master',   2.0, 42000, 'AUD'),
(5,  2, 'MSc Information Systems',      'Master',   1.5, 38000, 'AUD'),
(6,  3, 'MSc Data Science',             'Master',   1.0, 33000, 'GBP'),
(7,  3, 'MSc Artificial Intelligence',  'Master',   1.0, 35000, 'GBP'),
(8,  4, 'BEng Civil Engineering',       'Bachelor', 4.0,     0, 'EUR'),
(9,  4, 'MSc Computer Science',         'Master',   2.0,     0, 'EUR'),
(10, 5, 'BSc Nursing',                  'Bachelor', 4.0, 26000, 'GBP'),
(11, 5, 'MSc Artificial Intelligence',  'Master',   1.0, 28000, 'GBP'),
(12, 6, 'BComp Computer Science',       'Bachelor', 4.0, 38000, 'SGD'),
(13, 6, 'MSc Data Science & AI',        'Master',   1.0, 40000, 'SGD');

INSERT INTO `students` (`id`,`user_id`,`agent_id`,`phone`,`country_id`,`date_of_birth`,`passport_no`,`gpa`,`ielts_score`,`target_program`,`target_intake`,`status`) VALUES
(1, 3,  1, '+92 300 1234567', 1, '2000-03-15', 'AB1234567', 3.80, 7.5, 'BSc Computer Science',   'Fall 2024',   'Active'),
(2, 8,  1, '+92 321 9876543', 1, '1999-07-22', 'CD2345678', 3.50, 7.0, 'MBA',                    'Spring 2025', 'Pending'),
(3, 9,  2, '+92 333 5551234', 1, '2001-01-10', 'EF3456789', 3.90, 8.0, 'MSc Data Science',       'Fall 2024',   'Active'),
(4, 10, 1, '+92 345 7894561', 1, '1998-11-05', 'GH4567890', 3.20, 6.5, 'BEng Civil Engineering', 'Fall 2024',   'Rejected'),
(5, 11, 2, '+92 312 3216547', 1, '2002-05-18', 'IJ5678901', 3.70, 7.0, 'BSc Nursing',            'Spring 2025', 'Active'),
(6, 12, 1, '+92 301 8521476', 1, '2000-09-30', 'KL6789012', 3.95, 8.5, 'MSc AI',                 'Fall 2024',   'Active');

INSERT INTO `applications` (`id`,`app_code`,`student_id`,`university_id`,`program_id`,`agent_id`,`intake`,`status`,`applied_date`,`decision_date`) VALUES
(1, 'APP0001', 1, 1, 1,  1, 'Fall 2024',   'Offer Received', '2024-11-01', '2024-12-15'),
(2, 'APP0002', 2, 2, 4,  1, 'Spring 2025', 'Under Review',   '2024-12-15', NULL),
(3, 'APP0003', 3, 3, 6,  2, 'Fall 2024',   'Accepted',       '2024-10-20', '2024-11-30'),
(4, 'APP0004', 4, 4, 8,  1, 'Fall 2024',   'Rejected',       '2024-11-30', '2025-01-10'),
(5, 'APP0005', 5, 5, 10, 2, 'Spring 2025', 'Conditional',    '2024-12-01', '2025-01-05'),
(6, 'APP0006', 6, 5, 11, 1, 'Fall 2024',   'Offer Received', '2024-10-05', '2024-11-20');

INSERT INTO `application_status_history` (`application_id`,`old_status`,`new_status`,`changed_by`,`note`) VALUES
(1, NULL,           'Submitted',      2, 'Application submitted by agent'),
(1, 'Submitted',    'Under Review',   1, 'Documents verified'),
(1, 'Under Review', 'Offer Received', 1, 'Unconditional offer from UofT'),
(2, NULL,           'Submitted',      2, 'Submitted to Melbourne'),
(2, 'Submitted',    'Under Review',   1, 'Under review at Melbourne'),
(3, NULL,           'Submitted',      4, 'Submitted to Imperial'),
(3, 'Submitted',    'Accepted',       1, 'Full acceptance granted'),
(4, NULL,           'Submitted',      2, 'Submitted to TUM'),
(4, 'Submitted',    'Rejected',       1, 'GPA below threshold'),
(5, NULL,           'Submitted',      4, 'Submitted to Edinburgh'),
(5, 'Submitted',    'Conditional',    1, 'Conditional - improve IELTS'),
(6, NULL,           'Submitted',      2, 'Submitted to Edinburgh'),
(6, 'Submitted',    'Offer Received', 1, 'Offer received for MSc AI');

INSERT INTO `notifications` (`user_id`,`title`,`message`,`type`,`is_read`) VALUES
(3, 'Offer Received!',      'You have received an offer from University of Toronto.',  'success', 0),
(3, 'Document Required',    'Please upload your updated bank statement.',              'warning', 0),
(2, 'New Student Assigned', 'Omar Farooq has been assigned to your portfolio.',        'info',    1),
(2, 'Application Update',   'APP0003 status changed to Accepted.',                    'success', 0),
(1, 'Application Rejected', 'APP0004 (Bilal Hassan) has been rejected.',              'warning', 1);

-- ============================================================
-- VIEWS
-- ============================================================

CREATE OR REPLACE VIEW `v_applications_full` AS
SELECT
  a.id, a.app_code, a.status, a.intake,
  a.applied_date, a.decision_date,
  su.name    AS student_name,
  su.email   AS student_email,
  st.gpa, st.ielts_score,
  u.name     AS university_name,
  c.name     AS university_country,
  p.name     AS program_name,
  p.level    AS program_level,
  au.name    AS agent_name,
  au.email   AS agent_email
FROM applications a
JOIN students     st ON st.id = a.student_id
JOIN users        su ON su.id = st.user_id
JOIN universities u  ON u.id  = a.university_id
LEFT JOIN programs   p  ON p.id  = a.program_id
LEFT JOIN countries  c  ON c.id  = u.country_id
LEFT JOIN agents     ag ON ag.id = a.agent_id
LEFT JOIN users      au ON au.id = ag.user_id;

CREATE OR REPLACE VIEW `v_agent_stats` AS
SELECT
  ag.id AS agent_id,
  u.name, u.email, ag.city, c.name AS country,
  ag.status, ag.commission_total,
  COUNT(DISTINCT s.id) AS total_students,
  SUM(s.status = 'Active') AS active_students,
  COUNT(DISTINCT app.id) AS total_applications,
  SUM(app.status IN ('Accepted','Offer Received')) AS accepted_apps
FROM agents ag
JOIN users u ON u.id = ag.user_id
LEFT JOIN countries c ON c.id = ag.country_id
LEFT JOIN students s ON s.agent_id = ag.id
LEFT JOIN applications app ON app.agent_id = ag.id
GROUP BY ag.id;

CREATE OR REPLACE VIEW `v_student_profile` AS
SELECT
  s.id AS student_id,
  u.name, u.email, u.avatar, s.phone,
  c.name AS country, s.date_of_birth,
  s.gpa, s.ielts_score, s.toefl_score,
  s.target_program, s.target_intake, s.status,
  au.name AS agent_name
FROM students s
JOIN users u ON u.id = s.user_id
LEFT JOIN countries c ON c.id = s.country_id
LEFT JOIN agents ag ON ag.id = s.agent_id
LEFT JOIN users au ON au.id = ag.user_id;

-- ============================================================
-- END
-- ============================================================
