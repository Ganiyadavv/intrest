'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('lender_record_repayments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      lenderRecordId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'lender_records',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      returnDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      paymentScreenshot: {
        type: Sequelize.TEXT('long'),
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('lender_record_repayments');
  }
};
