-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 03 Jul 2026 pada 21.44
-- Versi server: 10.4.32-MariaDB
-- Versi PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_protrack`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `no_spk` varchar(50) NOT NULL,
  `no_so` varchar(50) NOT NULL,
  `nama_customer` varchar(150) NOT NULL,
  `nama_artikel` varchar(150) NOT NULL,
  `warna` varchar(50) NOT NULL,
  `qty` decimal(10,2) NOT NULL,
  `no_mesin` varchar(50) DEFAULT NULL,
  `catatan` text DEFAULT NULL,
  `total_order_qty` decimal(10,2) DEFAULT NULL,
  `tanggal_lunas` date DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `orders`
--

INSERT INTO `orders` (`id`, `no_spk`, `no_so`, `nama_customer`, `nama_artikel`, `warna`, `qty`, `no_mesin`, `catatan`, `total_order_qty`, `tanggal_lunas`, `created_at`) VALUES
(1, '052600000123', '052600000456', 'PT. MAJU TERUS', 'RSN 2232 (10)', 'HT', 0.00, NULL, '', 100.00, NULL, '2026-05-22 21:37:13'),
(2, '062600000123', '062600000456', 'PT. PAIHO', 'RSN 2149 (10 MM)', 'PUTIH', 0.00, NULL, '', 1000.00, NULL, '2026-06-21 04:46:46'),
(3, '062600000111', '062600000222', 'PT ZINUS', 'TP 1267 - 40 MM', 'HIJAU', 0.00, NULL, '', 1000.00, NULL, '2026-06-27 07:27:21');

-- --------------------------------------------------------

--
-- Struktur dari tabel `unverified_shipments`
--

CREATE TABLE `unverified_shipments` (
  `id` int(11) NOT NULL,
  `no_spk_manual` varchar(50) NOT NULL,
  `nama_artikel_manual` varchar(100) NOT NULL,
  `warna_manual` varchar(50) DEFAULT NULL,
  `nama_customer_manual` varchar(100) DEFAULT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `jumlah_kemasan` int(11) NOT NULL,
  `no_mesin` varchar(20) NOT NULL,
  `catatan` text DEFAULT NULL,
  `pengirim_id` int(11) NOT NULL,
  `status` varchar(20) DEFAULT 'dikirim',
  `waktu_kirim` timestamp NOT NULL DEFAULT current_timestamp(),
  `jenis_kemasan` varchar(50) NOT NULL DEFAULT 'box'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `nama_lengkap` varchar(100) NOT NULL,
  `role` enum('operator','ppic','kepala_bagian','kepala_departemen','admin_produksi','staff_it') NOT NULL DEFAULT 'operator',
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `nama_lengkap`, `role`, `created_at`) VALUES
(1, 'bayu_op', '$2b$12$zZqyyT1NxsPULVQqhv8IheXKLDpdqJRCvJs5nFkkQAFw0BNQk8Yuq', 'Budi Operator', 'operator', '2026-05-18 10:46:00'),
(2, 'admin_ppic', '$2b$12$N1PmPiMbbkWiICWK2LgGWew6J3FdZGU0tSSl1587HcymR99Znm0Si', 'Siti PPIC', 'ppic', '2026-05-18 10:49:57'),
(3, 'Ardy_OP', '$2b$12$ZzZHNGjKqyWSm6EhNKGHs.ug/iA2gPr3A/heWqKQ.UphNHzapJgWW', 'Bayu Ardy Saputra', 'operator', '2026-05-24 01:42:59'),
(4, 'kabag_P2', '$2b$12$IpQMVjIJ4IJMCFEmFsd3guv1WccehPdKwZjrK2UEZqSh6V/G/4teS', 'trisno', 'kepala_bagian', '2026-06-21 03:48:47'),
(5, 'kadep_p2', '$2b$12$npzTGcD20GzuxbymzhozKONkNi9QCMQEtVmuWrwvvqgKCNyR9CbpK', 'nano', 'kepala_departemen', '2026-06-21 04:04:10'),
(6, 'staff_IT', '$2b$12$6DbMrKV4lq.4uYqHBxWZpuknaxLUrRQu1Vd1JJLRCE9HlgVYmueha', 'herman', 'staff_it', '2026-06-21 04:06:00'),
(7, 'admin_prod', '$2b$12$T6bY.yiHFg71.qadwzqjuOq0j1aYPuclxQb9CPPMz90TlRO/2h/w6', 'rini', 'admin_produksi', '2026-06-21 04:08:57');

-- --------------------------------------------------------

--
-- Struktur dari tabel `wip_shipments`
--

CREATE TABLE `wip_shipments` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `jumlah_kemasan` int(11) NOT NULL,
  `no_mesin` varchar(50) NOT NULL,
  `pengirim_id` int(11) NOT NULL,
  `penerima_id` int(11) DEFAULT NULL,
  `status` enum('dikirim','diterima','bermasalah') DEFAULT 'dikirim',
  `waktu_kirim` datetime DEFAULT current_timestamp(),
  `waktu_terima` datetime DEFAULT NULL,
  `foto_label_url` text DEFAULT NULL,
  `catatan` text DEFAULT NULL,
  `jenis_kemasan` varchar(50) NOT NULL DEFAULT 'box'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `wip_shipments`
--

INSERT INTO `wip_shipments` (`id`, `order_id`, `quantity`, `jumlah_kemasan`, `no_mesin`, `pengirim_id`, `penerima_id`, `status`, `waktu_kirim`, `waktu_terima`, `foto_label_url`, `catatan`, `jenis_kemasan`) VALUES
(20, 2, 5.00, 1, 'M 01', 3, 3, 'diterima', '2026-06-26 13:12:45', '2026-06-26 13:13:00', NULL, '', 'kardus'),
(21, 2, 5.50, 1, 'M 01', 3, 3, 'diterima', '2026-06-26 13:12:45', '2026-06-26 13:12:58', NULL, '', 'kardus');

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `no_spk` (`no_spk`);

--
-- Indeks untuk tabel `unverified_shipments`
--
ALTER TABLE `unverified_shipments`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indeks untuk tabel `wip_shipments`
--
ALTER TABLE `wip_shipments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `pengirim_id` (`pengirim_id`),
  ADD KEY `penerima_id` (`penerima_id`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT untuk tabel `unverified_shipments`
--
ALTER TABLE `unverified_shipments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT untuk tabel `wip_shipments`
--
ALTER TABLE `wip_shipments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `wip_shipments`
--
ALTER TABLE `wip_shipments`
  ADD CONSTRAINT `wip_shipments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  ADD CONSTRAINT `wip_shipments_ibfk_2` FOREIGN KEY (`pengirim_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `wip_shipments_ibfk_3` FOREIGN KEY (`penerima_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
