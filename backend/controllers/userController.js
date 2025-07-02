const User = require('../models/userModel');

// Registrar un nuevo usuario
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Verificar si el usuario ya existe
    const userExists = await User.findOne({ $or: [{ username }, { email }] });
    if (userExists) {
      return res.status(400).json({ message: 'El usuario o correo ya existe' });
    }

    // Crear nuevo usuario
    const user = await User.create({
      username,
      email,
      password, // En una aplicación real, deberías hashear la contraseña
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email
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

    // Buscar usuario por nombre de usuario o correo
    const user = await User.findOne({ 
      $or: [{ username }, { email: username }]
    });

    // Verificar si el usuario existe y la contraseña es correcta
    if (user && user.password === password) { // En una app real, compararías hashes
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email
      });
    } else {
      res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser };