'use strict';
/**
 * Migración BASE (congelada): crea el esquema inicial con DDL explícito.
 *
 * Es el SQL exacto que emitía `sequelize.sync()` con los modelos del commit 749e2ca (el que introdujo esta migración),
 * capturado una vez y copiado aquí. Antes esta migración llamaba a sync() con los modelos del día, así que una base
 * nueva nacía con la forma de los modelos vigentes y las migraciones posteriores no se ejercitaban de verdad.
 * NO se edita: los cambios de esquema van en migraciones nuevas. `scripts/comprobar-esquema.js` verifica que la
 * base migrada coincida con los modelos.
 *
 * - Bases existentes: ya la tienen registrada en SequelizeMeta, no se vuelve a ejecutar.
 * - CREATE TABLE IF NOT EXISTS: sobre una base con tablas no altera ni borra nada.
 * - Única diferencia con aquel SQL: en 749e2ca varios modelos referenciaban la tabla con mayúscula (`Usuarios`,
 *   `Estados`...), lo que en Linux (nombres de tabla sensibles a mayúsculas) dejaba claves foráneas hacia tablas
 *   inexistentes; cc0356c lo corrigió en los modelos. Aquí van en minúscula. En MySQL/MariaDB con
 *   lower_case_table_names=1 (Windows) el esquema resultante es idéntico byte a byte al del baseline anterior.
 * - `CotizacionProducto` (modelo retirado después) se crea igual que antes; ninguna migración la elimina todavía.
 * - Las tablas se crean en el orden en que las creaba sync() (no topológico): las claves foráneas se desactivan
 *   solo en la conexión de esta migración mientras se crean.
 *
 * Las migraciones históricas (2025) están en migrations/legacy: asumían la base antigua y no funcionan sobre una
 * base vacía, por eso quedaron archivadas.
 */
