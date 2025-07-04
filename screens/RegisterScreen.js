
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { API_ENDPOINTS } from '../config';
// Importamos los íconos necesarios
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen({ navigation }) {
  const [usuario, setUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0); // 0: débil, 1: media, 2: fuerte
  const [errors, setErrors] = useState({});
  // Nuevos estados para controlar la visibilidad de las contraseñas
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Evaluar la fortaleza de la contraseña cuando cambia
  useEffect(() => {
    evaluatePasswordStrength(password);
  }, [password]);

  // Función para evaluar la fortaleza de la contraseña
  const evaluatePasswordStrength = (pass) => {
    let strength = 0;
    const validations = {
      length: pass.length >= 8,
      hasUpperCase: /[A-Z]/.test(pass),
      hasLowerCase: /[a-z]/.test(pass),
      hasNumber: /[0-9]/.test(pass),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(pass)
    };

    // Calcular puntuación
    let score = 0;
    if (validations.length) score++;
    if (validations.hasUpperCase) score++;
    if (validations.hasLowerCase) score++;
    if (validations.hasNumber) score++;
    if (validations.hasSpecialChar) score++;

    // Determinar nivel de fortaleza
    if (score <= 2) strength = 0; // Débil
    else if (score <= 4) strength = 1; // Media
    else strength = 2; // Fuerte

    setPasswordStrength(strength);
  };

  // Función para validar el formulario
  const validateForm = () => {
    let isValid = true;
    let errors = {};

    if (!usuario.trim()) {
      errors.usuario = 'El nombre de usuario es requerido';
      isValid = false;
    }

    if (!email.trim()) {
      errors.email = 'El correo electrónico es requerido';
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.email = 'Formato de correo electrónico inválido';
        isValid = false;
      }
    }

    if (!password) {
      errors.password = 'La contraseña es requerida';
      isValid = false;
    } else if (password.length < 8) {
      errors.password = 'La contraseña debe tener al menos 8 caracteres';
      isValid = false;
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
      isValid = false;
    }

    setErrors(errors);
    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      const response = await fetch(API_ENDPOINTS.register, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: usuario, email, password }),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Registro exitoso:', data);
        Alert.alert('Éxito', 'Registro completado correctamente');
        // Navegar a la pantalla Home y pasar los datos del usuario
        navigation.navigate('Home', { userData: data });
      } else {
        console.log('Error:', data.message);
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      console.error('Error de red:', error);
      Alert.alert('Error', 'Error de conexión al servidor');
    }
  };

  // Obtener el color de la barra de fortaleza
  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 0: return '#FF3B30'; // Rojo - Débil
      case 1: return '#FF9500'; // Naranja - Media
      case 2: return '#34C759'; // Verde - Fuerte
      default: return '#FF3B30';
    }
  };

  // Obtener el texto de fortaleza
  const getStrengthText = () => {
    switch (passwordStrength) {
      case 0: return 'Insegura';
      case 1: return 'Segura';
      case 2: return 'Muy Segura';
      default: return 'Insegura';
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../assets/clima.jpg')} style={styles.image} />
      <View style={styles.card}>
        <Text style={styles.title}>Registro</Text>
        <TextInput
          style={[styles.input, errors.usuario && styles.inputError]}
          placeholder="Usuario"
          value={usuario}
          onChangeText={setUsuario}
        />
        {errors.usuario && <Text style={styles.errorText}>{errors.usuario}</Text>}
        
        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          placeholder="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.passwordInput, errors.password && styles.inputError]}
            placeholder="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity 
            style={styles.passwordVisibilityBtn}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons 
              name={showPassword ? 'eye-off' : 'eye'} 
              size={24} 
              color="#666" 
            />
          </TouchableOpacity>
        </View>
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        
        {password.length > 0 && (
          <View style={styles.strengthContainer}>
            <View style={styles.strengthBarContainer}>
              <View 
                style={[styles.strengthBar, { 
                  width: `${((passwordStrength + 1) / 3) * 100}%`,
                  backgroundColor: getStrengthColor() 
                }]}
              />
            </View>
            <Text style={[styles.strengthText, { color: getStrengthColor() }]}>
              {getStrengthText()}
            </Text>
          </View>
        )}
        
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.passwordInput, errors.confirmPassword && styles.inputError]}
            placeholder="Confirmar Contraseña"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity 
            style={styles.passwordVisibilityBtn}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Ionicons 
              name={showConfirmPassword ? 'eye-off' : 'eye'} 
              size={24} 
              color="#666" 
            />
          </TouchableOpacity>
        </View>
        {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
        
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>¿Ya tienes cuenta? Inicia Sesión!</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Registrarse</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eee',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  card: {
    backgroundColor: '#fff',
    width: '90%',
    padding: 20,
    borderRadius: 20,
    marginTop: -40,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 5,
  },
  strengthContainer: {
    marginTop: 5,
    marginBottom: 5,
  },
  strengthBarContainer: {
    height: 5,
    backgroundColor: '#E5E5EA',
    borderRadius: 5,
    overflow: 'hidden',
  },
  strengthBar: {
    height: '100%',
  },
  strengthText: {
    fontSize: 12,
    marginTop: 5,
    textAlign: 'right',
  },
  button: {
    backgroundColor: '#1E40AF',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  link: {
    marginTop: 10,
    color: '#1E40AF',
    textAlign: 'center',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    marginTop: 10,
  },
  passwordInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
  },
  passwordVisibilityBtn: {
    position: 'absolute',
    right: 12,
    height: '100%',
    justifyContent: 'center',
  },
});
