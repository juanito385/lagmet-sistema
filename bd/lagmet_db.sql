-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 04-05-2026 a las 21:36:13
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
  `trabaja_sabado` varchar(2) DEFAULT 'no',
  `fallo_maquina` varchar(5) DEFAULT 'no',
  `maquina_fallo` varchar(100) DEFAULT NULL,
  `turno` varchar(20) DEFAULT 'Mañana'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `produccion`
--

INSERT INTO `produccion` (`id`, `numero_pedido`, `codigo`, `producto`, `cantidad`, `fecha`, `tiempo_muerto`, `dias`, `grupo`, `almuerzo`, `salida`, `usuario_id`, `fecha_registro`, `fecha_fin`, `trabaja_sabado`, `fallo_maquina`, `maquina_fallo`, `turno`) VALUES
(1, '111222', '020202', 'descanso_1', 4, '2026-04-24', 0, 5, '1', 'no', '40h 0m → 3:30 P. M.', 1, '2026-04-27 15:31:50', '2026-05-04', 'no', 'no', NULL, 'Mañana'),
(4, '454545', '224434', 'metal_pesado', 2, '2026-05-04', 0, 1, '1', 'no', '8h 0m → 4:30 P. M.', 1, '2026-04-27 19:23:07', '2026-04-28', 'no', 'no', NULL, 'Noche'),
(5, '12345', '232323', 'prueba2', 2, '2026-05-03', 90, 2, '1', 'no', '11h 30m → 10:45 A. M', 1, '2026-04-29 00:45:49', '2026-04-23', 'si', 'no', NULL, 'Tarde'),
(6, '654321', '12543', 'prueba4', 5, '2026-05-04', 105, 4, '1', 'no', '26h 45m → 9:30 A. M.', 1, '2026-05-04 15:34:04', '2026-05-07', 'si', 'no', '', 'Mañana');

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
(552, 4, 'oriente', 'Torno Vertical CNC', 'si', 4, 0, '2026-04-30 14:07:22'),
(553, 4, 'oriente', 'Mandrinadora', 'no', 0, 0, '2026-04-30 14:07:22'),
(554, 4, 'oriente', 'Torno Vertical', 'no', 0, 0, '2026-04-30 14:07:22'),
(555, 4, 'oriente', 'Mandrinadora', 'no', 0, 0, '2026-04-30 14:07:22'),
(556, 4, 'oriente', 'Torno 1000', 'no', 0, 0, '2026-04-30 14:07:22'),
(557, 4, 'oriente', 'Torno 800', 'no', 0, 0, '2026-04-30 14:07:22'),
(558, 4, 'oriente', 'Torno Bulgaro', 'no', 0, 0, '2026-04-30 14:07:22'),
(559, 4, 'oriente', 'Torno Varileta', 'no', 0, 0, '2026-04-30 14:07:22'),
(560, 4, 'oriente', 'Cepillo', 'no', 0, 0, '2026-04-30 14:07:22'),
(561, 4, 'oriente', 'Escoplo', 'no', 0, 0, '2026-04-30 14:07:22'),
(562, 4, 'oriente', 'Taladro Radial', 'no', 0, 0, '2026-04-30 14:07:22'),
(563, 4, 'poniente', 'Torno CNC 2', 'no', 0, 0, '2026-04-30 14:07:22'),
(564, 4, 'poniente', 'Torno CNC 3', 'no', 0, 0, '2026-04-30 14:07:22'),
(565, 4, 'poniente', 'Torno CNC 1', 'no', 0, 0, '2026-04-30 14:07:22'),
(566, 4, 'poniente', 'Centro Mecanizado 1', 'no', 0, 0, '2026-04-30 14:07:22'),
(567, 4, 'poniente', 'Centro Mecanizado 2', 'no', 0, 0, '2026-04-30 14:07:22'),
(568, 4, 'poniente', 'Router', 'no', 0, 0, '2026-04-30 14:07:22'),
(569, 4, 'poniente', 'Mecánica Banco', 'no', 0, 0, '2026-04-30 14:07:22'),
(570, 4, 'poniente', 'Balanceadora', 'no', 0, 0, '2026-04-30 14:07:22'),
(590, 5, 'oriente', 'Torno Vertical CNC', 'si', 5, 0, '2026-05-04 15:18:56'),
(591, 5, 'oriente', 'Mandrinadora', 'no', 0, 0, '2026-05-04 15:18:56'),
(592, 5, 'oriente', 'Torno Vertical', 'no', 0, 0, '2026-05-04 15:18:56'),
(593, 5, 'oriente', 'Mandrinadora', 'no', 0, 0, '2026-05-04 15:18:56'),
(594, 5, 'oriente', 'Torno 1000', 'no', 0, 0, '2026-05-04 15:18:56'),
(595, 5, 'oriente', 'Torno 800', 'no', 0, 0, '2026-05-04 15:18:56'),
(596, 5, 'oriente', 'Torno Bulgaro', 'no', 0, 0, '2026-05-04 15:18:56'),
(597, 5, 'oriente', 'Torno Varileta', 'no', 0, 0, '2026-05-04 15:18:56'),
(598, 5, 'oriente', 'Cepillo', 'no', 0, 0, '2026-05-04 15:18:56'),
(599, 5, 'oriente', 'Escoplo', 'no', 0, 0, '2026-05-04 15:18:56'),
(600, 5, 'oriente', 'Taladro Radial', 'no', 0, 0, '2026-05-04 15:18:56'),
(601, 5, 'poniente', 'Torno CNC 2', 'no', 0, 0, '2026-05-04 15:18:56'),
(602, 5, 'poniente', 'Torno CNC 3', 'no', 0, 0, '2026-05-04 15:18:56'),
(603, 5, 'poniente', 'Torno CNC 1', 'no', 0, 0, '2026-05-04 15:18:56'),
(604, 5, 'poniente', 'Centro Mecanizado 1', 'no', 0, 0, '2026-05-04 15:18:56'),
(605, 5, 'poniente', 'Centro Mecanizado 2', 'no', 0, 0, '2026-05-04 15:18:56'),
(606, 5, 'poniente', 'Router', 'no', 0, 0, '2026-05-04 15:18:56'),
(607, 5, 'poniente', 'Mecánica Banco', 'no', 0, 0, '2026-05-04 15:18:56'),
(608, 5, 'poniente', 'Balanceadora', 'no', 0, 0, '2026-05-04 15:18:56'),
(723, 6, 'oriente', 'Torno Vertical CNC', 'si', 2, 0, '2026-05-04 18:19:36'),
(724, 6, 'oriente', 'Mandrinadora', 'no', 0, 0, '2026-05-04 18:19:36'),
(725, 6, 'oriente', 'Torno Vertical', 'si', 3, 0, '2026-05-04 18:19:36'),
(726, 6, 'oriente', 'Mandrinadora', 'no', 0, 0, '2026-05-04 18:19:36'),
(727, 6, 'oriente', 'Torno 1000', 'no', 0, 0, '2026-05-04 18:19:36'),
(728, 6, 'oriente', 'Torno 800', 'no', 0, 0, '2026-05-04 18:19:36'),
(729, 6, 'oriente', 'Torno Bulgaro', 'no', 0, 0, '2026-05-04 18:19:36'),
(730, 6, 'oriente', 'Torno Varileta', 'no', 0, 0, '2026-05-04 18:19:36'),
(731, 6, 'oriente', 'Cepillo', 'no', 0, 0, '2026-05-04 18:19:36'),
(732, 6, 'oriente', 'Escoplo', 'no', 0, 0, '2026-05-04 18:19:36'),
(733, 6, 'oriente', 'Taladro Radial', 'no', 0, 0, '2026-05-04 18:19:36'),
(734, 6, 'poniente', 'Torno CNC 2', 'no', 0, 0, '2026-05-04 18:19:36'),
(735, 6, 'poniente', 'Torno CNC 3', 'no', 0, 0, '2026-05-04 18:19:36'),
(736, 6, 'poniente', 'Torno CNC 1', 'no', 0, 0, '2026-05-04 18:19:36'),
(737, 6, 'poniente', 'Centro Mecanizado 1', 'no', 0, 0, '2026-05-04 18:19:36'),
(738, 6, 'poniente', 'Centro Mecanizado 2', 'no', 0, 0, '2026-05-04 18:19:36'),
(739, 6, 'poniente', 'Router', 'no', 0, 0, '2026-05-04 18:19:36'),
(740, 6, 'poniente', 'Mecánica Banco', 'no', 0, 0, '2026-05-04 18:19:36'),
(741, 6, 'poniente', 'Balanceadora', 'no', 0, 0, '2026-05-04 18:19:36');

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
-- Estructura de tabla para la tabla `situaciones_produccion`
--

