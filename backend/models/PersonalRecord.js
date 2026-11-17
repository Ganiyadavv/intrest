const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const PersonalRecord = sequelize.define("PersonalRecord", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ownerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  relationship: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "Friend"
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  recordType: {
    type: DataTypes.ENUM("INTEREST_FREE", "GIFT"),
    allowNull: false,
    defaultValue: "INTEREST_FREE"
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01
    }
  },
  givenDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  expectedReturnDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  paymentScreenshot: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  totalReturned: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  remainingAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  status: {
    type: DataTypes.ENUM("PENDING", "PARTIALLY_RETURNED", "FULLY_RETURNED", "GIFT"),
    allowNull: false,
    defaultValue: "PENDING"
  }
}, {
  tableName: "personal_records",
  timestamps: true
});

module.exports = PersonalRecord;
