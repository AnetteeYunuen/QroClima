const User = require('../models/userModel');

// Registrar un nuevo usuario
const registerUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Verificar si el usuario ya existe
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    // Crear nuevo usuario
    const user = await User.create({
      username,
      password, // En una aplicación real, deberías hashear la contraseña
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
      });
    } else {
      res.status(400).json({ message: 'Datos de usuario inválidos' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Autenticar usuario
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Buscar usuario por nombre de usuario
    const user = await User.findOne({ username });

    // Verificar si el usuario existe y la contraseña es correcta
    if (user && user.password === password) { // En una app real, compararías hashes
      res.json({
        _id: user._id,
        username: user.username,
      });
    } else {
      res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser };