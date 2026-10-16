require('dotenv').config();

const common = {
  dialect: 'mysql',
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
