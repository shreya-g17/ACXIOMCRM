const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, remove, convertLead } = require('../controllers/leadController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(getAll).post(create);
router.route('/:id').get(getById).put(update).delete(remove);
router.post('/:id/convert', convertLead);

module.exports = router;
