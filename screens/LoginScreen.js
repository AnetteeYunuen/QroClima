import { set } from 'mongoose';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { API_ENDPOINTS } from '../config';

export default function LoginScreen({ navigation }) {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  // Función para validar el formulario
  const validateForm = () => {
    let isValid = true;
    let errors = {};

    if (!correo.trim()) {
      errors.correo = 'El usuario o correo es requerido';
      isValid = false;
    }

    if (!password) {
      errors.password = 'La contraseña es requerida';
      isValid = false;
    }

    setErrors(errors);
    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      console.log('Iniciando solicitud de login...');
      const response = await fetch(API_ENDPOINTS.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: correo, password }),
      });
  
      console.log('Respuesta recibida:', response.status, response.statusText);
      
      const data = await response.json();
      console.log('Datos recibidos:', data);
      
      if (response.ok) {
        console.log('Login exitoso:', data);
        // Navegar a la pantalla Home y pasar los datos del usuario
        navigation.navigate('Home', { userData: data });
      } else {
        console.log('Error en respuesta:', data.message);
        // Usar Alert con un timeout para asegurar que se muestre
        setTimeout(() => {
          Alert.alert(
            'Credenciales incorrectas', 
            data.message || 'Usuario o contraseña incorrectos',
            [{ text: 'Intentar de nuevo', style: 'default' }]
          );
        }, 100);
      }
    } catch (error) {
      console.error('Error completo:', error);
      setTimeout(() => {
        Alert.alert(
          'Error de conexión', 
          'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
          [{ text: 'OK', style: 'default' }]
        );
      }, 100);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../assets/clima.jpg')} style={styles.image} />
      <View style={styles.card}>
        <Text style={styles.title}>Iniciar Sesión</Text>
        <TextInput
          style={[styles.input, errors.correo && styles.inputError]}
          placeholder="Correo o usuario"
          value={correo}
          onChangeText={setCorreo}
          autoCapitalize="none"
        />
        {errors.correo && <Text style={styles.errorText}>{errors.correo}</Text>}
        
        <TextInput
          style={[styles.input, errors.password && styles.inputError]}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>¿No tienes cuenta? ¡Regístrate!</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Iniciar Sesión</Text>
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
});