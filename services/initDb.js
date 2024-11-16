const { Sequelize } = require('sequelize');
require('dotenv').config();
const pg = require('pg');

async function initializeDatabase() {
  try {
    // Connect to postgres database first (this always exists)
    const sequelize = new Sequelize({
      dialect: 'postgres',
      dialectModule: pg,
      host: process.env.DB_HOST || 'memoramdb',
      port: process.env.DB_PORT || 5432,
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: 'postgres', // Connect to default postgres database first
      logging: console.log,
    });

    // Create the memora database if it doesn't exist
    try {
      await sequelize.query(`CREATE DATABASE memora`);
      console.log('Database created successfully');
    } catch (error) {
      if (error.parent?.code === '42P04') {
        console.log('Database already exists');
      } else {
        console.error('Error creating database:', error);
      }
    }

    await sequelize.close();

    // Now connect to the memora database
    const dbSequelize = new Sequelize({
      dialect: 'postgres',
      dialectModule: pg,
      host: process.env.DB_HOST || 'memoramdb',
      port: process.env.DB_PORT || 5432,
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: 'memora',
      logging: console.log,
    });

    // Create users table first
    await dbSequelize.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        telegram_id VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(255),
        is_subscribed BOOLEAN DEFAULT false,
        last_interaction TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Users table created successfully');

    // Then create diary_entries table with foreign key reference
    await dbSequelize.query(`
      CREATE TABLE IF NOT EXISTS diary_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        chat_id VARCHAR(255) NOT NULL,
        question_index INTEGER NOT NULL,
        question TEXT NOT NULL,
        response TEXT NOT NULL,
        platform VARCHAR(50) DEFAULT 'telegram',
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Diary entries table created successfully');

    await dbSequelize.close();
    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

module.exports = { initializeDatabase }; 