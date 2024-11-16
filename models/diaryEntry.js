const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class DiaryEntry extends Model {
    static associate(models) {
      DiaryEntry.belongsTo(models.User, { foreignKey: 'user_id' });
    }
  }

  DiaryEntry.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id'
    },
    chat_id: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'chat_id'
    },
    question_index: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'question_index'
    },
    question: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    response: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    platform: {
      type: DataTypes.STRING,
      defaultValue: 'telegram'
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'DiaryEntry',
    tableName: 'diary_entries',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return DiaryEntry;
}; 