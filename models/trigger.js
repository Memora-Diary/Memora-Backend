'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Trigger extends Model {
    static associate(models) {
      Trigger.belongsTo(models.User, { foreignKey: 'userID' });
    }
  }
  
  Trigger.init({
    triggerID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    postID: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    userID: {
      type: DataTypes.BIGINT,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Trigger',
  });
  
  return Trigger;
}; 