import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, Alert } from 'react-native';
import { API_ENDPOINTS } from '../config';

export default function ProfileScreen({ navigation, route }) {
  const [userId, setUserId] = useState(''); // Este ID lo debes recibir desde el login
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
  const user = route.params?.userData;
  if (user) {
    setUserId(user._id);
    setName(user.username);
    setPhone(user.phone || '');
    setEmail(user.email);
  }
}, []);

  const handleSave = async () => {
    if (!name || !phone || !email) {
      Alert.alert('Campos incompletos', 'Completa todos los campos');
      return;
    }

    try {
      const res = await fetch(`${API_ENDPOINTS.users}/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name, phone, email })
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('Éxito', 'Perfil actualizado');
        setEditing(false);
      } else {
        Alert.alert('Error', data.message || 'No se pudo actualizar');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Algo salió mal');
    }
  };

  const handleDelete = async () => {
    Alert.alert('Confirmar', '¿Estás seguro de eliminar tu perfil?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${API_ENDPOINTS.users}/${userId}`, {
              method: 'DELETE'
            });
            if (res.ok) {
              Alert.alert('Cuenta eliminada', 'Tu cuenta ha sido eliminada');
              navigation.navigate('Login');
            } else {
              const data = await res.json();
              Alert.alert('Error', data.message);
            }
          } catch (err) {
            Alert.alert('Error', 'No se pudo eliminar');
          }
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Perfil</Text>
      <View style={styles.card}>
        <Image source={require('../assets/avatar.png')} style={styles.avatar} />

        {editing ? (
          <>
            <TextInput style={styles.input} placeholder="Nombre completo" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Teléfono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <TextInput style={styles.input} placeholder="Correo electrónico" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <TouchableOpacity style={styles.button} onPress={handleSave}>
              <Text style={styles.buttonText}>Guardar</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.phone}>{phone}</Text>
            <Text style={styles.email}>{email}</Text>
            <TouchableOpacity style={styles.button} onPress={() => setEditing(true)}>
              <Text style={styles.buttonText}>Modificar Datos</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={[styles.button, { backgroundColor: '#EF4444' }]} onPress={handleDelete}>
          <Text style={styles.buttonText}>Eliminar Cuenta</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, { backgroundColor: '#6B7280' }]} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.buttonText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
          <Text style={styles.backText}>← Volver al inicio</Text>
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
    paddingTop: 40,
  },
  header: {
    fontSize: 18,
    color: '#aaa',
    marginBottom: 10,
    alignSelf: 'flex-start',
    marginLeft: 20,
  },
  card: {
    backgroundColor: 'white',
    width: '85%',
    borderRadius: 10,
    alignItems: 'center',
    padding: 20,
  },
  avatar: {
    width: 90,
    height: 90,
    marginBottom: 15,
    resizeMode: 'contain',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  phone: {
    fontSize: 16,
    marginTop: 4,
  },
  email: {
    fontSize: 14,
    marginTop: 4,
    color: '#555',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#1E40AF',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginVertical: 5,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  backLink: {
    marginTop: 15,
  },
  backText: {
    color: '#1E40AF',
    fontSize: 14,
  },
  input: {
    width: '100%',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
});
