const User = require('./User');
const PersonRecord = require('./PersonRecord');
const Notification = require('./Notification');
const PasswordResetOtp = require('./PasswordResetOtp');
const LenderRecord = require('./LenderRecord');
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

module.exports = { User, PersonRecord, Notification, PasswordResetOtp, LenderRecord };
