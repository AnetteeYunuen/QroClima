import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Alert, Linking, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS } from '../config';
import useLocationAlert from '../hooks/useLocationAlert';
import MapView, { Marker, Circle, Polygon } from 'react-native-maps';

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
  const [ubicaciones, setUbicaciones] = useState({});
  const [tempZone, setTempZone] = useState(null);
  const zonaParaGuardar = {
    name: tempZone.name || tempZone.nombre || tempZone.label || '',
    coordinates: tempZone.coordinates || [],
  };
  const zonasQueretaro = [
    {
      id: '1',
      name: 'Pie de la Cuesta',
      coordinates: [
        { latitude: 20.619824012933748, longitude: -100.42239164063324 },
        { latitude: 20.619824012933748, longitude: -100.38184007933204 },
        { latitude: 20.666874673239292, longitude: -100.38184007933204 },
        { latitude: 20.666874673239292, longitude: -100.42239164063324 },
        { latitude: 20.619824012933748, longitude: -100.42239164063324 }
      ],
    },
    {
      id: '2',
      name: 'Centro',
      coordinates: [
        { latitude: 20.580697047313393, longitude: -100.37129591223761 },
        { latitude: 20.601634175367963, longitude: -100.37129591223761 },
        { latitude: 20.601634175367963, longitude: -100.41546964501282 },
        { latitude: 20.580697047313393, longitude: -100.41546964501282 },
        { latitude: 20.580697047313393, longitude: -100.37129591223761 } // cierre del polígono
      ],
    },
    {
      id: '3',
      name: 'Juriquilla',
      coordinates: [
        { latitude: 20.688522774825472, longitude: -100.43739647549047 },
        { latitude: 20.728954217788996, longitude: -100.43739647549047 },
        { latitude: 20.728954217788996, longitude: -100.4752514456908 },
        { latitude: 20.688522774825472, longitude: -100.4752514456908 },
        { latitude: 20.688522774825472, longitude: -100.43739647549047 }
      ],
    },
    {
      id: '4',
      name: 'El Refugio',
      coordinates: [
        { latitude: 20.633735800083528, longitude: -100.36441275460494 },
        { latitude: 20.633735800083528, longitude: -100.34388163159771 },
        { latitude: 20.664753806168406, longitude: -100.34388163159771 },
        { latitude: 20.664753806168406, longitude: -100.36441275460494 },
        { latitude: 20.633735800083528, longitude: -100.36441275460494 }
      ],
    },
  ];


  // Pide ubicación del usuario al montar
  useEffect(() => {
    let locationSubscription;
    let intervalId;

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
      // Solo se anima una vez
      mapRef.current?.animateToRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      // Suscripción para actualizar coordenadas sin animar
      locationSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
        (newLocation) => {
          setCoords(newLocation.coords); // Se actualiza en silencio
        }
      );
    })();

    // Cada 10 segundos refresca los reportes (sin animaciones)
    intervalId = setInterval(fetchReports, 10000);

    return () => {
      if (locationSubscription) locationSubscription.remove();
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const obtenerDireccion = async (lat, lng, id) => {
    try {
      const [direccion] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });

      if (direccion) {
        const nombre = `${direccion.name || ''} ${direccion.street || ''}, ${direccion.city || direccion.region || ''}`;
        setUbicaciones(prev => ({ ...prev, [id]: nombre.trim() }));
      }
    } catch (error) {
      console.error("Error obteniendo dirección:", error);
    }
  };

  useEffect(() => {
    if (!loadingReports && reports.length > 0) {
      reports.forEach(report => {
        if (!ubicaciones[report._id]) {
          const [lat, lng] = report.location.split(',').map(Number);
          obtenerDireccion(lat, lng, report._id);
        }
      });
    }
  }, [loadingReports, reports]);

  const getRiskColor = (type) => {
    switch (type) {
      case 'inundacion_severa': return 'rgba(255, 0, 0, 0.4)';
      case 'inundacion_leve': return 'rgba(255, 165, 0, 0.4)';
      case 'lluvia_intensa': return 'rgba(255, 255, 0, 0.4)';
      default: return 'rgba(200, 200, 200, 0.3)';
    }
  };

  const areReportsEqual = (a, b) => {
    if (a.length !== b.length) return false;
    return a.every((rep, i) => rep._id === b[i]._id);
  };

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const resp = await fetch(API_ENDPOINTS.reports);
      const data = await resp.json();
      if (!areReportsEqual(data, reports)) {
        setReports(data); // solo actualiza si hay cambios
      }
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

      <ScrollView style={styles.content} contentContainerStyle={{ flexGrow: 1, paddingBottom: 30 }}>

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
              showsUserLocation={true}
              showsMyLocationButton={true}
            >

              {/* Mostrar polígono temporal de la zona seleccionada */}
              {tempZone && tempZone.coordinates.length >= 3 && (
                <Polygon
                  coordinates={tempZone.coordinates}
                  strokeColor="#FF0000"
                  fillColor="transparent"
                  strokeWidth={2}
                  lineDashPattern={[10, 5]}
                />
              )}

              {/* Riesgos como círculos rojos */}
              {reports.map((report) => {
                const [lat, lng] = report.location.split(',').map(Number);
                if (isNaN(lat) || isNaN(lng)) return null;

                if (report.riskType === 'accidente') {
                  return (
                    <Marker
                      key={report._id}
                      coordinate={{ latitude: lat, longitude: lng }}
                      title="Accidente"
                    >
                      <Ionicons name="warning" size={30} color="orange" />
                    </Marker>
                  );
                }

                return (
                  <Circle
                    key={report._id}
                    center={{ latitude: lat, longitude: lng }}
                    radius={70}
                    strokeColor={getRiskColor(report.riskType)}
                    fillColor={getRiskColor(report.riskType)}
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

        <Text style={styles.sectionTitle}>Zonas reportadas</Text>

        {loadingReports ? (
          <ActivityIndicator size="small" color="#1E40AF" style={{ marginTop: 10 }} />
        ) : reports.length === 0 ? (
          <Text style={{ marginLeft: 15, color: '#999' }}>No hay reportes disponibles.</Text>
        ) : (
          reports.map((report, index) => {
            const [lat, lng] = report.location.split(',').map(Number);
            const tipo = riskTypes.find(r => r.id === report.riskType)?.label || 'Desconocido';

            let color = '#d1d5db'; // gris claro por defecto
            switch (report.riskType) {
              case 'inundacion_severa': color = '#ef4444'; break;
              case 'inundacion_leve': color = '#f59e0b'; break;
              case 'lluvia_intensa': color = '#eab308'; break;
              case 'accidente': color = '#f97316'; break;
              default: color = '#a3a3a3';
            }

            return (
              <TouchableOpacity
                key={report._id || index}
                style={[styles.reportCard, { borderLeftColor: color }]}
                onPress={() => {
                  mapRef.current?.animateToRegion({
                    latitude: lat,
                    longitude: lng,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }, 1000);
                }}
              >
                <Text style={styles.zonaNombre}>{ubicaciones[report._id] || 'Zona reportada'}</Text>
                <Text style={styles.zonaEstado}>{tipo}</Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
      {/* Reemplaza el código del selector con: */}
      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Seleccionar zona de interés</Text>
          <Picker
            selectedValue={zona}
            onValueChange={(itemValue, itemIndex) => {
              if (itemValue) {
                setZona(itemValue);
                const selectedZone = zonasQueretaro.find(z => z.name === itemValue);
                if (selectedZone) {
                  setTempZone(selectedZone);
                }
              }
            }}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            <Picker.Item label="Selecciona una zona" value="" />
            {zonasQueretaro.map((zona) => (
              <Picker.Item key={zona.id} label={zona.name} value={zona.name} />
            ))}
          </Picker>

          {/* Botón siempre visible con funcionalidad para guardar zona */}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#4CAF50', marginTop: 10 }]}
            onPress={async () => {
              if (!tempZone) {
                Alert.alert('Selecciona una zona', 'Por favor selecciona una zona antes de guardar');
                return;
              }
              try {
                const zonaParaGuardar = {
                  name: tempZone.name || tempZone.nombre || tempZone.label || '',
                  coordinates: tempZone.coordinates || [],
                };

                const resp = await fetch(API_ENDPOINTS.zonasInteres, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    userId: userData._id,
                    zona: zonaParaGuardar,
                  }),
                });

                if (!resp.ok) {
                  const errorData = await resp.json();
                  throw new Error(errorData.message || 'No se pudo guardar la zona');
                }

                Alert.alert('Zona guardada', 'Tu zona de interés ha sido registrada correctamente');

                setTempZone(null);
                setZona('');
              } catch (error) {
                Alert.alert('Error', error.message || 'Ocurrió un error al guardar la zona');
              }
            }}
          >
            <Text style={styles.buttonText}>Guardar zona</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    marginHorizontal: 15,
    marginTop: 10
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
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
  picker: {
    width: '100%',
    marginVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
  },
  pickerItem: {
    fontSize: 16,
    color: '#333',
  },
});

