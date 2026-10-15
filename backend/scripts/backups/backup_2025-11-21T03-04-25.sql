-- Backup de stamplab - 2025-11-21T03:04:25.873Z
-- Tablas: 48

SET FOREIGN_KEY_CHECKS=0;

DROP TABLE IF EXISTS `colores`;
CREATE TABLE `colores` (
  `ColorID` int NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Cantidad` int DEFAULT '0',
  PRIMARY KEY (`ColorID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `colors`;
CREATE TABLE `colors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Cantidad` int DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `compras`;
CREATE TABLE `compras` (
  `CompraID` int NOT NULL AUTO_INCREMENT,
  `ProveedorID` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `FechaCompra` datetime DEFAULT NULL,
  `EstadoID` int DEFAULT NULL,
  PRIMARY KEY (`CompraID`),
  KEY `ProveedorID` (`ProveedorID`),
  KEY `Compras_EstadoID_foreign_idx` (`EstadoID`),
  CONSTRAINT `Compras_EstadoID_foreign_idx` FOREIGN KEY (`EstadoID`) REFERENCES `estados` (`EstadoID`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `compras_ibfk_1` FOREIGN KEY (`ProveedorID`) REFERENCES `proveedores` (`Nit`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cotizacioncolor`;
CREATE TABLE `cotizacioncolor` (
  `CotizacionColorID` int NOT NULL AUTO_INCREMENT,
  `DetalleCotizacionID` int NOT NULL,
  `ColorID` int NOT NULL,
  `Cantidad` int NOT NULL,
  PRIMARY KEY (`CotizacionColorID`),
  KEY `DetalleCotizacionID` (`DetalleCotizacionID`),
  KEY `ColorID` (`ColorID`),
  CONSTRAINT `cotizacioncolor_ibfk_1` FOREIGN KEY (`DetalleCotizacionID`) REFERENCES `detallecotizacion` (`DetalleCotizacionID`) ON UPDATE CASCADE,
  CONSTRAINT `cotizacioncolor_ibfk_2` FOREIGN KEY (`ColorID`) REFERENCES `colores` (`ColorID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cotizacioncolors`;
CREATE TABLE `cotizacioncolors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `DetalleCotizacionID` int DEFAULT NULL,
  `ColorID` int DEFAULT NULL,
  `Cantidad` int DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cotizaciones`;
CREATE TABLE `cotizaciones` (
  `CotizacionID` int NOT NULL AUTO_INCREMENT,
  `FechaCotizacion` datetime DEFAULT NULL,
  `ValorTotal` decimal(10,2) DEFAULT '0.00',
  `EstadoID` int DEFAULT NULL,
  `DocumentoID` int DEFAULT NULL,
  PRIMARY KEY (`CotizacionID`),
  KEY `EstadoID` (`EstadoID`),
  KEY `Cotizaciones_DocumentoID_foreign_idx` (`DocumentoID`),
  CONSTRAINT `Cotizaciones_DocumentoID_foreign_idx` FOREIGN KEY (`DocumentoID`) REFERENCES `usuarios` (`DocumentoID`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `cotizaciones_ibfk_1` FOREIGN KEY (`EstadoID`) REFERENCES `estados` (`EstadoID`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cotizacioninsumo`;
CREATE TABLE `cotizacioninsumo` (
  `CotizacionInsumoID` int NOT NULL AUTO_INCREMENT,
  `DetalleCotizacionID` int NOT NULL,
  `InsumoID` int NOT NULL,
  `CantidadRequerida` decimal(10,2) NOT NULL,
  PRIMARY KEY (`CotizacionInsumoID`),
  KEY `DetalleCotizacionID` (`DetalleCotizacionID`),
  KEY `InsumoID` (`InsumoID`),
  CONSTRAINT `cotizacioninsumo_ibfk_1` FOREIGN KEY (`DetalleCotizacionID`) REFERENCES `detallecotizacion` (`DetalleCotizacionID`) ON UPDATE CASCADE,
  CONSTRAINT `cotizacioninsumo_ibfk_2` FOREIGN KEY (`InsumoID`) REFERENCES `insumos` (`InsumoID`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cotizacioninsumos`;
CREATE TABLE `cotizacioninsumos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `DetalleCotizacionID` int DEFAULT NULL,
  `InsumoID` int DEFAULT NULL,
  `CantidadRequerida` decimal(10,0) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cotizacionproducto`;
CREATE TABLE `cotizacionproducto` (
  `CotizacionProductoID` int NOT NULL AUTO_INCREMENT,
  `DetalleCotizacionID` int NOT NULL,
  `ProductoID` int NOT NULL,
  `Cantidad` int NOT NULL,
  `PrecioUnitario` decimal(10,2) NOT NULL,
  `Subtotal` decimal(10,2) NOT NULL,
  PRIMARY KEY (`CotizacionProductoID`),
  KEY `DetalleCotizacionID` (`DetalleCotizacionID`),
  KEY `ProductoID` (`ProductoID`),
  CONSTRAINT `cotizacionproducto_ibfk_1` FOREIGN KEY (`DetalleCotizacionID`) REFERENCES `detallecotizacion` (`DetalleCotizacionID`) ON UPDATE CASCADE,
  CONSTRAINT `cotizacionproducto_ibfk_2` FOREIGN KEY (`ProductoID`) REFERENCES `productos` (`ProductoID`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cotizacionproductos`;
CREATE TABLE `cotizacionproductos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `DetalleCotizacionID` int DEFAULT NULL,
  `ProductoID` int DEFAULT NULL,
  `Cantidad` int DEFAULT NULL,
  `PrecioUnitario` decimal(10,0) DEFAULT NULL,
  `Subtotal` decimal(10,0) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cotizacions`;
CREATE TABLE `cotizacions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `FechaCotizacion` datetime DEFAULT NULL,
  `ValorTotal` decimal(10,0) DEFAULT NULL,
  `EstadoID` int DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cotizaciontalla`;
CREATE TABLE `cotizaciontalla` (
  `CotizacionTallaID` int NOT NULL AUTO_INCREMENT,
  `DetalleCotizacionID` int NOT NULL,
  `TallaID` int NOT NULL,
  `Cantidad` int NOT NULL,
  `PrecioTalla` decimal(10,2) NOT NULL,
  PRIMARY KEY (`CotizacionTallaID`),
  KEY `DetalleCotizacionID` (`DetalleCotizacionID`),
  KEY `TallaID` (`TallaID`),
  CONSTRAINT `cotizaciontalla_ibfk_1` FOREIGN KEY (`DetalleCotizacionID`) REFERENCES `detallecotizacion` (`DetalleCotizacionID`) ON UPDATE CASCADE,
  CONSTRAINT `cotizaciontalla_ibfk_2` FOREIGN KEY (`TallaID`) REFERENCES `tallas` (`TallaID`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cotizaciontallas`;
CREATE TABLE `cotizaciontallas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `DetalleCotizacionID` int DEFAULT NULL,
  `TallaID` int DEFAULT NULL,
  `Cantidad` int DEFAULT NULL,
  `PrecioTalla` decimal(10,0) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cotizaciontecnica`;
CREATE TABLE `cotizaciontecnica` (
  `CotizacionTecnicaID` int NOT NULL AUTO_INCREMENT,
  `DetalleCotizacionID` int NOT NULL,
  `TecnicaID` int NOT NULL,
  `ParteID` int NOT NULL,
  `ImagenDiseño` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Observaciones` text COLLATE utf8mb4_unicode_ci,
  `CostoTecnica` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`CotizacionTecnicaID`),
  KEY `DetalleCotizacionID` (`DetalleCotizacionID`),
  KEY `TecnicaID` (`TecnicaID`),
  KEY `ParteID` (`ParteID`),
  CONSTRAINT `cotizaciontecnica_ibfk_1` FOREIGN KEY (`DetalleCotizacionID`) REFERENCES `detallecotizacion` (`DetalleCotizacionID`) ON UPDATE CASCADE,
  CONSTRAINT `cotizaciontecnica_ibfk_2` FOREIGN KEY (`TecnicaID`) REFERENCES `tecnicas` (`TecnicaID`) ON UPDATE CASCADE,
  CONSTRAINT `cotizaciontecnica_ibfk_3` FOREIGN KEY (`ParteID`) REFERENCES `partes` (`ParteID`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cotizaciontecnicas`;
CREATE TABLE `cotizaciontecnicas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `DetalleCotizacionID` int DEFAULT NULL,
  `TecnicaID` int DEFAULT NULL,
  `ParteID` int DEFAULT NULL,
  `ImagenDiseño` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Observaciones` text COLLATE utf8mb4_unicode_ci,
  `CostoTecnica` decimal(10,0) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `detallecompra`;
CREATE TABLE `detallecompra` (
  `DetalleCompraID` int NOT NULL AUTO_INCREMENT,
  `CompraID` int NOT NULL,
  `InsumoID` int NOT NULL,
  `Cantidad` int NOT NULL,
  `PrecioUnitario` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`DetalleCompraID`),
  KEY `CompraID` (`CompraID`),
  KEY `InsumoID` (`InsumoID`),
  CONSTRAINT `detallecompra_ibfk_1` FOREIGN KEY (`CompraID`) REFERENCES `compras` (`CompraID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `detallecompra_ibfk_2` FOREIGN KEY (`InsumoID`) REFERENCES `insumos` (`InsumoID`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `detallecompras`;
CREATE TABLE `detallecompras` (
  `id` int NOT NULL AUTO_INCREMENT,
  `CompraID` int DEFAULT NULL,
  `InsumoID` int DEFAULT NULL,
  `Cantidad` int DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `detallecotizacion`;
CREATE TABLE `detallecotizacion` (
  `DetalleCotizacionID` int NOT NULL AUTO_INCREMENT,
  `CotizacionID` int NOT NULL,
  `Cantidad` int NOT NULL,
  `TraePrenda` tinyint(1) DEFAULT '0',
  `PrendaDescripcion` text COLLATE utf8mb4_unicode_ci,
  `ProductoID` int DEFAULT NULL,
  PRIMARY KEY (`DetalleCotizacionID`),
  KEY `CotizacionID` (`CotizacionID`),
  KEY `DetalleCotizacion_ProductoID_foreign_idx` (`ProductoID`),
  CONSTRAINT `detallecotizacion_ibfk_2` FOREIGN KEY (`CotizacionID`) REFERENCES `cotizaciones` (`CotizacionID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `DetalleCotizacion_ProductoID_foreign_idx` FOREIGN KEY (`ProductoID`) REFERENCES `productos` (`ProductoID`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `detallecotizacions`;
CREATE TABLE `detallecotizacions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `DocumentoID` int DEFAULT NULL,
  `CotizacionID` int DEFAULT NULL,
  `Cantidad` int DEFAULT NULL,
  `TraePrenda` tinyint(1) DEFAULT NULL,
  `PrendaDescripcion` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `detalleventa`;
CREATE TABLE `detalleventa` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ProductoID` int DEFAULT NULL,
  `TecnicaID` int DEFAULT NULL,
  `VentaID` int DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `detalleventas`;
CREATE TABLE `detalleventas` (
  `DetalleVentaID` int NOT NULL AUTO_INCREMENT,
  `ProductoID` int NOT NULL,
  `TecnicaID` int DEFAULT NULL,
  `VentaID` int NOT NULL,
  `ColorID` int DEFAULT NULL,
  `TallaID` int DEFAULT NULL,
  `Cantidad` int NOT NULL DEFAULT '1',
  `PrecioUnitario` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`DetalleVentaID`),
  KEY `ProductoID` (`ProductoID`),
  KEY `TecnicaID` (`TecnicaID`),
  KEY `VentaID` (`VentaID`),
  KEY `DetalleVentas_ColorID_foreign_idx` (`ColorID`),
  KEY `DetalleVentas_TallaID_foreign_idx` (`TallaID`),
  CONSTRAINT `DetalleVentas_ColorID_foreign_idx` FOREIGN KEY (`ColorID`) REFERENCES `colores` (`ColorID`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `detalleventas_ibfk_1` FOREIGN KEY (`ProductoID`) REFERENCES `productos` (`ProductoID`) ON UPDATE CASCADE,
  CONSTRAINT `detalleventas_ibfk_2` FOREIGN KEY (`TecnicaID`) REFERENCES `tecnicas` (`TecnicaID`) ON UPDATE CASCADE,
  CONSTRAINT `detalleventas_ibfk_3` FOREIGN KEY (`VentaID`) REFERENCES `ventas` (`VentaID`) ON UPDATE CASCADE,
  CONSTRAINT `DetalleVentas_TallaID_foreign_idx` FOREIGN KEY (`TallaID`) REFERENCES `tallas` (`TallaID`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `estados`;
CREATE TABLE `estados` (
  `EstadoID` int NOT NULL AUTO_INCREMENT,
  `VentaID` int DEFAULT NULL,
  `Nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`EstadoID`),
  KEY `VentaID` (`VentaID`),
  CONSTRAINT `estados_ibfk_1` FOREIGN KEY (`VentaID`) REFERENCES `ventas` (`VentaID`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `insumos`;
CREATE TABLE `insumos` (
  `InsumoID` int NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Stock` int DEFAULT '0',
  `Estado` tinyint(1) DEFAULT '1',
  `PrecioTela` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`InsumoID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `inventarioproducto`;
CREATE TABLE `inventarioproducto` (
  `InventarioID` int NOT NULL AUTO_INCREMENT,
  `ProductoID` int NOT NULL,
  `ColorID` int NOT NULL,
  `TallaID` int NOT NULL,
  `Stock` int NOT NULL DEFAULT '0',
  `Estado` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`InventarioID`),
  KEY `ProductoID` (`ProductoID`),
  KEY `ColorID` (`ColorID`),
  KEY `TallaID` (`TallaID`),
  CONSTRAINT `inventarioproducto_ibfk_1` FOREIGN KEY (`ProductoID`) REFERENCES `productos` (`ProductoID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `inventarioproducto_ibfk_2` FOREIGN KEY (`ColorID`) REFERENCES `colores` (`ColorID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `inventarioproducto_ibfk_3` FOREIGN KEY (`TallaID`) REFERENCES `tallas` (`TallaID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `partes`;
CREATE TABLE `partes` (
  `ParteID` int NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`ParteID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `permisoprivilegio`;
CREATE TABLE `permisoprivilegio` (
  `PermisoPrivilegioID` int NOT NULL AUTO_INCREMENT,
  `PermisoID` int NOT NULL,
  `PrivilegioID` int NOT NULL,
  PRIMARY KEY (`PermisoPrivilegioID`),
  UNIQUE KEY `PermisoPrivilegio_PrivilegioID_PermisoID_unique` (`PermisoID`,`PrivilegioID`),
  KEY `PrivilegioID` (`PrivilegioID`),
  CONSTRAINT `permisoprivilegio_ibfk_1` FOREIGN KEY (`PermisoID`) REFERENCES `permisos` (`PermisoID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `permisoprivilegio_ibfk_2` FOREIGN KEY (`PrivilegioID`) REFERENCES `privilegios` (`PrivilegioID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `permisoprivilegios`;
CREATE TABLE `permisoprivilegios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `PermisoID` int DEFAULT NULL,
  `PrivilegioID` int DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `permisos`;
CREATE TABLE `permisos` (
  `PermisoID` int NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`PermisoID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `privilegios`;
CREATE TABLE `privilegios` (
  `PrivilegioID` int NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`PrivilegioID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `productocolor`;
CREATE TABLE `productocolor` (
  `ProductoColorID` int NOT NULL AUTO_INCREMENT,
  `ProductoID` int NOT NULL,
  `ColorID` int NOT NULL,
  `Estado` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`ProductoColorID`),
  UNIQUE KEY `ProductoColor_ProductoID_ColorID_unique` (`ProductoID`,`ColorID`),
  KEY `ColorID` (`ColorID`),
  CONSTRAINT `productocolor_ibfk_1` FOREIGN KEY (`ProductoID`) REFERENCES `productos` (`ProductoID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `productocolor_ibfk_2` FOREIGN KEY (`ColorID`) REFERENCES `colores` (`ColorID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `productocolors`;
CREATE TABLE `productocolors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ProductoID` int DEFAULT NULL,
  `ColorID` int DEFAULT NULL,
  `Estado` tinyint(1) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `productoinsumo`;
CREATE TABLE `productoinsumo` (
  `ProductoInsumoID` int NOT NULL AUTO_INCREMENT,
  `ProductoID` int NOT NULL,
  `InsumoID` int NOT NULL,
  `CantidadNecesaria` decimal(10,2) NOT NULL DEFAULT '1.00',
  PRIMARY KEY (`ProductoInsumoID`),
  UNIQUE KEY `ProductoInsumo_ProductoID_InsumoID_unique` (`ProductoID`,`InsumoID`),
  KEY `InsumoID` (`InsumoID`),
  CONSTRAINT `productoinsumo_ibfk_1` FOREIGN KEY (`ProductoID`) REFERENCES `productos` (`ProductoID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `productoinsumo_ibfk_2` FOREIGN KEY (`InsumoID`) REFERENCES `insumos` (`InsumoID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `productoinsumos`;
CREATE TABLE `productoinsumos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ProductoID` int DEFAULT NULL,
  `InsumoID` int DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `productos`;
CREATE TABLE `productos` (
  `ProductoID` int NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ImagenProducto` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`ProductoID`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `productos` (`ProductoID`, `Nombre`, `Descripcion`, `ImagenProducto`) VALUES (1, 'Laptop Pro 15', 'Laptop de alto rendimiento con pantalla de 15 pulgadas', 'laptop_pro_15.jpg');
INSERT INTO `productos` (`ProductoID`, `Nombre`, `Descripcion`, `ImagenProducto`) VALUES (2, 'Auriculares Inalámbricos X2', 'Auriculares bluetooth con cancelación de ruido', 'auriculares_x2.png');
INSERT INTO `productos` (`ProductoID`, `Nombre`, `Descripcion`, `ImagenProducto`) VALUES (3, 'Smartwatch Active', 'Reloj inteligente resistente al agua con monitor de ritmo cardíaco', 'smartwatch_active.jpg');
INSERT INTO `productos` (`ProductoID`, `Nombre`, `Descripcion`, `ImagenProducto`) VALUES (7, 'Camiseta Básica', 'Camiseta 100% algodón', 'https://ejemplo.com/imagen.jpg');

DROP TABLE IF EXISTS `productotalla`;
CREATE TABLE `productotalla` (
  `ProductoTallaID` int NOT NULL AUTO_INCREMENT,
  `ProductoID` int NOT NULL,
  `TallaID` int NOT NULL,
  `StockDisponible` int DEFAULT '0',
  `Estado` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`ProductoTallaID`),
  UNIQUE KEY `ProductoTalla_TallaID_ProductoID_unique` (`ProductoID`,`TallaID`),
  KEY `TallaID` (`TallaID`),
  CONSTRAINT `productotalla_ibfk_1` FOREIGN KEY (`ProductoID`) REFERENCES `productos` (`ProductoID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `productotalla_ibfk_2` FOREIGN KEY (`TallaID`) REFERENCES `tallas` (`TallaID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `productotallas`;
CREATE TABLE `productotallas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ProductoID` int DEFAULT NULL,
  `TallaID` int DEFAULT NULL,
  `StockDisponible` int DEFAULT NULL,
  `Estado` tinyint(1) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `proveedores`;
CREATE TABLE `proveedores` (
  `Nit` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Correo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Telefono` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Direccion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Estado` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`Nit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `proveedors`;
CREATE TABLE `proveedors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `Nit` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Nombre` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Correo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Telefono` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Direccion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Estado` tinyint(1) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `RolID` int NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Descripcion` text COLLATE utf8mb4_unicode_ci,
  `Estado` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`RolID`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `roles` (`RolID`, `Nombre`, `Descripcion`, `Estado`) VALUES (1, 'Administrador', 'Control total del sistema', 1);
INSERT INTO `roles` (`RolID`, `Nombre`, `Descripcion`, `Estado`) VALUES (2, 'Cliente', 'El comprador en el sistema', 1);

DROP TABLE IF EXISTS `rolpermiso`;
CREATE TABLE `rolpermiso` (
  `RolPermisoID` int NOT NULL AUTO_INCREMENT,
  `RolID` int NOT NULL,
  `PermisoID` int NOT NULL,
  PRIMARY KEY (`RolPermisoID`),
  UNIQUE KEY `RolPermiso_RolID_PermisoID_unique` (`RolID`,`PermisoID`),
  KEY `PermisoID` (`PermisoID`),
  CONSTRAINT `rolpermiso_ibfk_1` FOREIGN KEY (`RolID`) REFERENCES `roles` (`RolID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `rolpermiso_ibfk_2` FOREIGN KEY (`PermisoID`) REFERENCES `permisos` (`PermisoID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `rolpermisos`;
CREATE TABLE `rolpermisos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `RolID` int DEFAULT NULL,
  `PermisoID` int DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `rols`;
CREATE TABLE `rols` (
  `id` int NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Descripcion` text COLLATE utf8mb4_unicode_ci,
  `Estado` tinyint(1) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `sequelizemeta`;
CREATE TABLE `sequelizemeta` (
  `name` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

INSERT INTO `sequelizemeta` (`name`) VALUES ('20251026191839-create-rol.js');
INSERT INTO `sequelizemeta` (`name`) VALUES ('20251026192028-create-permiso.js');
INSERT INTO `sequelizemeta` (`name`) VALUES ('20251026192048-create-privilegio.js');
INSERT INTO `sequelizemeta` (`name`) VALUES ('20251026192120-create-usuario.js');
INSERT INTO `sequelizemeta` (`name`) VALUES ('20251026192309-create-producto.js');
INSERT INTO `sequelizemeta` (`name`) VALUES ('20251026192325-create-color.js');
INSERT INTO `sequelizemeta` (`name`) VALUES ('20251026192341-create-talla.js');
INSERT INTO `sequelizemeta` (`name`) VALUES ('20251026192353-create-insumo.js');
INSERT INTO `sequelizemeta` (`name`) VALUES ('20251026192411-create-proveedor.js');
INSERT INTO `sequelizemeta` (`name`) VALUES ('20251026192425-create-tecnica.js');
INSERT INTO `sequelizemeta` (`name`) VALUES ('20251026192441-create-parte.js');
INSERT INTO `sequelizemeta` (`name`) VALUES ('20251026192457-create-estado.js');
INSERT INTO `sequelizemeta` (`name`) VALUES ('20251026192511-create-compra.js');
INSERT INTO `sequelizemeta` (`name`) VALUES ('20251026192533-create-venta.js');
INSERT INTO `sequelizemeta` (`name`) VALUES ('20251026192602-create-cotizacion.js');
INSERT INTO `sequelizemeta` (`name`) VALUES ('20251026192617-create-rol-permiso.js');
INSERT INTO `sequelizemeta` (`name`) VALUES ('20251026192631-create-permiso-privilegio.js');
INSERT INTO `sequelizemeta` (`name`) VALUES ('20251026192645-create-producto-color.js');
INSERT INTO `sequelizemeta` (`name`) VALUES ('20251026192659-create-producto-talla.js');
INSERT INTO `sequelizemeta` (`name`) VALUES ('20251026192714-create-producto-insumo.js');
INSERT INTO `sequelizemeta` (`name`) VALUES ('20251026192728-create-detalle-compra.js');
INSERT INTO `sequelizemeta` (`name`) VALUES ('20251026192741-create-detalle-cotizacion.js');
INSERT INTO `sequelizemeta` (`name`) VALUES ('20251026192804-create-cotizacion-tecnica.js');
INSERT INTO `sequelizemeta` (`name`) VALUES ('20251026192819-create-cotizacion-talla.js');
INSERT INTO `sequelizemeta` (`name`) VALUES ('20251026192851-create-cotizacion-color.js');
INSERT INTO `sequelizemeta` (`name`) VALUES ('20251026192906-create-cotizacion-insumo.js');
INSERT INTO `sequelizemeta` (`name`) VALUES ('20251026192921-create-cotizacion-producto.js');
INSERT INTO `sequelizemeta` (`name`) VALUES ('20251026192935-create-detalle-venta.js');
INSERT INTO `sequelizemeta` (`name`) VALUES ('20251103223057-add-precio-tela-to-insumos.js');
INSERT INTO `sequelizemeta` (`name`) VALUES ('20251112004742-crear-inventario-producto.js');
INSERT INTO `sequelizemeta` (`name`) VALUES ('20251112004800-agregar-campos-faltantes.js');
INSERT INTO `sequelizemeta` (`name`) VALUES ('20251112004814-reorganizar-cotizaciones.js');

DROP TABLE IF EXISTS `tallas`;
CREATE TABLE `tallas` (
  `TallaID` int NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Precio` int NOT NULL,
  PRIMARY KEY (`TallaID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `tecnicas`;
CREATE TABLE `tecnicas` (
  `TecnicaID` int NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `imagenTecnica` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Estado` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`TecnicaID`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `tecnicas` (`TecnicaID`, `Nombre`, `imagenTecnica`, `Descripcion`, `Estado`) VALUES (1, 'Serigrafia', NULL, 'ajakjaksakj', 0);

DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios` (
  `DocumentoID` int NOT NULL,
  `Nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Correo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Direccion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Telefono` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Contraseña` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `RolID` int NOT NULL,
  PRIMARY KEY (`DocumentoID`),
  UNIQUE KEY `Correo` (`Correo`),
  UNIQUE KEY `usuarios_correo_unique` (`Correo`),
  KEY `RolID` (`RolID`),
  CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`RolID`) REFERENCES `roles` (`RolID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `usuarios` (`DocumentoID`, `Nombre`, `Correo`, `Direccion`, `Telefono`, `Contraseña`, `RolID`) VALUES (444444, 'Fernando', 'fernando@gmail.com', 'Crra 220 INT 203', '3044531', '$2b$10$SJmFcWeuiotEtwgmAo6P6u9iQDdPLvBNGEOvGNKAc8Vkq.swhBELi', 2);
INSERT INTO `usuarios` (`DocumentoID`, `Nombre`, `Correo`, `Direccion`, `Telefono`, `Contraseña`, `RolID`) VALUES (1029392, 'Admin', 'admin@gmail.com', 'N/A', '3107780392', '$2b$10$atPCcmsG5.OqNRjMKNHiN.DMplwDSDLZchjQM7K0m5/wWebGKrjLS', 1);
INSERT INTO `usuarios` (`DocumentoID`, `Nombre`, `Correo`, `Direccion`, `Telefono`, `Contraseña`, `RolID`) VALUES (10138492, 'Liliana', 'liliana@gmail.com', 'CLLLLLLII', '777777777', 'liliana0303', 2);
INSERT INTO `usuarios` (`DocumentoID`, `Nombre`, `Correo`, `Direccion`, `Telefono`, `Contraseña`, `RolID`) VALUES (101324921, 'Juan Perez', 'juan@gmail.com', 'CRRA 1203', '030202020', '$2b$10$jQ2uYIy9xhXn.bZa9JbLFuHVGqGpISlNnJc3s4f3cARUsv6N2f4fC', 2);
INSERT INTO `usuarios` (`DocumentoID`, `Nombre`, `Correo`, `Direccion`, `Telefono`, `Contraseña`, `RolID`) VALUES (101347212, 'sebas medina', 'sebastianmedinaechavarria@gmail.com', 'Crra 145 #42', '301292831', '$2b$10$TaOCS3YecpIuKVCkgDTop.6u1ZZftOp2K8qOvF3wuQo5hNPXWQUUS', 2);

DROP TABLE IF EXISTS `venta`;
CREATE TABLE `venta` (
  `id` int NOT NULL AUTO_INCREMENT,
  `DocumentoID` int DEFAULT NULL,
  `FechaVenta` datetime DEFAULT NULL,
  `Estado` tinyint(1) DEFAULT NULL,
  `Subtotal` decimal(10,0) DEFAULT NULL,
  `Total` decimal(10,0) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `ventas`;
CREATE TABLE `ventas` (
  `VentaID` int NOT NULL AUTO_INCREMENT,
  `DocumentoID` int NOT NULL,
  `FechaVenta` datetime DEFAULT NULL,
  `Estado` tinyint(1) DEFAULT '1',
  `Subtotal` decimal(10,2) DEFAULT '0.00',
  `Total` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`VentaID`),
  KEY `DocumentoID` (`DocumentoID`),
  CONSTRAINT `ventas_ibfk_1` FOREIGN KEY (`DocumentoID`) REFERENCES `usuarios` (`DocumentoID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS=1;
