const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const LenderRecordRepayment = sequelize.define("LenderRecordRepayment", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  lenderRecordId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'lender_records',
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
  tableName: "lender_record_repayments",
  timestamps: true
});

module.exports = LenderRecordRepayment;
