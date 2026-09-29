const { StoredPerson } = require('../models');
const { Op } = require('sequelize');

class StoredPersonService {
  async createRecord(userId, data, file) {
    let paymentScreenshot = null;
    if (file) {
      paymentScreenshot = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    }

    const recordData = {
      ...data,
      userId,
      status: 'PENDING',
      paymentScreenshot
    };
    return await StoredPerson.create(recordData);
  }

  async getAllRecords(userId, status) {
    const where = { userId };
    if (status) {
      where.status = status;
    }
    return await StoredPerson.findAll({ where });
  }

  async getRecordById(userId, id) {
    return await StoredPerson.findOne({
      where: { id, userId }
    });
  }

  async searchRecords(userId, query) {
    return await StoredPerson.findAll({
      where: {
        userId,
        [Op.or]: [
          { name: { [Op.like]: `%${query}%` } },
          { phoneNumber: { [Op.like]: `%${query}%` } }
        ]
      }
    });
  }

  async updateRecord(userId, id, data, file) {
    const record = await this.getRecordById(userId, id);
    if (!record) return null;

    const updateData = { ...data };
    
    // Prevent updating protected fields
    delete updateData.id;
    delete updateData.userId;
    delete updateData.status;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    if (file) {
      updateData.paymentScreenshot = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    }

    await record.update(updateData);
    return record;
  }

  async markAsComplete(userId, id) {
    const record = await this.getRecordById(userId, id);
    if (!record) return { record: null, error: 'NOT_FOUND' };
    
    if (record.status === 'COMPLETE') {
      return { record: null, error: 'ALREADY_COMPLETE' };
    }

    await record.update({ status: 'COMPLETE' });
    return { record, error: null };
  }

  async deleteRecord(userId, id) {
    const record = await this.getRecordById(userId, id);
    if (!record) return false;

    await record.destroy();
    return true;
  }
}

module.exports = new StoredPersonService();

