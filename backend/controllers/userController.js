const User = require('../models/userModel');
const bcrypt = require('bcryptjs'); // Necesitamos instalar esta dependencia

// Registrar un nuevo usuario
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validaciones de seguridad
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Formato de correo electrónico inválido' });
    }

    // Validar fortaleza de contraseña
    if (password.length < 8) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' });
    }

    // Verificar si el usuario ya existe
    const userExists = await User.findOne({ $or: [{ username }, { email }] });
    if (userExists) {
      return res.status(400).json({ message: 'El usuario o correo ya existe' });
    }

    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear nuevo usuario
    const user = await User.create({
      username,
      email,
      password: hashedPassword, // Guardar la contraseña hasheada
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

    if (!username || !password) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    // Buscar usuario por nombre de usuario o correo
    const user = await User.findOne({ 
      $or: [{ username }, { email: username }]
    });

    // Verificar si el usuario existe y la contraseña es correcta
    if (user && (await bcrypt.compare(password, user.password))) {
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