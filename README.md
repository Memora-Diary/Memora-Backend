# Memora Backend

This repository contains the backend code for the Memora project, our blockchain-powered platform to help you manage and preserve your online presence for future generations.

## Overview

The backend is built around four main services:

1. AI Service
2. Warpcast Service
3. Chain Service
4. Database Service

It provides endpoints for authentication and fine-tuning, as well as a core cron process for monitoring user activity and interact with the Rootstock blockchain.

## Setup and Installation

1. Install dependencies:

```bash
npm install
```

## Database Migrations

The project uses Sequelize CLI for database migrations. Here are the common commands:

### Creating Migrations

To create a new migration file:
```bash
npx sequelize-cli migration:generate --name migration-name
```

### Running Migrations

To run all pending migrations:
```bash
npx sequelize-cli db:migrate
```

To undo the most recent migration:
```bash
npx sequelize-cli db:migrate:undo
```

To undo all migrations:
```bash
npx sequelize-cli db:migrate:undo:all
```

### Working with Models

When you make changes to your models, generate a new migration:
```bash
npx sequelize-cli migration:generate --name update-model-name
```

Then edit the generated migration file in the `migrations` folder to specify the changes.

### Environment-specific Migrations

To run migrations for a specific environment:
```bash
npx sequelize-cli db:migrate --env production
```

### Migration Status

To check the status of migrations:
```bash
npx sequelize-cli db:migrate:status
```
