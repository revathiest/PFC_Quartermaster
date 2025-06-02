const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('HuntSubmission', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    review_comment: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    hunt_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    poi_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    image_url: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false
    },
    reviewer_id: {
      type: DataTypes.STRING,
      allowNull: true
    },
    review_message_id: {
      type: DataTypes.STRING,
      allowNull: true
    },
    review_channel_id: {
      type: DataTypes.STRING,
      allowNull: true
    },
    supersedes_submission_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    submitted_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    reviewed_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'hunt_submissions',
    timestamps: false
  });
};
