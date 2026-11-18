const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const PersonRecordRepayment = sequelize.define("PersonRecordRepayment", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  personRecordId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'person_records',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01
    }
  },
  returnDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  paymentScreenshot: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  }
}, {
  tableName: "person_record_repayments",
  timestamps: true
});

module.exports = PersonRecordRepayment;
