-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 29-04-2026 a las 04:01:20
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `lagmet_db`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `maquinas`
--

CREATE TABLE `maquinas` (
  `id` int(11) NOT NULL,
  `numero_maquina` int(11) NOT NULL,
  `nombre_maquina` varchar(100) NOT NULL,
  `zona` enum('Oriente','Poniente') NOT NULL,
  `estado` enum('Si','No') DEFAULT 'Si',
  `observacion` text DEFAULT NULL,
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `maquinas`
--

INSERT INTO `maquinas` (`id`, `numero_maquina`, `nombre_maquina`, `zona`, `estado`, `observacion`, `fecha_actualizacion`) VALUES
(1, 1, 'Máquina 1', 'Oriente', 'Si', NULL, '2026-04-27 14:51:10'),
(2, 2, 'Máquina 2', 'Oriente', 'Si', NULL, '2026-04-27 14:51:10'),
(3, 3, 'Máquina 3', 'Oriente', 'Si', NULL, '2026-04-27 14:51:10'),
(4, 4, 'Máquina 4', 'Oriente', 'Si', NULL, '2026-04-27 14:51:10'),
(5, 5, 'Máquina 5', 'Oriente', 'Si', NULL, '2026-04-27 14:51:10'),
(6, 6, 'Máquina 6', 'Oriente', 'Si', NULL, '2026-04-27 14:51:10'),
(7, 7, 'Máquina 7', 'Oriente', 'Si', NULL, '2026-04-27 14:51:10'),
(8, 8, 'Máquina 8', 'Oriente', 'Si', NULL, '2026-04-27 14:51:10'),
(9, 9, 'Máquina 9', 'Oriente', 'Si', NULL, '2026-04-27 14:51:10'),
(10, 10, 'Máquina 10', 'Poniente', 'Si', NULL, '2026-04-27 14:51:10'),
(11, 11, 'Máquina 11', 'Poniente', 'Si', NULL, '2026-04-27 14:51:10'),
(12, 12, 'Máquina 12', 'Poniente', 'Si', NULL, '2026-04-27 14:51:10'),
(13, 13, 'Máquina 13', 'Poniente', 'Si', NULL, '2026-04-27 14:51:10'),
(14, 14, 'Máquina 14', 'Poniente', 'Si', NULL, '2026-04-27 14:51:10'),
(15, 15, 'Máquina 15', 'Poniente', 'Si', NULL, '2026-04-27 14:51:10'),
(16, 16, 'Máquina 16', 'Poniente', 'Si', NULL, '2026-04-27 14:51:10'),
(17, 17, 'Máquina 17', 'Poniente', 'Si', NULL, '2026-04-27 14:51:10'),
(18, 18, 'Máquina 18', 'Poniente', 'Si', NULL, '2026-04-27 14:51:10'),
(19, 19, 'Máquina 19', 'Poniente', 'Si', NULL, '2026-04-27 14:51:10');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `produccion`
--

CREATE TABLE `produccion` (
  `id` int(11) NOT NULL,
  `numero_pedido` varchar(100) NOT NULL,
  `codigo` varchar(100) NOT NULL,
  `producto` varchar(150) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `fecha` date DEFAULT NULL,
  `tiempo_muerto` int(11) DEFAULT 0,
  `dias` int(11) DEFAULT 0,
  `grupo` varchar(100) DEFAULT NULL,
  `almuerzo` varchar(10) DEFAULT 'no',
  `salida` varchar(20) DEFAULT '--',
  `usuario_id` int(11) DEFAULT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_fin` date DEFAULT NULL,
  `trabaja_sabado` varchar(2) DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `produccion`
--

INSERT INTO `produccion` (`id`, `numero_pedido`, `codigo`, `producto`, `cantidad`, `fecha`, `tiempo_muerto`, `dias`, `grupo`, `almuerzo`, `salida`, `usuario_id`, `fecha_registro`, `fecha_fin`, `trabaja_sabado`) VALUES
(1, '111222', '020202', 'descanso_1', 4, '2026-04-24', 0, 5, '1', 'no', '40h 0m → 3:30 P. M.', 1, '2026-04-27 15:31:50', '2026-05-04', 'no'),
(3, '343434', '231223', 'ajuste_manual', 5, '2026-04-25', 0, 5, '1', 'no', '35h 0m → 9:30 A. M.', 1, '2026-04-27 15:46:40', '2026-05-04', 'no'),
(4, '454545', '224434', 'metal_pesado', 4, '2026-04-21', 0, 1, '1', 'no', '8h 0m → 4:30 P. M.', 1, '2026-04-27 19:23:07', '2026-04-28', 'no'),
(5, '4343434', '12121212', 'prueba', 1, '2026-04-24', 0, 2, '1', 'no', '10h 0m → 9:15 A. M.', 1, '2026-04-29 00:45:49', '2026-04-25', 'si');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `produccion_maquinas`
--

CREATE TABLE `produccion_maquinas` (
  `id` int(11) NOT NULL,
  `produccion_id` int(11) NOT NULL,
  `zona` varchar(100) NOT NULL,
  `maquina` varchar(100) NOT NULL,
  `uso` varchar(10) DEFAULT 'no',
  `horas` int(11) DEFAULT 0,
  `minutos` int(11) DEFAULT 0,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `produccion_maquinas`
--

INSERT INTO `produccion_maquinas` (`id`, `produccion_id`, `zona`, `maquina`, `uso`, `horas`, `minutos`, `fecha_registro`) VALUES
(324, 4, 'oriente', 'Torno Vertical CNC', 'si', 2, 0, '2026-04-29 01:26:35'),
(325, 4, 'oriente', 'Mandrinadora', 'no', 0, 0, '2026-04-29 01:26:35'),
(326, 4, 'oriente', 'Torno Vertical', 'no', 0, 0, '2026-04-29 01:26:35'),
(327, 4, 'oriente', 'Mandrinadora', 'no', 0, 0, '2026-04-29 01:26:35'),
(328, 4, 'oriente', 'Torno 1000', 'no', 0, 0, '2026-04-29 01:26:35'),
(329, 4, 'oriente', 'Torno 800', 'no', 0, 0, '2026-04-29 01:26:35'),
(330, 4, 'oriente', 'Torno Bulgaro', 'no', 0, 0, '2026-04-29 01:26:35'),
(331, 4, 'oriente', 'Torno Varileta', 'no', 0, 0, '2026-04-29 01:26:35'),
(332, 4, 'oriente', 'Cepillo', 'no', 0, 0, '2026-04-29 01:26:35'),
(333, 4, 'oriente', 'Escoplo', 'no', 0, 0, '2026-04-29 01:26:35'),
(334, 4, 'oriente', 'Taladro Radial', 'no', 0, 0, '2026-04-29 01:26:35'),
(335, 4, 'poniente', 'Torno CNC 2', 'no', 0, 0, '2026-04-29 01:26:35'),
(336, 4, 'poniente', 'Torno CNC 3', 'no', 0, 0, '2026-04-29 01:26:35'),
(337, 4, 'poniente', 'Torno CNC 1', 'no', 0, 0, '2026-04-29 01:26:35'),
(338, 4, 'poniente', 'Centro Mecanizado 1', 'no', 0, 0, '2026-04-29 01:26:35'),
(339, 4, 'poniente', 'Centro Mecanizado 2', 'no', 0, 0, '2026-04-29 01:26:35'),
(340, 4, 'poniente', 'Router', 'no', 0, 0, '2026-04-29 01:26:35'),
(341, 4, 'poniente', 'Mecánica Banco', 'no', 0, 0, '2026-04-29 01:26:35'),
(342, 4, 'poniente', 'Balanceadora', 'no', 0, 0, '2026-04-29 01:26:35'),
(343, 3, 'oriente', 'Torno Vertical CNC', 'si', 7, 0, '2026-04-29 01:26:45'),
(344, 3, 'oriente', 'Mandrinadora', 'no', 0, 0, '2026-04-29 01:26:45'),
(345, 3, 'oriente', 'Torno Vertical', 'no', 0, 0, '2026-04-29 01:26:45'),
(346, 3, 'oriente', 'Mandrinadora', 'no', 0, 0, '2026-04-29 01:26:45'),
(347, 3, 'oriente', 'Torno 1000', 'no', 0, 0, '2026-04-29 01:26:45'),
(348, 3, 'oriente', 'Torno 800', 'no', 0, 0, '2026-04-29 01:26:45'),
(349, 3, 'oriente', 'Torno Bulgaro', 'no', 0, 0, '2026-04-29 01:26:45'),
(350, 3, 'oriente', 'Torno Varileta', 'no', 0, 0, '2026-04-29 01:26:45'),
(351, 3, 'oriente', 'Cepillo', 'no', 0, 0, '2026-04-29 01:26:45'),
(352, 3, 'oriente', 'Escoplo', 'no', 0, 0, '2026-04-29 01:26:45'),
(353, 3, 'oriente', 'Taladro Radial', 'no', 0, 0, '2026-04-29 01:26:45'),
(354, 3, 'poniente', 'Torno CNC 2', 'no', 0, 0, '2026-04-29 01:26:45'),
(355, 3, 'poniente', 'Torno CNC 3', 'no', 0, 0, '2026-04-29 01:26:45'),
(356, 3, 'poniente', 'Torno CNC 1', 'no', 0, 0, '2026-04-29 01:26:45'),
(357, 3, 'poniente', 'Centro Mecanizado 1', 'no', 0, 0, '2026-04-29 01:26:45'),
(358, 3, 'poniente', 'Centro Mecanizado 2', 'no', 0, 0, '2026-04-29 01:26:45'),
(359, 3, 'poniente', 'Router', 'no', 0, 0, '2026-04-29 01:26:45'),
(360, 3, 'poniente', 'Mecánica Banco', 'no', 0, 0, '2026-04-29 01:26:45'),
(361, 3, 'poniente', 'Balanceadora', 'no', 0, 0, '2026-04-29 01:26:45'),
(362, 1, 'oriente', 'Torno Vertical CNC', 'si', 10, 0, '2026-04-29 01:27:02'),
(363, 1, 'oriente', 'Mandrinadora', 'no', 0, 0, '2026-04-29 01:27:02'),
(364, 1, 'oriente', 'Torno Vertical', 'no', 0, 0, '2026-04-29 01:27:02'),
(365, 1, 'oriente', 'Mandrinadora', 'no', 0, 0, '2026-04-29 01:27:02'),
(366, 1, 'oriente', 'Torno 1000', 'no', 0, 0, '2026-04-29 01:27:02'),
(367, 1, 'oriente', 'Torno 800', 'no', 0, 0, '2026-04-29 01:27:02'),
(368, 1, 'oriente', 'Torno Bulgaro', 'no', 0, 0, '2026-04-29 01:27:02'),
(369, 1, 'oriente', 'Torno Varileta', 'no', 0, 0, '2026-04-29 01:27:02'),
(370, 1, 'oriente', 'Cepillo', 'no', 0, 0, '2026-04-29 01:27:02'),
(371, 1, 'oriente', 'Escoplo', 'no', 0, 0, '2026-04-29 01:27:02'),
(372, 1, 'oriente', 'Taladro Radial', 'no', 0, 0, '2026-04-29 01:27:02'),
(373, 1, 'poniente', 'Torno CNC 2', 'no', 0, 0, '2026-04-29 01:27:02'),
(374, 1, 'poniente', 'Torno CNC 3', 'no', 0, 0, '2026-04-29 01:27:02'),
(375, 1, 'poniente', 'Torno CNC 1', 'no', 0, 0, '2026-04-29 01:27:02'),
(376, 1, 'poniente', 'Centro Mecanizado 1', 'no', 0, 0, '2026-04-29 01:27:02'),
(377, 1, 'poniente', 'Centro Mecanizado 2', 'no', 0, 0, '2026-04-29 01:27:02'),
(378, 1, 'poniente', 'Router', 'no', 0, 0, '2026-04-29 01:27:02'),
(379, 1, 'poniente', 'Mecánica Banco', 'no', 0, 0, '2026-04-29 01:27:02'),
(380, 1, 'poniente', 'Balanceadora', 'no', 0, 0, '2026-04-29 01:27:02'),
(476, 5, 'oriente', 'Torno Vertical CNC', 'si', 10, 0, '2026-04-29 01:46:36'),
(477, 5, 'oriente', 'Mandrinadora', 'no', 0, 0, '2026-04-29 01:46:36'),
(478, 5, 'oriente', 'Torno Vertical', 'no', 0, 0, '2026-04-29 01:46:36'),
(479, 5, 'oriente', 'Mandrinadora', 'no', 0, 0, '2026-04-29 01:46:36'),
(480, 5, 'oriente', 'Torno 1000', 'no', 0, 0, '2026-04-29 01:46:36'),
(481, 5, 'oriente', 'Torno 800', 'no', 0, 0, '2026-04-29 01:46:36'),
(482, 5, 'oriente', 'Torno Bulgaro', 'no', 0, 0, '2026-04-29 01:46:36'),
(483, 5, 'oriente', 'Torno Varileta', 'no', 0, 0, '2026-04-29 01:46:36'),
(484, 5, 'oriente', 'Cepillo', 'no', 0, 0, '2026-04-29 01:46:36'),
(485, 5, 'oriente', 'Escoplo', 'no', 0, 0, '2026-04-29 01:46:36'),
(486, 5, 'oriente', 'Taladro Radial', 'no', 0, 0, '2026-04-29 01:46:36'),
(487, 5, 'poniente', 'Torno CNC 2', 'no', 0, 0, '2026-04-29 01:46:36'),
(488, 5, 'poniente', 'Torno CNC 3', 'no', 0, 0, '2026-04-29 01:46:36'),
(489, 5, 'poniente', 'Torno CNC 1', 'no', 0, 0, '2026-04-29 01:46:36'),
(490, 5, 'poniente', 'Centro Mecanizado 1', 'no', 0, 0, '2026-04-29 01:46:36'),
(491, 5, 'poniente', 'Centro Mecanizado 2', 'no', 0, 0, '2026-04-29 01:46:36'),
(492, 5, 'poniente', 'Router', 'no', 0, 0, '2026-04-29 01:46:36'),
(493, 5, 'poniente', 'Mecánica Banco', 'no', 0, 0, '2026-04-29 01:46:36'),
(494, 5, 'poniente', 'Balanceadora', 'no', 0, 0, '2026-04-29 01:46:36');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `rutas_maquinas`
--

CREATE TABLE `rutas_maquinas` (
  `id` int(11) NOT NULL,
  `numero_maquina` int(11) NOT NULL,
  `fecha` date NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time DEFAULT NULL,
  `pieza` varchar(150) DEFAULT NULL,
  `proceso` text DEFAULT NULL,
  `estado` varchar(50) DEFAULT 'En proceso',
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `correo` varchar(150) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('admin','usuario') DEFAULT 'usuario',
  `codigo_recuperacion` varchar(10) DEFAULT NULL,
  `codigo_expira` datetime DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `correo`, `password`, `rol`, `codigo_recuperacion`, `codigo_expira`, `fecha_creacion`) VALUES
(1, 'Admin', 'admin@gmail.com', '$2y$10$bGia2ylxYEn58YnKv3MjFON1ETWogZRcVctmbE/AwmGrCExw9J/4K', 'admin', NULL, NULL, '2026-04-27 14:44:08'),
(2, 'Usuario', 'user@gmail.com', '$2y$10$BD3JtQ9UcXGnNJtDtjEmAuli79XiirS7Lf6KuCDvp0pDiShQa1k2O', 'usuario', NULL, NULL, '2026-04-27 14:44:08');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `maquinas`
--
ALTER TABLE `maquinas`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `produccion`
--
ALTER TABLE `produccion`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `produccion_maquinas`
--
ALTER TABLE `produccion_maquinas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `produccion_id` (`produccion_id`);

--
-- Indices de la tabla `rutas_maquinas`
--
ALTER TABLE `rutas_maquinas`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `maquinas`
--
ALTER TABLE `maquinas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT de la tabla `produccion`
--
ALTER TABLE `produccion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `produccion_maquinas`
--
ALTER TABLE `produccion_maquinas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=495;

--
-- AUTO_INCREMENT de la tabla `rutas_maquinas`
--
ALTER TABLE `rutas_maquinas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `produccion_maquinas`
--
ALTER TABLE `produccion_maquinas`
  ADD CONSTRAINT `produccion_maquinas_ibfk_1` FOREIGN KEY (`produccion_id`) REFERENCES `produccion` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
