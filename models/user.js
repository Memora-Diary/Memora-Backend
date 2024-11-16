'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.DiaryEntry, { foreignKey: 'user_id' });
    }
  }
  
  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    telegram_id: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      field: 'telegram_id'
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true
    },
    is_subscribed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_subscribed'
    },
    last_interaction: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'last_interaction'
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  
  return User;
}; 