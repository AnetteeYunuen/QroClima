import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Alert, Linking, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS } from '../config';
import useLocationAlert from '../hooks/useLocationAlert';
import MapView, { Marker, UrlTile, Circle } from 'react-native-maps';
import { Dimensions } from 'react-native';

const riskTypes = [
  { id: 'inundacion_leve', label: 'Inundación leve' },
  { id: 'inundacion_severa', label: 'Inundación severa' },
  { id: 'lluvia_intensa', label: 'Lluvia intensa' },
  { id: 'accidente', label: 'Accidente' },
];

export default function HomeScreen({ navigation, route }) {
  useLocationAlert();
  const userData = route.params?.userData || { username: 'Usuario' };
  const mapRef = useRef(null);
  const [zona, setZona] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [coords, setCoords] = useState(null);
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);

  // Pide ubicación del usuario al montar
  useEffect(() => {
    let locationSubscription;

    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Activa ubicación en ajustes', [
          { text: 'Abrir Ajustes', onPress: () => Linking.openSettings() },
          { text: 'Cancelar', style: 'cancel' }
        ]);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCoords(loc.coords);
      mapRef.current?.animateToRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      locationSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
        (newLocation) => {
          setCoords(newLocation.coords);
        }
      );
    })();

    fetchReports();

    return () => {
      if (locationSubscription) locationSubscription.remove();
    };
  }, []);

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const resp = await fetch(API_ENDPOINTS.reports);
      const data = await resp.json();
      // Se espera que cada report tenga lat/lng; si no, ajustar parsing
      setReports(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingReports(false);
    }
  };

  const goToProfile = () => {
    navigation.navigate('ProfileScreen', { userData });
  };


  const getLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permiso requerido',
          'Por favor activa los permisos de ubicación en ajustes para poder reportar',
          [
            { text: 'Abrir Ajustes', onPress: () => Linking.openSettings() },
            { text: 'Cancelar', style: 'cancel' }
          ]
        );
        return null;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 15000,
      });

      return location.coords;

    } catch (error) {
      Alert.alert(
        'Error de ubicación',
        `No se pudo obtener tu ubicación. Razón: ${error.message || 'desconocida'}`,
        [{ text: 'Reintentar', onPress: async () => await getLocation() }]
      );
      return null;
    }
  };

  const handleReport = async () => {
    if (!selectedRisk) {
      Alert.alert('Error', 'Por favor selecciona un tipo de riesgo');
      return;
    }

    try {
      const coords = await getLocation();
      if (!coords) return;

      const reportData = {
        userId: userData._id,
        location: `${coords.latitude},${coords.longitude}`,
        riskType: selectedRisk.id,
        description: ''
      };

      const response = await fetch(API_ENDPOINTS.reports, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al enviar reporte');
      }

      setModalVisible(false); // Cierra el modal antes de mostrar la alerta
      Alert.alert(
        'Reporte exitoso',
        `Se ha registrado ${selectedRisk.label} en tu ubicación`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      Alert.alert(
        'Error',
        error.message.includes('Failed to fetch')
          ? 'No se pudo conectar al servidor. Verifica tu conexión a internet.'
          : error.message,
        [
          { text: 'Reintentar', onPress: handleReport },
          { text: 'Verificar Servidor', onPress: () => Linking.openURL(API_ENDPOINTS.reports.split('/api')[0]) }
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Hola, {userData.username}</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.reportButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="warning" size={16} color="white" />
            <Text style={styles.reportButtonText}>Reportar</Text>
          </TouchableOpacity>
          <Ionicons name="person" size={24} color="white" onPress={goToProfile} />
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Reportar problema</Text>

            {riskTypes.map((risk) => (
              <TouchableOpacity
                key={risk.id}
                style={[
                  styles.riskOption,
                  selectedRisk?.id === risk.id && styles.selectedRisk
                ]}
                onPress={() => setSelectedRisk(risk)}
              >
                <Text style={styles.riskText}>{risk.label}</Text>
              </TouchableOpacity>
            ))}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonCancel]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonSubmit]}
                onPress={handleReport}
              >
                <Text style={styles.textStyle}>Enviar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.content}>
        <View style={styles.mapContainer}>
          {coords ? (
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={{
                latitude: coords.latitude,
                longitude: coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <UrlTile
                urlTemplate="http://c.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maximumZ={19}
              />
              <Marker
                coordinate={coords}
                title="Tú estás aquí"
                pinColor="blue"
              />

              {/* Riesgos como círculos rojos */}
              {!loadingReports && reports.map(report => {
                const [lat, lng] = report.location.split(',').map(Number);
                if (isNaN(lat) || isNaN(lng)) return null;
                return (
                  <Circle
                    key={report._id}
                    center={{ latitude: lat, longitude: lng }}
                    radius={70}
                    strokeColor="rgba(255, 0, 0, 0.8)"
                    fillColor="rgba(255, 0, 0, 0.3)"
                  />
                );
              })}
            </MapView>
          ) : (
            <View style={styles.loader}>
              <ActivityIndicator size="large" />
              <Text>Cargando ubicación...</Text>
            </View>
          )}
        </View>

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
  welcomeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  reportButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
    fontSize: 14,
  },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 5,
  },
  logoutText: {
    color: 'white',
    fontSize: 14,
  },
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    marginLeft: 15,
    marginTop: 10,
  },
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
  buttonText: {
    color: 'white',
    fontWeight: 'bold'
  },
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
  zonaNombre: {
    fontWeight: 'bold',
    fontSize: 16
  },
  zonaEstado: {
    color: '#555',
    marginTop: 5
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1E40AF',
    textAlign: 'center',
  },
  riskOption: {
    padding: 15,
    marginVertical: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  selectedRisk: {
    backgroundColor: '#1E40AF',
  },
  riskText: {
    fontSize: 16,
  },
  selectedRiskText: {
    color: 'white',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    padding: 12,
    borderRadius: 10,
    width: '48%',
    alignItems: 'center',
  },
  buttonCancel: {
    backgroundColor: '#f0f0f0',
  },
  buttonCancelText: {
    color: '#333',
    fontWeight: 'bold',
  },
  buttonSubmit: {
    backgroundColor: '#1E40AF',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
  },
  mapContainer: {
    width: '100%',
    height: 250,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    marginBottom: 10,
  },
  map: {
    flex: 1,
  },
});
