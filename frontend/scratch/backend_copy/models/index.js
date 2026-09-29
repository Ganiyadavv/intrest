const User = require('./User');
const PersonRecord = require('./PersonRecord');
const Notification = require('./Notification');

User.hasMany(PersonRecord, { foreignKey: 'ownerId', as: 'ownedRecords' });
PersonRecord.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

User.hasMany(PersonRecord, { foreignKey: 'targetUserId', as: 'targetedRecords' });
PersonRecord.belongsTo(User, { foreignKey: 'targetUserId', as: 'targetUser' });

User.hasMany(Notification, { foreignKey: 'recipientId', as: 'receivedNotifications' });
Notification.belongsTo(User, { foreignKey: 'recipientId', as: 'recipient' });

User.hasMany(Notification, { foreignKey: 'senderId', as: 'sentNotifications' });
Notification.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

PersonRecord.hasMany(Notification, { foreignKey: 'personRecordId', as: 'notifications' });
Notification.belongsTo(PersonRecord, { foreignKey: 'personRecordId', as: 'personRecord' });

module.exports = { User, PersonRecord, Notification };
