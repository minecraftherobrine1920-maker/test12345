-- =======================================================
-- database.sql
-- Smart Traffic Fine Verification & Dispute System
-- =======================================================
-- HOW TO IMPORT:
--   1. Open phpMyAdmin (http://localhost/phpmyadmin)
--   2. Click "Import" tab
--   3. Choose this file and click "Go"
-- =======================================================


-- -------------------------------------------------------
-- Step 1: Create & select the database
-- -------------------------------------------------------
CREATE DATABASE IF NOT EXISTS `traffic_fines`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `traffic_fines`;


-- -------------------------------------------------------
-- Step 2: Drop existing tables (for clean re-import)
-- -------------------------------------------------------
DROP TABLE IF EXISTS `disputes`;
DROP TABLE IF EXISTS `fines`;


-- -------------------------------------------------------
-- Step 3: Create `fines` table
-- -------------------------------------------------------
CREATE TABLE `fines` (
  `id`             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `vehicle_number` VARCHAR(20)    NOT NULL,
  `date`           DATE           NOT NULL,
  `time`           TIME           NOT NULL DEFAULT '00:00:00',
  `location`       VARCHAR(255)   NOT NULL,
  `violation`      VARCHAR(100)   NOT NULL,
  `amount`         DECIMAL(10,2)  NOT NULL,
  `image_url`      VARCHAR(500)   NOT NULL DEFAULT '',
  `latitude`       DECIMAL(10,6)  NOT NULL DEFAULT 0.000000,
  `longitude`      DECIMAL(10,6)  NOT NULL DEFAULT 0.000000,
  `created_at`     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX `idx_vehicle` (`vehicle_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- -------------------------------------------------------
-- Step 4: Create `disputes` table
-- -------------------------------------------------------
CREATE TABLE `disputes` (
  `id`             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `vehicle_number` VARCHAR(20)    NOT NULL,
  `fine_id`        INT UNSIGNED   DEFAULT NULL,
  `name`           VARCHAR(100)   NOT NULL,
  `email`          VARCHAR(150)   NOT NULL,
  `reason`         TEXT           NOT NULL,
  `proof_path`     VARCHAR(500)   DEFAULT NULL,
  `status`         ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  `created_at`     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX `idx_vehicle`   (`vehicle_number`),
  INDEX `idx_status`    (`status`),
  INDEX `idx_created`   (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- -------------------------------------------------------
-- Step 5: Seed `fines` with 5 sample records
--
--   Vehicle Numbers to test:
--     MH12AB1234  — Mumbai signal jumping
--     DL5CAB5678  — Delhi overspeeding
--     KA01MF9900  — Bangalore no helmet
--     TN22CD3456  — Chennai wrong-way driving
--     GJ01XX7777  — Ahmedabad phone usage
-- -------------------------------------------------------
INSERT INTO `fines`
  (vehicle_number, date, time, location, violation, amount, image_url, latitude, longitude)
VALUES

-- Fine 1: Mumbai — Signal Jumping
(
  'MH12AB1234',
  '2024-11-15',
  '09:32:00',
  'Andheri West Signal, SV Road, Mumbai, Maharashtra',
  'Signal Jumping (Red Light)',
  1500.00,
  'https://images.unsplash.com/photo-1612817831259-e81234b5ca59?w=600&q=80',
  19.119880,
  72.846260
),

-- Fine 2: Delhi — Overspeeding
(
  'DL5CAB5678',
  '2024-11-20',
  '14:15:00',
  'NH-48, Mahipalpur Flyover, New Delhi',
  'Overspeeding (102 km/h in 60 zone)',
  2000.00,
  'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&q=80',
  28.546730,
  77.122210
),

-- Fine 3: Bengaluru — No Helmet
(
  'KA01MF9900',
  '2024-11-22',
  '08:05:00',
  'Outer Ring Road, Marathahalli Junction, Bengaluru, Karnataka',
  'Riding Without Helmet',
  1000.00,
  'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&q=80',
  12.956110,
  77.701190
),

-- Fine 4: Chennai — Wrong Way
(
  'TN22CD3456',
  '2024-11-25',
  '11:47:00',
  'Anna Salai (Mount Road), Teynampet, Chennai, Tamil Nadu',
  'Driving Against Traffic (Wrong Way)',
  3000.00,
  'https://images.unsplash.com/photo-1597392582469-a697322d5c58?w=600&q=80',
  13.050200,
  80.247500
),

-- Fine 5: Ahmedabad — Mobile Phone While Driving
(
  'GJ01XX7777',
  '2024-12-01',
  '17:22:00',
  'CG Road, Navrangpura, Ahmedabad, Gujarat',
  'Using Mobile Phone While Driving',
  1500.00,
  'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=600&q=80',
  23.037900,
  72.565600
);


-- -------------------------------------------------------
-- Step 6: Seed `disputes` with 3 sample records
--   (These demonstrate all three statuses)
-- -------------------------------------------------------
INSERT INTO `disputes`
  (vehicle_number, fine_id, name, email, reason, status, created_at)
VALUES

-- Dispute 1: Pending — MH12AB1234
(
  'MH12AB1234',
  1,
  'Rahul Sharma',
  'rahul.sharma@email.com',
  'I was not the driver of the vehicle on the mentioned date. My car was being serviced at Sai Motors, Andheri West. I have the service receipt as proof.',
  'Pending',
  '2024-11-17 10:23:00'
),

-- Dispute 2: Approved — DL5CAB5678
(
  'DL5CAB5678',
  2,
  'Priya Verma',
  'priya.v@gmail.com',
  'The speedometer was recently calibrated. I was driving within limits. The camera reading was from a defective unit that has been flagged by other motorists as well.',
  'Approved',
  '2024-11-22 14:55:00'
),

-- Dispute 3: Rejected — KA01MF9900
(
  'KA01MF9900',
  3,
  'Suresh Naidu',
  'suresh.naidu@outlook.com',
  'I was wearing a helmet at the time. The camera angle does not clearly show my head. Please review the footage again.',
  'Rejected',
  '2024-11-24 09:10:00'
);


-- -------------------------------------------------------
-- Verification queries (optional — run to check)
-- -------------------------------------------------------
-- SELECT * FROM fines;
-- SELECT * FROM disputes;
-- SELECT COUNT(*) AS total_fines FROM fines;
-- SELECT COUNT(*) AS total_disputes FROM disputes;

-- =======================================================
-- END OF database.sql
-- =======================================================
