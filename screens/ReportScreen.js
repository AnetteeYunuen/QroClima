import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS } from '../config';

export default function ReportScreen({ navigation, route }) {
  const userData = route.params?.userData || {};
  const [location, setLocation] = useState('');
  const [riskType, setRiskType] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [userReports, setUserReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Tipos de riesgo disponibles
  const riskTypes = [
    'Inundación leve',
    'Inundación severa',
    'Lluvia intensa',
    'Vía bloqueada',
    'Otro'
  ];

  // Cargar reportes del usuario al montar el componente
  useEffect(() => {
    if (userData._id) {
      fetchUserReports();
    }
  }, [userData._id]);

  // Función para obtener los reportes del usuario
  const fetchUserReports = async () => {
    if (!userData._id) return;
    
    setLoadingReports(true);
    try {
      const response = await fetch(API_ENDPOINTS.userReports(userData._id));
      const data = await response.json();
      
      if (response.ok) {
        setUserReports(data);
      } else {
        console.log('Error al obtener reportes:', data.message);
      }
    } catch (error) {
      console.error('Error de red:', error);
    } finally {
      setLoadingReports(false);
    }
  };

  // Función para enviar un nuevo reporte
  const handleSubmitReport = async () => {
    // Validar campos
    if (!location.trim()) {
      Alert.alert('Error', 'Por favor ingresa la ubicación');
      return;
    }
    if (!riskType) {
      Alert.alert('Error', 'Por favor selecciona un tipo de riesgo');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.reports, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userData._id,
          location,
          riskType,
          description,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        Alert.alert('Éxito', 'Reporte enviado correctamente');
        // Limpiar formulario
        setLocation('');
        setRiskType('');
        setDescription('');
        // Actualizar lista de reportes
        fetchUserReports();
      } else {
        Alert.alert('Error', data.message || 'Error al enviar reporte');
      }
    } catch (error) {
      console.error('Error de red:', error);
      Alert.alert('Error', 'Error de conexión al servidor');
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar un reporte
  const handleDeleteReport = async (reportId) => {
    Alert.alert(
      'Confirmar',
      '¿Estás seguro de que deseas eliminar este reporte?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(API_ENDPOINTS.deleteReport(reportId), {
                method: 'DELETE',
              });
              
              if (response.ok) {
                Alert.alert('Éxito', 'Reporte eliminado correctamente');
                // Actualizar lista de reportes
                fetchUserReports();
              } else {
                const data = await response.json();
                Alert.alert('Error', data.message || 'Error al eliminar reporte');
              }
            } catch (error) {
              console.error('Error de red:', error);
              Alert.alert('Error', 'Error de conexión al servidor');
            }
          },
        },
      ]
    );
  };

  // Función para obtener el color según el tipo de riesgo
  const getRiskColor = (type) => {
    switch (type) {
      case 'Inundación leve': return '#facc15'; // Amarillo
      case 'Inundación severa': return '#ef4444'; // Rojo
      case 'Lluvia intensa': return '#f87171'; // Rojo claro
      case 'Vía bloqueada': return '#fb923c'; // Naranja
      case 'Otro': return '#a3a3a3'; // Gris
      default: return '#a3a3a3';
    }
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reporte Ciudadano</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Crear nuevo reporte</Text>
          
          <Text style={styles.inputLabel}>Ubicación</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Av. Constituyentes y Av. Zaragoza"
            value={location}
            onChangeText={setLocation}
          />
          
          <Text style={styles.inputLabel}>Tipo de riesgo</Text>
          <View style={styles.riskTypesContainer}>
            {riskTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.riskTypeButton,
                  riskType === type && { backgroundColor: getRiskColor(type) }
                ]}
                onPress={() => setRiskType(type)}
              >
                <Text 
                  style={[
                    styles.riskTypeText,
                    riskType === type && { color: 'white' }
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={styles.inputLabel}>Descripción (opcional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe brevemente la situación"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmitReport}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Enviar Reporte</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.myReportsSection}>
          <Text style={styles.sectionTitle}>Mis Reportes</Text>
          
          {loadingReports ? (
            <ActivityIndicator color="#1E40AF" size="large" style={styles.loader} />
          ) : userReports.length > 0 ? (
            userReports.map((report) => (
              <View 
                key={report._id} 
                style={[styles.reportCard, { borderLeftColor: getRiskColor(report.riskType) }]}
              >
                <View style={styles.reportHeader}>
                  <Text style={styles.reportLocation}>{report.location}</Text>
                  <TouchableOpacity 
                    onPress={() => handleDeleteReport(report._id)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.reportRiskType}>{report.riskType}</Text>
                {report.description ? (
                  <Text style={styles.reportDescription}>{report.description}</Text>
                ) : null}
                <Text style={styles.reportDate}>{formatDate(report.createdAt)}</Text>
                <View style={styles.reportStatus}>
                  <View style={styles.statusIndicator} />
                  <Text style={styles.statusText}>
                    {report.active ? 'Activo' : 'Inactivo'}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noReportsText}>No has creado reportes aún</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
  },
  header: {
    backgroundColor: '#1E40AF',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: { 
    flex: 1,
    padding: 15,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 15 
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  riskTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  riskTypeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  riskTypeText: {
    fontSize: 14,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#1E40AF',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  myReportsSection: {
    marginBottom: 20,
  },
  reportCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  reportLocation: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  deleteButton: {
    padding: 5,
  },
  reportRiskType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 5,
  },
  reportDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  reportDate: {
    fontSize: 12,
    color: '#888',
    marginBottom: 5,
  },
  reportStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ade80',
    marginRight: 5,
  },
  statusText: {
    fontSize: 12,
    color: '#4ade80',
  },
  loader: {
    marginVertical: 20,
  },
  noReportsText: {
    textAlign: 'center',
    color: '#888',
    marginVertical: 20,
    fontStyle: 'italic',
  },
});