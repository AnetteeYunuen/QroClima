const express = require('express');
const { 
  createReport, 
  getReports, 
  getUserReports, 
  updateReport, 
  deleteReport 
} = require('../controllers/reportController');

const router = express.Router();

// Rutas para reportes ciudadanos
router.post('/', createReport);
router.get('/', getReports);
router.get('/user/:userId', getUserReports);
router.put('/:id', updateReport);
router.delete('/:id', deleteReport);

module.exports = router;