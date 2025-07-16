// useLocationAlert.js
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as Speech from 'expo-speech';
import { useEffect } from 'react';

export default function useLocationAlert() {
  useEffect(() => {
    let locationSubscription;

    const startTracking = async () => {
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      const { status: notificationStatus } = await Notifications.requestPermissionsAsync();

      if (locationStatus !== 'granted' || notificationStatus !== 'granted') {
        console.log('Permiso de ubicación o notificaciones denegado');
        return;
      }

      // ----- FORZAR NOTIFICACIÓN Y VOZ PARA PRUEBA -----
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🚨 Prueba de alerta',
          body: 'Esto es solo una prueba de notificación local.',
          sound: true,
        },
        trigger: null, // notificación inmediata
      });

      Speech.speak('Esto es una prueba de voz desde QroClima');
      // --------------------------------------------------

      locationSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Highest, timeInterval: 10000, distanceInterval: 100 },
        async (location) => {
          const { latitude, longitude } = location.coords;

          try {
            const res = await fetch(`http://192.168.100.21:5000/api/reports/nearby`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lat: latitude, lng: longitude }),
            });

            const data = await res.json();

            if (res.ok && data && data.alert) {
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: '🚨 Reporte cercano',
                  body: `${data.message}`,
                  sound: true,
                },
                trigger: null,
              });

              Speech.speak(data.message);
            }
          } catch (error) {
            console.log('Error al obtener reportes cercanos', error);
          }
        }
      );
    };

    startTracking();

    return () => {
      if (locationSubscription) locationSubscription.remove();
    };
  }, []);
}
