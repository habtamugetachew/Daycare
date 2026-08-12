const express = require('express');
const router = express.Router();
const { getInbox, getSent, getThread, sendMessage, markRead, deleteMessage, getUnreadCount, getAnnouncements } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.get('/inbox', getInbox);
router.get('/sent', getSent);
router.get('/unread-count', getUnreadCount);
router.get('/announcements', getAnnouncements);
router.get('/:id/thread', getThread);
router.post('/', upload.single('attachment'), sendMessage);
router.put('/:id/read', markRead);
router.delete('/:id', deleteMessage);

module.exports = router;
