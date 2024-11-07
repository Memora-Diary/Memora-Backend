const { Sequelize, DataTypes } = require('sequelize');

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './memora.sqlite',
  logging: console.log
});

// Define models
const User = sequelize.define('User', {
  userID: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  latestPost: DataTypes.DATE,
  invalidUser: DataTypes.BOOLEAN,
  messages: DataTypes.TEXT
});

const Trigger = sequelize.define('Trigger', {
  triggerID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  postID: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  userID: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

// New model for address-name mapping
const AddressName = sequelize.define('AddressName', {
  ownerAddress: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
});

// Define associations
User.hasMany(Trigger, { foreignKey: 'userID' });
Trigger.belongsTo(User, { foreignKey: 'userID' });

// Sync models with database
async function createTables() {
  try {
    await sequelize.sync({ force: true }); // Use { force: true } to recreate tables if they already exist
    console.log('Database synced successfully');
  } catch (error) {
    console.error('Error syncing database:', error);
    throw error; // Rethrow the error so it can be caught in index.js
  }
}

async function getUsersByIds(userIds) {
  try {
    const users = await User.findAll({
      where: {
        userID: userIds
      }
    });
    console.log(`Retrieved ${users.length} users`);
    return users;
  } catch (error) {
    console.error('Error retrieving users:', error);
    throw error;
  }
}

async function getUserById(userId) {
  try {
    const user = await User.findByPk(Number(userId));
    if (user) {
      console.log(`Retrieved user with ID: ${userId}`);
      return user;
    } else {
      console.log(`No user found with ID: ${userId}`);
      return null;
    }
  } catch (error) {
    console.error('Error retrieving user:', error);
    throw error;
  }
}

async function upsertUser(userID, latestPost, messages) {
  try {
    const [user, created] = await User.findOrCreate({
      where: { userID: String(userID) },
      defaults: {
        userID: String(userID),
        latestPost,
        messages,
        invalidUser: false
      }
    });
    if (!created) {
      // If the user already exists, update their information
      await user.update({ latestPost, messages });
    }
    console.log(`User ${created ? 'created' : 'updated'} with ID: ${userID}`);
    return user;
  } catch (error) {
    console.error('Error upserting user:', error);
    throw error;
  }
}

async function upsertTrigger(postId, userId) {
  try {
    const [trigger, created] = await Trigger.findOrCreate({
      where: { postID: Number(postId), userID: Number(userId) },
      defaults: { postID: Number(postId), userID: Number(userId) }
    });
    console.log(`Trigger ${created ? 'created' : 'found'} with ID: ${trigger.triggerID}`);
    return trigger.triggerID;
  } catch (error) {
    console.error('Error upserting trigger:', error);
    throw error;
  }
}

async function deleteTrigger(triggerID) {
  try {
    const deletedCount = await Trigger.destroy({
      where: { triggerID }
    });
    console.log(`Trigger deleted. Rows affected: ${deletedCount}`);
  } catch (error) {
    console.error('Error deleting trigger:', error);
    throw error;
  }
}

async function flagInvalidUser(userID) {
  try {
    const [updatedCount] = await User.update(
      { invalidUser: true },
      { where: { userID: Number(userID) } }
    );
    console.log(`User flagged as invalid. Rows affected: ${updatedCount}`);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

async function storeUserMessages(userID, messages) {
  try {
    const [updatedCount] = await User.update(
      { messages },
      { where: { userID: Number(userID) } }
    );
    console.log(`User messages stored. Rows affected: ${updatedCount}`);
  } catch (error) {
    console.error('Error updating user messages:', error);
    throw error;
  }
}

// New function to map an address to a name
async function mapAddressToName(ownerAddress, address, name) {
  try {
    const [addressName, created] = await AddressName.findOrCreate({
      where: { ownerAddress, address },
      defaults: { name },
    });

    if (!created) {
      // If the entry already exists, update the name
      await addressName.update({ name });
    }

    console.log(`Address ${address} mapped to name ${name} for owner ${ownerAddress}`);
    return addressName;
  } catch (error) {
    console.error('Error mapping address to name:', error);
    throw error;
  }
}


// New function to fetch an address for a given name
async function getAddressForName(ownerAddress, name) {
  try {
    const addressName = await AddressName.findOne({
      where: { ownerAddress, name },
    });

    if (addressName) {
      console.log(`Found address ${addressName.address} for name ${name} (owner: ${ownerAddress})`);
      return addressName.address;
    } else {
      console.log(`No address found for name ${name} (owner: ${ownerAddress})`);
      return null;
    }
  } catch (error) {
    console.error('Error fetching address for name:', error);
    throw error;
  }
}

// Close database connection when the app is shutting down
process.on('SIGINT', async () => {
  try {
    await sequelize.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error closing database connection:', error);
    process.exit(1);
  }
});

module.exports = {
  createTables,
  upsertUser,
  upsertTrigger,
  deleteTrigger,
  getUserById,
  getUsersByIds,
  flagInvalidUser,
  storeUserMessages,
  mapAddressToName,
  getAddressForName
};
