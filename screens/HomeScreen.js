import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, TextInput } from 'react-native';

export default function HomeScreen({ navigation, route }) {
  const userData = route.params?.userData || { username: 'Usuario' };
  const [zona, setZona] = useState('');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Hola, {userData.username}</Text>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Image source={require('../assets/Mapa.png')} style={styles.bannerImage} />

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Registrar zona de interés</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre de la zona (Ej. Centro Histórico)"
            value={zona}
            onChangeText={setZona}
          />
          <TouchableOpacity style={styles.buttonDisabled}>
            <Text style={styles.buttonText}>Guardar zona</Text>
          </TouchableOpacity>
          <Text style={styles.infoNote}>* Funcionalidad de ejemplo sin conexión real</Text>
        </View>

        <Text style={styles.sectionTitle}>Zonas reportadas</Text>

        {[
          { nombre: 'Centro Histórico', estado: 'Inundación leve', color: '#facc15' },
          { nombre: 'Boulevard Bernardo Quintana', estado: 'Lluvia intensa', color: '#f87171' },
          { nombre: 'Av. 5 de Febrero', estado: 'Libre de afectaciones', color: '#4ade80' },
        ].map((zona, index) => (
          <View key={index} style={[styles.reportCard, { borderLeftColor: zona.color }]}>
            <Text style={styles.zonaNombre}>{zona.nombre}</Text>
            <Text style={styles.zonaEstado}>{zona.estado}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#1E40AF',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 5,
  },
  logoutText: { color: 'white' },
  content: { flex: 1 },
  bannerImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  card: {
    backgroundColor: 'white',
    margin: 15,
    padding: 15,
    borderRadius: 15,
    elevation: 3,
  },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  input: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: '#1E40AF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontWeight: 'bold' },
  infoNote: {
    fontSize: 12,
    marginTop: 8,
    color: '#888',
    fontStyle: 'italic',
  },
  reportCard: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginBottom: 10,
    padding: 15,
    borderLeftWidth: 6,
    borderRadius: 10,
    elevation: 2,
  },
  zonaNombre: { fontWeight: 'bold', fontSize: 16 },
  zonaEstado: { color: '#555', marginTop: 5 },
});
