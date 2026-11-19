const User = require('./User');
const PersonRecord = require('./PersonRecord');
const Notification = require('./Notification');
const PasswordResetOtp = require('./PasswordResetOtp');
const LenderRecord = require('./LenderRecord');
const LenderRecordRepayment = require('./LenderRecordRepayment');
const PersonalRecord = require('./PersonalRecord');
const PersonalRecordRepayment = require('./PersonalRecordRepayment');
const PersonRecordRepayment = require('./PersonRecordRepayment');

User.hasMany(PersonRecord, { foreignKey: 'ownerId', as: 'ownedRecords' });
PersonRecord.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

User.hasMany(PersonRecord, { foreignKey: 'targetUserId', as: 'targetedRecords' });
PersonRecord.belongsTo(User, { foreignKey: 'targetUserId', as: 'targetUser' });

User.hasMany(LenderRecord, { foreignKey: 'ownerId', as: 'ownedLenderRecords' });
LenderRecord.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

User.hasMany(LenderRecord, { foreignKey: 'targetUserId', as: 'lender' });
LenderRecord.belongsTo(User, { foreignKey: 'targetUserId', as: 'targetUser' });

User.hasMany(Notification, { foreignKey: 'recipientId', as: 'receivedNotifications' });
Notification.belongsTo(User, { foreignKey: 'recipientId', as: 'recipient' });

User.hasMany(Notification, { foreignKey: 'senderId', as: 'sentNotifications' });
Notification.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

PersonRecord.hasMany(Notification, { foreignKey: 'personRecordId', as: 'notifications' });
Notification.belongsTo(PersonRecord, { foreignKey: 'personRecordId', as: 'personRecord' });

LenderRecord.hasMany(Notification, { foreignKey: 'lenderRecordId', as: 'notifications' });
Notification.belongsTo(LenderRecord, { foreignKey: 'lenderRecordId', as: 'lenderRecord' });

User.hasMany(PasswordResetOtp, { foreignKey: 'userId', as: 'passwordResetOtps' });
PasswordResetOtp.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(PersonalRecord, { foreignKey: 'ownerId', as: 'personalRecords' });
PersonalRecord.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

PersonalRecord.hasMany(PersonalRecordRepayment, { foreignKey: 'personalRecordId', as: 'repayments', onDelete: 'CASCADE' });
PersonalRecordRepayment.belongsTo(PersonalRecord, { foreignKey: 'personalRecordId', as: 'personalRecord' });

PersonRecord.hasMany(PersonRecordRepayment, { foreignKey: 'personRecordId', as: 'repayments', onDelete: 'CASCADE' });
PersonRecordRepayment.belongsTo(PersonRecord, { foreignKey: 'personRecordId', as: 'personRecord' });

LenderRecord.hasMany(LenderRecordRepayment, { foreignKey: 'lenderRecordId', as: 'repayments', onDelete: 'CASCADE' });
LenderRecordRepayment.belongsTo(LenderRecord, { foreignKey: 'lenderRecordId', as: 'lenderRecord' });

module.exports = { User, PersonRecord, PersonRecordRepayment, Notification, PasswordResetOtp, LenderRecord, LenderRecordRepayment, PersonalRecord, PersonalRecordRepayment };
