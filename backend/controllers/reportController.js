const Report = require('../models/reportModel');
const User = require('../models/userModel');

// Crear un nuevo reporte ciudadano
const createReport = async (req, res) => {
  try {
    const { userId, location, riskType, description } = req.body;

    // Validaciones
    if (!userId || !location || !riskType) {
      return res.status(400).json({ message: 'Los campos userId, location y riskType son requeridos' });
    }

    // Verificar que el usuario existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Crear el reporte
    const report = await Report.create({
      user: userId,
      username: user.username,
      location,
      riskType,
      description: description || '',
    });

    if (report) {
      res.status(201).json(report);
    } else {
      res.status(400).json({ message: 'Datos de reporte inválidos' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener todos los reportes activos
const getReports = async (req, res) => {
  try {
    // Obtener solo reportes activos, ordenados por fecha de creación (más recientes primero)
    const reports = await Report.find({ active: true })
      .sort({ createdAt: -1 })
      .limit(50); // Limitar a 50 reportes para evitar sobrecarga

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener reportes de un usuario específico
const getUserReports = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Verificar que el usuario existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Obtener reportes del usuario
    const reports = await Report.find({ user: userId })
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar un reporte
const updateReport = async (req, res) => {
  try {
    const reportId = req.params.id;
    const { riskType, description, active } = req.body;

    // Verificar que el reporte existe
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Reporte no encontrado' });
    }

    // Actualizar campos
    if (riskType) report.riskType = riskType;
    if (description !== undefined) report.description = description;
    if (active !== undefined) report.active = active;

    const updatedReport = await report.save();
    res.json(updatedReport);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Eliminar un reporte (desactivarlo)
const deleteReport = async (req, res) => {
  try {
    const reportId = req.params.id;

    // Verificar que el reporte existe
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Reporte no encontrado' });
    }

    // Desactivar el reporte en lugar de eliminarlo
    report.active = false;
    await report.save();

    res.json({ message: 'Reporte desactivado correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createReport, getReports, getUserReports, updateReport, deleteReport };