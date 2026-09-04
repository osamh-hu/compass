-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: 13 أبريل 2026 الساعة 05:01
-- إصدار الخادم: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `compass`
--

-- --------------------------------------------------------

--
-- بنية الجدول `compass_logs`
--

CREATE TABLE `compass_logs` (
  `id` int(11) NOT NULL,
  `angle` float DEFAULT NULL,
  `direction` varchar(10) DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- إرجاع أو استيراد بيانات الجدول `compass_logs`
--

INSERT INTO `compass_logs` (`id`, `angle`, `direction`, `location`, `created_at`) VALUES
(1, 320, 'NW', 'Test Location', '2026-04-12 00:15:25'),
(3, 0, 'E', 'Yemen - Marib', '2026-04-12 01:02:10'),
(4, 0, 'N', 'Yemen - Marib', '2026-04-12 01:08:14');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `compass_logs`
--
ALTER TABLE `compass_logs`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `compass_logs`
--
ALTER TABLE `compass_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
