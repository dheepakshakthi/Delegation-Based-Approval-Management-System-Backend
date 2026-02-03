const express = require('express');
const { deleteComment } = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Delete comment route
router.delete('/:id', deleteComment);

module.exports = router;