CREATE TABLE `situaciones_produccion` (
  `id` int(11) NOT NULL,
  `produccion_id` int(11) NOT NULL,
  `tiempo_extra_minutos` int(11) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `fecha_registro` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `situaciones_produccion`
--

INSERT INTO `situaciones_produccion` (`id`, `produccion_id`, `tiempo_extra_minutos`, `descripcion`, `fecha_registro`) VALUES
(6, 6, 105, 'retraso de pieza en maquinaria 1', '2026-05-04 14:19:36');

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
-- Indices de la tabla `situaciones_produccion`
--
ALTER TABLE `situaciones_produccion`
  ADD PRIMARY KEY (`id`),
  ADD KEY `produccion_id` (`produccion_id`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `produccion_maquinas`
--
ALTER TABLE `produccion_maquinas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=742;

--
-- AUTO_INCREMENT de la tabla `rutas_maquinas`
--
ALTER TABLE `rutas_maquinas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `situaciones_produccion`
--
ALTER TABLE `situaciones_produccion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

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

--
-- Filtros para la tabla `situaciones_produccion`
--
ALTER TABLE `situaciones_produccion`
  ADD CONSTRAINT `situaciones_produccion_ibfk_1` FOREIGN KEY (`produccion_id`) REFERENCES `produccion` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
