require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'memora',
    host: process.env.DB_HOST || 'memoramdb',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    dialectModule: require('pg'),
  },
  test: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'memora_test',
    host: process.env.DB_HOST || 'memoramdb',
    dialect: 'postgres',
    dialectModule: require('pg'),
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'postgres',
    dialectModule: require('pg'),
  }
}; 