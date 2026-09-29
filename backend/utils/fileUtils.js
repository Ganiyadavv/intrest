const fs = require('fs');
const path = require('path');

const deleteFile = (filePath) => {
  if (filePath) {
    const fullPath = path.join(__dirname, '..', filePath);
    fs.unlink(fullPath, (err) => {
      if (err && err.code !== 'ENOENT') {
        console.error(`Failed to delete file: ${fullPath}`, err);
      }
    });
  }
};

module.exports = {
  deleteFile
};
