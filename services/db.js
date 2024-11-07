const { initializeDatabase } = require('./initDb');
const db = require('../models');

// Initialize database connection
async function initialize() {
  try {
    await initializeDatabase();
    await db.sequelize.authenticate();
    console.log('Database connection established successfully');
    return db;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
}

// Export all the database functions
module.exports = {
  initialize,
  createTables: async () => {
    await initialize();
    await db.sequelize.sync({ force: true });
  },
  getUsersByIds: async (userIds) => {
    return db.User.findAll({
      where: { userID: userIds }
    });
  },
  getUserById: async (userId) => {
    return db.User.findByPk(userId);
  },
  upsertUser: async (userID, latestPost, messages) => {
    return db.User.findOrCreate({
      where: { userID: BigInt(userID) },
      defaults: {
        userID: BigInt(userID),
        latestPost,
        messages,
        invalidUser: false
      }
    });
  },
  upsertTrigger: async (postId, userId) => {
    return db.Trigger.findOrCreate({
      where: { postID: Number(postId), userID: Number(userId) },
      defaults: { postID: Number(postId), userID: Number(userId) }
    });
  },
  deleteTrigger: async (triggerID) => {
    return db.Trigger.destroy({
      where: { triggerID }
    });
  },
  flagInvalidUser: async (userID) => {
    return db.User.update(
      { invalidUser: true },
      { where: { userID: BigInt(userID) } }
    );
  },
  storeUserMessages: async (userID, messages) => {
    return db.User.update(
      { messages },
      { where: { userID: BigInt(userID) } }
    );
  },
};
