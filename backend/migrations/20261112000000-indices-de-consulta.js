'use strict';
/**
 * Índices para las listas que más se consultan: pedidos y cotizaciones por estado ordenados por fecha
 * (bandeja "Hoy", pedidos pendientes, mantenimiento de vencimientos). Las claves foráneas ya tienen su índice.
 * Idempotente: en una base nueva el baseline ya los crea desde los modelos.
 */
const INDICES = [
  { tabla: 'ventas', nombre: 'ventas_estado_fecha', campos: ['EstadoID', 'FechaVenta'] },
  { tabla: 'cotizaciones', nombre: 'cotizaciones_estado_fecha', campos: ['EstadoID', 'FechaCotizacion'] },
];

module.exports = {
  async up(queryInterface) {
    for (const { tabla, nombre, campos } of INDICES) {
      const existentes = (await queryInterface.showIndex(tabla)).map((i) => i.name);
      if (!existentes.includes(nombre)) await queryInterface.addIndex(tabla, campos, { name: nombre });
    }
  },

  async down(queryInterface) {
    for (const { tabla, nombre } of INDICES) {
      const existentes = (await queryInterface.showIndex(tabla)).map((i) => i.name);
      if (existentes.includes(nombre)) await queryInterface.removeIndex(tabla, nombre);
    }
  },
};
