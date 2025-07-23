const express = require('express');
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  deleteUser
} = require('../controllers/userController');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/:id', getUserProfile);
router.put('/:id', updateUserProfile);
router.delete('/:id', deleteUser);

module.exports = router;
