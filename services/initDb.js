const { Sequelize } = require('sequelize');
require('dotenv').config();
const pg = require('pg');

async function initializeDatabase() {
  // First connect without database to create it if needed
  const sequelize = new Sequelize({
    dialect: 'postgres',
    dialectModule: pg,
    host: process.env.DB_HOST || 'memoramdb',
    port: process.env.DB_PORT || 5432,
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    logging: console.log,
  });

  try {
    // Try to create the database if it doesn't exist
    await sequelize.query(`CREATE DATABASE ${process.env.DB_NAME || 'memora'};`);
    console.log('Database created successfully');
  } catch (error) {
    if (error.parent.code === '42P04') {
      console.log('Database already exists');
    } else {
      console.error('Error creating database:', error);
      // If main database creation fails, try to create root database
      try {
        await sequelize.query(`CREATE DATABASE ${process.env.DB_NAME || 'memora'};`);
        console.log('Root database created as fallback');
      } catch (rootError) {
        console.error('Error creating root database:', rootError);
      }
    }
  } finally {
    await sequelize.close();
  }
}

module.exports = { initializeDatabase }; 