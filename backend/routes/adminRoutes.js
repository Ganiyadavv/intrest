const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const adminController = require('../controllers/adminController');

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/dashboard', adminController.getDashboard);
router.get('/members', adminController.getMembers);
router.get('/members/:id', adminController.getMember);
router.put('/members/:id/status', adminController.updateMemberStatus);

module.exports = router;