const TABLAS = [
  "CREATE TABLE IF NOT EXISTS `colores` (`ColorID` INTEGER auto_increment , `Nombre` VARCHAR(255) NOT NULL, PRIMARY KEY (`ColorID`)) ENGINE=InnoDB;",
  "CREATE TABLE IF NOT EXISTS `proveedores` (`id` INTEGER auto_increment , `Nit` VARCHAR(255) NOT NULL UNIQUE, `Nombre` VARCHAR(255) NOT NULL, `Correo` VARCHAR(255), `Telefono` VARCHAR(255), `Direccion` VARCHAR(255), `Estado` TINYINT(1) DEFAULT true, PRIMARY KEY (`id`)) ENGINE=InnoDB;",
  "CREATE TABLE IF NOT EXISTS `compras` (`CompraID` INTEGER auto_increment , `ProveedorID` VARCHAR(255) NOT NULL, `ProveedorRefId` INTEGER COMMENT 'FK al id del proveedor', `FechaCompra` DATETIME, PRIMARY KEY (`CompraID`), FOREIGN KEY (`ProveedorRefId`) REFERENCES `proveedores` (`id`) ON DELETE SET NULL ON UPDATE CASCADE) ENGINE=InnoDB;",
  "CREATE TABLE IF NOT EXISTS `cotizaciones` (`CotizacionID` INTEGER auto_increment , `DocumentoID` BIGINT NOT NULL, `FechaCotizacion` DATETIME, `ValorTotal` DECIMAL(10,2) DEFAULT 0, `EstadoID` INTEGER, PRIMARY KEY (`CotizacionID`), FOREIGN KEY (`DocumentoID`) REFERENCES `usuarios` (`DocumentoID`) ON DELETE NO ACTION ON UPDATE CASCADE, FOREIGN KEY (`EstadoID`) REFERENCES `estados` (`EstadoID`) ON DELETE NO ACTION ON UPDATE CASCADE) ENGINE=InnoDB;",
  "CREATE TABLE IF NOT EXISTS `cotizacioncolor` (`CotizacionColorID` INTEGER auto_increment , `DetalleCotizacionID` INTEGER NOT NULL, `ColorID` INTEGER NOT NULL, `Cantidad` INTEGER NOT NULL, PRIMARY KEY (`CotizacionColorID`), FOREIGN KEY (`DetalleCotizacionID`) REFERENCES `detallecotizacion` (`DetalleCotizacionID`) ON DELETE NO ACTION ON UPDATE CASCADE, FOREIGN KEY (`ColorID`) REFERENCES `colores` (`ColorID`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB;",
  "CREATE TABLE IF NOT EXISTS `cotizacioninsumo` (`CotizacionInsumoID` INTEGER auto_increment , `DetalleCotizacionID` INTEGER NOT NULL, `InsumoID` INTEGER NOT NULL, `CantidadRequerida` DECIMAL(10,2) NOT NULL, PRIMARY KEY (`CotizacionInsumoID`), FOREIGN KEY (`DetalleCotizacionID`) REFERENCES `detallecotizacion` (`DetalleCotizacionID`) ON DELETE NO ACTION ON UPDATE CASCADE, FOREIGN KEY (`InsumoID`) REFERENCES `insumos` (`InsumoID`) ON DELETE NO ACTION ON UPDATE CASCADE) ENGINE=InnoDB;",
  "CREATE TABLE IF NOT EXISTS `CotizacionProducto` (`CotizacionProductoID` INTEGER auto_increment , `DetalleCotizacionID` INTEGER NOT NULL, `ProductoID` INTEGER NOT NULL, `Cantidad` INTEGER NOT NULL, `PrecioUnitario` DECIMAL(10,2) NOT NULL, `Subtotal` DECIMAL(10,2) NOT NULL, PRIMARY KEY (`CotizacionProductoID`), FOREIGN KEY (`DetalleCotizacionID`) REFERENCES `detallecotizacion` (`DetalleCotizacionID`) ON DELETE NO ACTION ON UPDATE CASCADE, FOREIGN KEY (`ProductoID`) REFERENCES `productos` (`ProductoID`) ON DELETE NO ACTION ON UPDATE CASCADE) ENGINE=InnoDB;",
  "CREATE TABLE IF NOT EXISTS `cotizaciontalla` (`CotizacionTallaID` INTEGER auto_increment , `DetalleCotizacionID` INTEGER NOT NULL, `TallaID` INTEGER NOT NULL, `Cantidad` INTEGER NOT NULL, `PrecioTalla` DECIMAL(10,2) NOT NULL, PRIMARY KEY (`CotizacionTallaID`), FOREIGN KEY (`DetalleCotizacionID`) REFERENCES `detallecotizacion` (`DetalleCotizacionID`) ON DELETE NO ACTION ON UPDATE CASCADE, FOREIGN KEY (`TallaID`) REFERENCES `tallas` (`TallaID`) ON DELETE NO ACTION ON UPDATE CASCADE) ENGINE=InnoDB;",
  "CREATE TABLE IF NOT EXISTS `cotizaciontecnica` (`CotizacionTecnicaID` INTEGER auto_increment , `DetalleCotizacionID` INTEGER NOT NULL, `TecnicaID` INTEGER NOT NULL, `ParteID` INTEGER NOT NULL, `ImagenDiseño` VARCHAR(255), `Observaciones` TEXT, `CostoTecnica` DECIMAL(10,2) DEFAULT 0, PRIMARY KEY (`CotizacionTecnicaID`), FOREIGN KEY (`DetalleCotizacionID`) REFERENCES `detallecotizacion` (`DetalleCotizacionID`) ON DELETE NO ACTION ON UPDATE CASCADE, FOREIGN KEY (`TecnicaID`) REFERENCES `tecnicas` (`TecnicaID`) ON DELETE NO ACTION ON UPDATE CASCADE, FOREIGN KEY (`ParteID`) REFERENCES `partes` (`ParteID`) ON DELETE NO ACTION ON UPDATE CASCADE) ENGINE=InnoDB;",
  "CREATE TABLE IF NOT EXISTS `insumos` (`InsumoID` INTEGER auto_increment , `Nombre` VARCHAR(255) NOT NULL, `Stock` INTEGER DEFAULT 0, `Tipo` VARCHAR(50) NOT NULL DEFAULT 'Otro', `PrecioTela` DECIMAL(10,2) DEFAULT 0, `Estado` TINYINT(1) DEFAULT true, PRIMARY KEY (`InsumoID`)) ENGINE=InnoDB;",
  "CREATE TABLE IF NOT EXISTS `productos` (`ProductoID` INTEGER auto_increment , `Nombre` VARCHAR(255) NOT NULL, `Descripcion` VARCHAR(255), `PrecioBase` DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT 'Precio base del producto sin adicionales', `ImagenProducto` LONGTEXT, PRIMARY KEY (`ProductoID`)) ENGINE=InnoDB;",
  "CREATE TABLE IF NOT EXISTS `inventarioproducto` (`InventarioID` INTEGER NOT NULL auto_increment , `ProductoID` INTEGER NOT NULL, `ColorID` INTEGER NOT NULL, `TallaID` INTEGER NOT NULL, `TelaID` INTEGER, `Stock` INTEGER NOT NULL DEFAULT 0, `Estado` TINYINT(1) DEFAULT 1, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`InventarioID`), FOREIGN KEY (`ProductoID`) REFERENCES `productos` (`ProductoID`) ON DELETE NO ACTION ON UPDATE CASCADE, FOREIGN KEY (`ColorID`) REFERENCES `colores` (`ColorID`) ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY (`TallaID`) REFERENCES `tallas` (`TallaID`) ON DELETE NO ACTION ON UPDATE CASCADE, FOREIGN KEY (`TelaID`) REFERENCES `insumos` (`InsumoID`) ON DELETE SET NULL ON UPDATE CASCADE) ENGINE=InnoDB;",
  "CREATE TABLE IF NOT EXISTS `detallecompra` (`DetalleCompraID` INTEGER auto_increment , `CompraID` INTEGER NOT NULL, `TipoSeleccion` ENUM('insumo', 'producto') NOT NULL DEFAULT 'insumo', `InsumoID` INTEGER, `ProductoID` INTEGER, `InventarioID` INTEGER, `Cantidad` INTEGER NOT NULL, `PrecioUnitario` DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT 'Precio al que se compró', `PrecioVenta` DECIMAL(10,2) COMMENT 'Precio de venta sugerido', PRIMARY KEY (`DetalleCompraID`), FOREIGN KEY (`CompraID`) REFERENCES `compras` (`CompraID`) ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY (`InsumoID`) REFERENCES `insumos` (`InsumoID`) ON DELETE SET NULL ON UPDATE CASCADE, FOREIGN KEY (`ProductoID`) REFERENCES `productos` (`ProductoID`) ON DELETE SET NULL ON UPDATE CASCADE, FOREIGN KEY (`InventarioID`) REFERENCES `inventarioproducto` (`InventarioID`) ON DELETE SET NULL ON UPDATE CASCADE) ENGINE=InnoDB;",
  "CREATE TABLE IF NOT EXISTS `detallecotizacion` (`DetalleCotizacionID` INTEGER auto_increment , `CotizacionID` INTEGER NOT NULL, `ProductoID` INTEGER, `Cantidad` INTEGER NOT NULL, `TraePrenda` TINYINT(1) DEFAULT false, `PrendaDescripcion` TEXT, `PrecioUnitario` DECIMAL(12,2) DEFAULT NULL, PRIMARY KEY (`DetalleCotizacionID`), FOREIGN KEY (`CotizacionID`) REFERENCES `cotizaciones` (`CotizacionID`) ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY (`ProductoID`) REFERENCES `productos` (`ProductoID`) ON DELETE SET NULL ON UPDATE CASCADE) ENGINE=InnoDB;",
  "CREATE TABLE IF NOT EXISTS `ventas` (`VentaID` INTEGER auto_increment , `DocumentoID` BIGINT NOT NULL, `FechaVenta` DATETIME, `Subtotal` DECIMAL(10,2) DEFAULT 0, `Total` DECIMAL(10,2) DEFAULT 0, `EstadoID` INTEGER, `MetodoPago` VARCHAR(50), `ComprobanteTransferencia` LONGTEXT, `FechaTransferencia` DATETIME, `NombreReceptor` VARCHAR(100), `TelefonoEntrega` VARCHAR(20), `DireccionEntrega` VARCHAR(255), PRIMARY KEY (`VentaID`), FOREIGN KEY (`DocumentoID`) REFERENCES `usuarios` (`DocumentoID`) ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY (`EstadoID`) REFERENCES `estados` (`EstadoID`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB;",
  "CREATE TABLE IF NOT EXISTS `tallas` (`TallaID` INTEGER auto_increment , `Nombre` VARCHAR(255) NOT NULL UNIQUE, `Precio` DECIMAL(10,2) DEFAULT NULL, PRIMARY KEY (`TallaID`)) ENGINE=InnoDB;",
  "CREATE TABLE IF NOT EXISTS `detalleventa` (`DetalleVentaID` INTEGER auto_increment , `VentaID` INTEGER NOT NULL, `ProductoID` INTEGER, `ColorID` INTEGER, `TallaID` INTEGER, `Cantidad` INTEGER NOT NULL, `PrecioUnitario` DECIMAL(10,2) NOT NULL, PRIMARY KEY (`DetalleVentaID`), FOREIGN KEY (`VentaID`) REFERENCES `ventas` (`VentaID`) ON DELETE NO ACTION ON UPDATE CASCADE, FOREIGN KEY (`ProductoID`) REFERENCES `productos` (`ProductoID`) ON DELETE SET NULL ON UPDATE CASCADE, FOREIGN KEY (`ColorID`) REFERENCES `colores` (`ColorID`) ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY (`TallaID`) REFERENCES `tallas` (`TallaID`) ON DELETE NO ACTION ON UPDATE CASCADE) ENGINE=InnoDB;",
  "CREATE TABLE IF NOT EXISTS `estados` (`EstadoID` INTEGER auto_increment , `Nombre` VARCHAR(255) NOT NULL, `Tipo` ENUM('cotizacion', 'venta') NOT NULL COMMENT 'Define a qué módulo pertenece este estado', `Descripcion` TEXT, PRIMARY KEY (`EstadoID`)) ENGINE=InnoDB;",
  "CREATE TABLE IF NOT EXISTS `partes` (`ParteID` INTEGER auto_increment , `Nombre` VARCHAR(255) NOT NULL, PRIMARY KEY (`ParteID`)) ENGINE=InnoDB;",
  "CREATE TABLE IF NOT EXISTS `permisos` (`PermisoID` INTEGER auto_increment , `Nombre` VARCHAR(255) NOT NULL, PRIMARY KEY (`PermisoID`)) ENGINE=InnoDB;",
  "CREATE TABLE IF NOT EXISTS `privilegios` (`PrivilegioID` INTEGER auto_increment , `Nombre` VARCHAR(255) NOT NULL, PRIMARY KEY (`PrivilegioID`)) ENGINE=InnoDB;",
  "CREATE TABLE IF NOT EXISTS `permisoprivilegio` (`PermisoPrivilegioID` INTEGER auto_increment , `PermisoID` INTEGER NOT NULL, `PrivilegioID` INTEGER NOT NULL, UNIQUE `permisoprivilegio_PrivilegioID_PermisoID_unique` (`PermisoID`, `PrivilegioID`), PRIMARY KEY (`PermisoPrivilegioID`), FOREIGN KEY (`PermisoID`) REFERENCES `permisos` (`PermisoID`) ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY (`PrivilegioID`) REFERENCES `privilegios` (`PrivilegioID`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB;",
  "CREATE TABLE IF NOT EXISTS `roles` (`RolID` INTEGER auto_increment , `Nombre` VARCHAR(255) NOT NULL, `Descripcion` TEXT, `Estado` TINYINT(1) DEFAULT true, PRIMARY KEY (`RolID`)) ENGINE=InnoDB;",
  "CREATE TABLE IF NOT EXISTS `rolpermiso` (`RolPermisoID` INTEGER auto_increment , `RolID` INTEGER NOT NULL, `PermisoID` INTEGER NOT NULL, UNIQUE `rolpermiso_RolID_PermisoID_unique` (`RolID`, `PermisoID`), PRIMARY KEY (`RolPermisoID`), FOREIGN KEY (`RolID`) REFERENCES `roles` (`RolID`) ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY (`PermisoID`) REFERENCES `permisos` (`PermisoID`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB;",
  "CREATE TABLE IF NOT EXISTS `tecnicas` (`TecnicaID` INTEGER auto_increment , `Nombre` VARCHAR(100) NOT NULL, `imagenTecnica` LONGTEXT COMMENT 'Puede ser Base64, URL o ruta local', `Descripcion` VARCHAR(500), `Estado` TINYINT(1) NOT NULL DEFAULT true, PRIMARY KEY (`TecnicaID`)) ENGINE=InnoDB;",
  "CREATE TABLE IF NOT EXISTS `usuarios` (`DocumentoID` BIGINT , `Nombre` VARCHAR(255) NOT NULL, `Correo` VARCHAR(255) NOT NULL UNIQUE, `Direccion` VARCHAR(255), `Telefono` VARCHAR(255), `Contraseña` VARCHAR(255) NOT NULL, `RolID` INTEGER NOT NULL, PRIMARY KEY (`DocumentoID`), FOREIGN KEY (`RolID`) REFERENCES `roles` (`RolID`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB;",
];

module.exports = {
  async up(queryInterface) {
    // Una transacción fija una sola conexión del pool para que SET FOREIGN_KEY_CHECKS aplique a todas las sentencias
    // (el DDL de MySQL hace commit implícito; la transacción solo sirve para fijar la conexión).
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS=0', { transaction });
      try {
        for (const sql of TABLAS) {
          await queryInterface.sequelize.query(sql, { transaction });
        }
      } finally {
        await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS=1', { transaction });
      }
    });
  },

  async down() {
    // No se revierte la creación del esquema base (sería destructivo).
  },
};
