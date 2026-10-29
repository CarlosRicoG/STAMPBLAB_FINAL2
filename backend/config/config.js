require('dotenv').config();

const common = {
  dialect: 'mysql',
  // Las reservas de stock usan SELECT ... FOR UPDATE. Con REPEATABLE READ + snapshot isolation (MariaDB 11.6+/12 lo activa
  // por defecto) una compra simultánea falla con "Record has changed since last read" (500). READ COMMITTED lo evita
  // y sigue serializando el stock gracias al bloqueo de filas.
  isolationLevel: 'READ COMMITTED',
  // SQL en consola solo si DB_LOGGING=1 (por defecto silencioso)
  logging: process.env.DB_LOGGING === '1' ? console.log : false,
  // BIGINT (documentos de identidad de hasta 15 digitos) como numero JS, no como texto
  dialectOptions: { supportBigNumbers: true, bigNumberStrings: false },
  define: {
    timestamps: false,
    freezeTableName: true,
    underscored: false
  }
};

const fromEnv = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST || process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  ...common
};

module.exports = {
  development: fromEnv,
  production: { ...fromEnv, logging: false }
};
