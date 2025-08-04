const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

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

// Obtener perfil
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (user) res.json(user);
    else res.status(404).json({ message: 'Usuario no encontrado' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar perfil
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      user.username = req.body.username || user.username;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;

      const updatedUser = await user.save();
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'Usuario no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Eliminar usuario
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (user) res.json({ message: 'Usuario eliminado correctamente' });
    else res.status(404).json({ message: 'Usuario no encontrado' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addZonaDeInteres = async (req, res) => {
  const { userId, zona } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    user.zonasDeInteres.push(zona);
    await user.save();

    res.status(200).json({ message: 'Zona de interés guardada correctamente', zona });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al guardar zona de interés' });
  }
};

module.exports = { registerUser, loginUser, getUserProfile, updateUserProfile, deleteUser, addZonaDeInteres };
