'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Trigger, { foreignKey: 'userID' });
    }
  }
  
  User.init({
    userID: {
      type: DataTypes.BIGINT,
      primaryKey: true
    },
    latestPost: DataTypes.DATE,
    invalidUser: DataTypes.BOOLEAN,
    messages: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'User',
  });
  
  return User;
}; 